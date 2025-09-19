import { NextResponse } from 'next/server';

import { getDefaultWebhook } from '@/lib/proxy';

export const runtime = 'nodejs';

export function GET() {
  const defaultWebhook = getDefaultWebhook();
  const defaultsApplied: string[] = [];

  const maxRequestBytes = process.env.MAX_REQUEST_BYTES
    ? Number(process.env.MAX_REQUEST_BYTES)
    : (() => {
        defaultsApplied.push('MAX_REQUEST_BYTES');
        return 5_000_000;
      })();
  const requestTimeoutMs = process.env.REQUEST_TIMEOUT_MS
    ? Number(process.env.REQUEST_TIMEOUT_MS)
    : (() => {
        defaultsApplied.push('REQUEST_TIMEOUT_MS');
        return 30_000;
      })();

  const status = 'ok';
  const message =
    defaultsApplied.length === 0
      ? defaultWebhook
        ? `Default webhook configured: ${defaultWebhook}`
        : 'Ready to accept requests.'
      : `Using default configuration for: ${defaultsApplied.join(', ')}`;

  return NextResponse.json({
    status,
    message,
    defaultWebhook,
    maxRequestBytes,
    requestTimeoutMs,
    defaultsApplied,
  });
}
