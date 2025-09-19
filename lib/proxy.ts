const RAW_ALLOWLIST = process.env.WEBHOOK_ALLOWLIST ?? '';

const ALLOWLIST = RAW_ALLOWLIST.split(',')
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

const SAFE_HEADER_SET = new Set([
  'x-api-key',
  'x-workflow-id',
  'x-session-id',
  'x-client-id',
  'x-request-id',
]);

const BLOCKED_HEADERS = new Set([
  'host',
  'origin',
  'referer',
  'content-length',
  'connection',
]);

export function getAllowlist(): string[] {
  return [...ALLOWLIST];
}

export function getDefaultWebhook(): string | undefined {
  return process.env.N8N_DEFAULT_WEBHOOK_URL?.trim();
}

export function sanitizeInput(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/[^\t\n\r\x20-\x7E]/g, '').trim();
}

export function isUrlAllowed(url: string | undefined | null): boolean {
  if (!url) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return ALLOWLIST.includes(parsed.host.toLowerCase());
  } catch (error) {
    console.warn('Invalid URL when checking allowlist', error);
    return false;
  }
}

export function assertAllowedUrl(url: string | undefined | null): string {
  if (!url) {
    throw new Error('Webhook URL is required');
  }
  if (!isUrlAllowed(url)) {
    throw new Error('Webhook URL is not in the allowlist');
  }
  return url;
}

export function filterExtraHeaders(
  headers?: Record<string, string>,
): Record<string, string> | undefined {
  if (!headers) {
    return undefined;
  }
  const filtered: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (!lowerKey.startsWith('x-')) {
      continue;
    }
    if (!SAFE_HEADER_SET.has(lowerKey)) {
      continue;
    }
    if (BLOCKED_HEADERS.has(lowerKey)) {
      continue;
    }
    const value = sanitizeInput(rawValue);
    if (!value) {
      continue;
    }
    filtered[lowerKey] = value;
  }
  return Object.keys(filtered).length > 0 ? filtered : undefined;
}

export function buildForwardHeaders(
  baseHeaders: HeadersInit = {},
  extraHeaders?: Record<string, string>,
): Headers {
  const headers = new Headers(baseHeaders);
  for (const blocked of BLOCKED_HEADERS) {
    if (headers.has(blocked)) {
      headers.delete(blocked);
    }
  }
  if (extraHeaders) {
    for (const [key, value] of Object.entries(extraHeaders)) {
      headers.set(key, value);
    }
  }
  headers.set('accept', 'application/json, text/event-stream');
  headers.set('cache-control', 'no-cache');
  return headers;
}

export function ensureCors(
  requestOrigin: string | null | undefined,
  allowedOrigin: string,
): boolean {
  if (!requestOrigin) {
    return true;
  }
  try {
    const originUrl = new URL(requestOrigin);
    const allowedUrl = new URL(allowedOrigin);
    return originUrl.host === allowedUrl.host;
  } catch (error) {
    console.warn('CORS check failed due to invalid origin', error);
    return false;
  }
}
