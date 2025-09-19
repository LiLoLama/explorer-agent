'use client';

import * as React from 'react';
import Link from 'next/link';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useSettingsStore } from '@/lib/state';
import { useToast } from '@/components/ui/use-toast';

interface HeaderRow {
  key: string;
  value: string;
}

interface HealthResponse {
  status: 'ok' | 'error';
  message?: string;
  defaultWebhook?: string;
}

export default function SettingsPage() {
  const {
    webhookUrl,
    setWebhookUrl,
    extraHeaders,
    setExtraHeaders,
    stream,
    setStream,
  } = useSettingsStore();
  const { toast } = useToast();
  const [headers, setHeaders] = React.useState<HeaderRow[]>(() =>
    Object.entries(extraHeaders ?? {}).map(([key, value]) => ({ key, value })),
  );
  const [status, setStatus] = React.useState<'ok' | 'error'>('ok');
  const [message, setMessage] = React.useState<string | undefined>();
  const [defaultWebhook, setDefaultWebhook] = React.useState<
    string | undefined
  >();

  React.useEffect(() => {
    fetch('/api/health')
      .then((response) => response.json())
      .then((data: HealthResponse) => {
        setStatus(data.status);
        setMessage(data.message);
        setDefaultWebhook(data.defaultWebhook);
      })
      .catch(() => {
        setStatus('error');
        setMessage('Unable to load health information');
      });
  }, []);

  const handleAddHeader = () => {
    setHeaders((current) => [...current, { key: '', value: '' }]);
  };

  const handleHeaderChange = (
    index: number,
    field: 'key' | 'value',
    value: string,
  ) => {
    setHeaders((current) => {
      const next = [...current];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveHeader = (index: number) => {
    setHeaders((current) => current.filter((_, idx) => idx !== index));
  };

  const handleSaveHeaders = () => {
    const sanitized = headers.reduce<Record<string, string>>((acc, header) => {
      if (header.key && header.value) {
        acc[header.key] = header.value;
      }
      return acc;
    }, {});
    setExtraHeaders(sanitized);
    toast({ title: 'Headers updated' });
  };

  const handleWebhookChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWebhookUrl(event.target.value);
  };

  const isValidWebhook = React.useMemo(() => {
    if (!webhookUrl) {
      return true;
    }
    try {
      // Ensure the URL parses correctly; we allow any valid host.
      new URL(webhookUrl);
      return true;
    } catch (error) {
      console.warn('Invalid webhook URL provided', error);
      return false;
    }
  }, [webhookUrl]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure how Explorer Agent connects to your webhook.
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Back to chat
        </Link>
      </div>
      <div className="space-y-4 rounded-2xl border border-black/10 bg-white/80 p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
        <div className="space-y-2">
          <Label htmlFor="webhook">Webhook URL</Label>
          <Input
            id="webhook"
            value={webhookUrl}
            onChange={handleWebhookChange}
            placeholder="https://hooks.n8n.cloud/..."
            aria-invalid={!isValidWebhook}
          />
          <p className="text-xs text-[var(--muted)]">
            Provide any valid HTTPS endpoint. The proxy will validate the URL
            before forwarding requests.
          </p>
          {!isValidWebhook ? (
            <p className="text-xs text-destructive">
              Enter a valid webhook URL (including protocol).
            </p>
          ) : null}
          {defaultWebhook ? (
            <p className="text-xs text-[var(--muted)]">
              Default webhook:{' '}
              <span className="font-medium">{defaultWebhook}</span>
            </p>
          ) : null}
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="streaming">Streaming responses</Label>
            <p className="text-xs text-muted-foreground">
              Enable Server-Sent Events when supported by your webhook.
            </p>
          </div>
          <Switch
            id="streaming"
            checked={stream}
            onCheckedChange={(value) => setStream(value)}
          />
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border border-black/10 bg-white/80 p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Extra headers</h2>
          <Button type="button" variant="outline" onClick={handleAddHeader}>
            Add header
          </Button>
        </div>
        <div className="space-y-3">
          {headers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No headers configured.
            </p>
          ) : null}
          {headers.map((header, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-white/70 p-3 shadow-sm sm:flex-row sm:items-center dark:border-white/10 dark:bg-white/[0.05]"
            >
              <Input
                value={header.key}
                onChange={(event) =>
                  handleHeaderChange(index, 'key', event.target.value)
                }
                placeholder="X-API-KEY"
                className="sm:flex-1"
              />
              <Input
                value={header.value}
                onChange={(event) =>
                  handleHeaderChange(index, 'value', event.target.value)
                }
                placeholder="secret"
                className="sm:flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleRemoveHeader(index)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" onClick={handleSaveHeaders}>
          Save headers
        </Button>
      </div>
      <div className="rounded-2xl border border-black/10 bg-white/80 p-6 text-sm shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
        <h2 className="mb-2 text-lg font-semibold">System status</h2>
        <p className="text-muted-foreground">
          Status:{' '}
          <span
            className={status === 'ok' ? 'text-green-600' : 'text-destructive'}
          >
            {status.toUpperCase()}
          </span>
        </p>
        {message ? (
          <p className="mt-1 text-muted-foreground">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
