import { NextResponse } from 'next/server';

import { getAllowlist, getDefaultWebhook } from '@/lib/proxy';

export const runtime = 'nodejs';

export function GET() {
  const allowlist = getAllowlist();
  const defaultWebhook = getDefaultWebhook();
  const missing: string[] = [];

  if (allowlist.length === 0) {
    missing.push('WEBHOOK_ALLOWLIST');
  }
  if (!process.env.MAX_REQUEST_BYTES) {
    missing.push('MAX_REQUEST_BYTES');
  }
  if (!process.env.REQUEST_TIMEOUT_MS) {
    missing.push('REQUEST_TIMEOUT_MS');
  }

  const status = missing.length === 0 ? 'ok' : 'error';
  const message =
    missing.length === 0
      ? defaultWebhook
        ? `Default webhook configured: ${defaultWebhook}`
        : 'Ready to accept requests.'
      : `Missing configuration: ${missing.join(', ')}`;

  return NextResponse.json({ status, allowlist, message, defaultWebhook });
}
