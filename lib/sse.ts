const encoder = new TextEncoder();

export function formatSSE(event: string, data?: string): Uint8Array {
  const payload = `event: ${event}\n${data ? `data: ${data}\n` : ''}\n`;
  return encoder.encode(payload);
}

export function passthroughSSE(upstream: Response): Response {
  const body = upstream.body;
  if (!body) {
    throw new Error('Upstream response is missing a body for streaming.');
  }
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const reader = body.getReader();
      const push = (): void => {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            if (value) {
              controller.enqueue(value);
            }
            push();
          })
          .catch((error) => {
            controller.error(error);
          });
      };
      push();
    },
    cancel() {
      body.cancel().catch(() => {
        /* noop */
      });
    },
  });

  const headers = new Headers(upstream.headers);
  headers.set('content-type', 'text/event-stream');
  headers.set('cache-control', 'no-cache');
  headers.set('connection', 'keep-alive');

  return new Response(stream, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
