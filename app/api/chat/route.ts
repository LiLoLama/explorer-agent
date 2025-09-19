import { NextRequest, NextResponse } from 'next/server';

import {
  assertAllowedUrl,
  buildForwardHeaders,
  filterExtraHeaders,
  getDefaultWebhook,
  sanitizeInput,
} from '@/lib/proxy';
import { formatSSE, passthroughSSE } from '@/lib/sse';
import type { ChatRequestPayload } from '@/lib/types';

const RATE_LIMIT = 60;
const WINDOW_MS = 60_000;

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

export const runtime = 'nodejs';

function getClientIp(request: NextRequest): string {
  const header = request.headers.get('x-forwarded-for');
  if (header) {
    return header.split(',')[0]?.trim() ?? 'unknown';
  }
  const nodeRequest = request as NextRequest & { ip?: string | null };
  return nodeRequest.ip ?? 'unknown';
}

function consumeToken(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip) ?? { tokens: RATE_LIMIT, updatedAt: now };
  const elapsed = now - bucket.updatedAt;
  if (elapsed > WINDOW_MS) {
    bucket.tokens = RATE_LIMIT;
    bucket.updatedAt = now;
  }
  if (bucket.tokens <= 0) {
    buckets.set(ip, bucket);
    return false;
  }
  bucket.tokens -= 1;
  bucket.updatedAt = now;
  buckets.set(ip, bucket);
  return true;
}

function sanitizeMessages(
  messages: ChatRequestPayload['messages'],
): ChatRequestPayload['messages'] {
  return messages.map((message) => ({
    id: sanitizeInput(message.id),
    role: message.role,
    content: sanitizeInput(message.content),
  }));
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!consumeToken(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const maxBytes = Number(process.env.MAX_REQUEST_BYTES ?? '5000000');
  const timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS ?? '30000');

  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > maxBytes) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  let payload: ChatRequestPayload | null = null;
  let audioFile: File | null = null;
  let forwardBody: BodyInit | null = null;
  let forwardHeaders: Headers | null = null;

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const conversationId = sanitizeInput(formData.get('conversationId'));
      const messagesField = formData.get('messages');
      if (!conversationId || typeof messagesField !== 'string') {
        return NextResponse.json(
          { error: 'Invalid form payload' },
          { status: 400 },
        );
      }
      const messages = sanitizeMessages(JSON.parse(messagesField));
      const extraHeadersField = formData.get('extraHeaders');
      let parsedHeaders: Record<string, string> | undefined;
      if (typeof extraHeadersField === 'string') {
        try {
          parsedHeaders = JSON.parse(extraHeadersField);
        } catch (error) {
          console.error('Invalid headers format', error);
          return NextResponse.json(
            { error: 'Invalid headers format' },
            { status: 400 },
          );
        }
      }
      const streamField = formData.get('stream');
      const webhookField = formData.get('userWebhook');
      audioFile =
        formData.get('audio') instanceof File
          ? (formData.get('audio') as File)
          : null;
      if (audioFile && audioFile.size > maxBytes) {
        return NextResponse.json(
          { error: 'Audio attachment too large' },
          { status: 413 },
        );
      }
      payload = {
        conversationId,
        messages,
        stream: streamField ? streamField.toString() === 'true' : undefined,
        userWebhook:
          typeof webhookField === 'string'
            ? sanitizeInput(webhookField)
            : undefined,
        extraHeaders: parsedHeaders,
      };
      const filteredHeaders = filterExtraHeaders(payload.extraHeaders);
      payload.extraHeaders = filteredHeaders;
      const forwardForm = new FormData();
      forwardForm.set('conversationId', payload.conversationId);
      forwardForm.set('messages', JSON.stringify(payload.messages));
      if (payload.stream !== undefined) {
        forwardForm.set('stream', String(payload.stream));
      }
      if (payload.userWebhook) {
        forwardForm.set('userWebhook', payload.userWebhook);
      }
      if (audioFile) {
        forwardForm.append('audio', audioFile, audioFile.name);
      }
      forwardBody = forwardForm;
      forwardHeaders = buildForwardHeaders(undefined, filteredHeaders);
    } else {
      const text = await request.text();
      if (new TextEncoder().encode(text).length > maxBytes) {
        return NextResponse.json(
          { error: 'Payload too large' },
          { status: 413 },
        );
      }
      const parsed = JSON.parse(text) as ChatRequestPayload;
      const extraHeadersCandidate =
        parsed.extraHeaders &&
        typeof parsed.extraHeaders === 'object' &&
        !Array.isArray(parsed.extraHeaders)
          ? (parsed.extraHeaders as Record<string, string>)
          : undefined;
      payload = {
        conversationId: sanitizeInput(parsed.conversationId),
        messages: sanitizeMessages(parsed.messages ?? []),
        userWebhook: parsed.userWebhook
          ? sanitizeInput(parsed.userWebhook)
          : undefined,
        extraHeaders: extraHeadersCandidate,
        stream: parsed.stream,
      };
      const filteredHeaders = filterExtraHeaders(payload.extraHeaders);
      payload.extraHeaders = filteredHeaders;
      const forwardPayload = { ...payload };
      delete forwardPayload.extraHeaders;
      forwardBody = JSON.stringify(forwardPayload);
      forwardHeaders = buildForwardHeaders(
        { 'content-type': 'application/json' },
        filteredHeaders,
      );
    }
  } catch (error) {
    console.error('Failed to parse request', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (!payload) {
    return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
  }

  if (!payload.conversationId) {
    return NextResponse.json(
      { error: 'conversationId is required' },
      { status: 400 },
    );
  }

  if (!payload.messages || payload.messages.length === 0) {
    return NextResponse.json(
      { error: 'messages are required' },
      { status: 400 },
    );
  }

  let targetUrl: string;
  try {
    targetUrl = assertAllowedUrl(payload.userWebhook || getDefaultWebhook());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook not allowed' },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: forwardHeaders ?? undefined,
      body: forwardBody,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      return NextResponse.json(
        { error: errorText || 'Upstream webhook responded with an error' },
        { status: upstreamResponse.status },
      );
    }

    if (
      payload.stream &&
      upstreamResponse.headers
        .get('content-type')
        ?.includes('text/event-stream')
    ) {
      return passthroughSSE(upstreamResponse);
    }

    const text = await upstreamResponse.text();
    if (!text) {
      return NextResponse.json(
        { error: 'Empty response from webhook' },
        { status: 502 },
      );
    }
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: upstreamResponse.status });
    } catch (error) {
      console.error(
        'Upstream returned non-JSON response, falling back to SSE',
        error,
      );
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            formatSSE('message', JSON.stringify({ content: text })),
          );
          controller.enqueue(formatSSE('done'));
          controller.close();
        },
      });
      return new NextResponse(stream, {
        headers: {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
        },
      });
    }
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Upstream request timed out' },
        { status: 504 },
      );
    }
    console.error('Proxy request failed', error);
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { status: 502 },
    );
  }
}
