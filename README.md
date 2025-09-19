# Explorer Agent

A Next.js 14 chat interface that speaks to configurable webhooks (e.g. n8n workflows) instead of proprietary APIs. Explorer Agent focuses on stability and clear UX while persisting chat history locally with IndexedDB.

## Architecture

```
+--------------------------------------------------------------+
|                          Next.js App                         |
|                                                              |
|  ┌──────────────────┐    ┌─────────────────┐                 |
|  | Sidebar (Zustand)|    |   Chat Window   |                 |
|  | Conversations    |<-->| Messages + SSE  |                 |
|  └──────────────────┘    └────────┬────────┘                 |
|                                   |                          |
|                           ┌───────▼────────┐                 |
|                           |  Proxy API     |                 |
|                           | (api/chat)     |                 |
|                           └───────┬────────┘                 |
|                                   | fetch                    |
|                          ┌────────▼─────────┐                |
|                          |  External Webhook |               |
|                          | (e.g. n8n Flow)   |               |
|                          └───────────────────┘               |
+--------------------------------------------------------------+
```

## Tech Stack

- [Next.js 14 (App Router)](https://nextjs.org/) with TypeScript
- Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/) component primitives
- Zustand state management with localStorage persistence for settings
- IndexedDB (`idb-keyval`) for device-local chat history
- MediaRecorder API for audio capture (WebM/Opus with Safari fallback)
- GitHub Actions for CI (typecheck, lint, build)

## Features

- **Chat UI** with Markdown rendering, copy buttons, timestamps and role badges
- **Streaming support** (SSE passthrough) with stop controls
- **Local persistence** via IndexedDB (conversations/messages) and export/import as JSON
- **Audio messages** recorded in-browser and proxied as `multipart/form-data`
- **Settings** for per-user webhook override, extra headers, and streaming toggle
- **Secure proxy** with domain allowlist, header filtering, rate limiting, body limits and timeouts

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

Create a `.env.local` based on `.env.example`:

```
N8N_DEFAULT_WEBHOOK_URL=https://hooks.n8n.cloud/your-flow
WEBHOOK_ALLOWLIST=hooks.n8n.cloud,example.com
MAX_REQUEST_BYTES=5000000
REQUEST_TIMEOUT_MS=30000
NEXT_PUBLIC_APP_NAME=Explorer Agent
NEXT_PUBLIC_APP_VERSION=0.1.0
```

`WEBHOOK_ALLOWLIST` must include every domain you plan to contact (including ports if applicable).

### Commands

- `npm run dev` – start the dev server
- `npm run lint` – run ESLint
- `npm run typecheck` – strict TypeScript checking
- `npm run format` – Prettier check
- `npm run check` – lint + typecheck + format
- `npm run build` – production build

## Connecting a Webhook

Explorer Agent forwards chat payloads to a webhook via `POST /api/chat`.

### Payload format

```json
{
  "conversationId": "uuid",
  "messages": [
    { "id": "uuid", "role": "user", "content": "Hello" },
    { "id": "uuid", "role": "assistant", "content": "Hi!" }
  ],
  "userWebhook": "https://hooks.n8n.cloud/...", // optional
  "extraHeaders": { "x-api-key": "secret" },
  "stream": true
}
```

If an audio attachment is present it is forwarded as `multipart/form-data` with an `audio` field.

### Expected responses

- **Streaming** (`Content-Type: text/event-stream`): emit `token`, `message`, `error`, `done` events.
- **Non-streaming**: respond with JSON `{ id, role: 'assistant', content, createdAt, meta? }`.

### Example n8n flow

1. **Webhook node** (POST)
2. **Function node** generating a reply:

```js
return [
  {
    json: {
      id: $json.conversationId,
      role: 'assistant',
      content: `Echo: ${$json.messages.slice(-1)[0].content}`,
      createdAt: new Date().toISOString(),
    },
  },
];
```

3. **Respond to Webhook** with the JSON payload above.

## Security

- **Allowlist enforcement** – only domains in `WEBHOOK_ALLOWLIST` are reachable.
- **Header filtering** – only `X-API-KEY`, `X-WORKFLOW-ID`, `X-SESSION-ID`, `X-CLIENT-ID`, `X-REQUEST-ID` are forwarded.
- **Rate limiting** – token bucket (60 req/min/IP) on proxy routes.
- **Body limits** – rejects bodies over 5 MB and audio files exceeding the limit.
- **Timeouts** – upstream requests aborted after `REQUEST_TIMEOUT_MS` (default 30s).
- **CORS** – proxy endpoints scoped to same-origin access.
- **No server persistence** – webhook overrides and extra headers stay in the browser.

## Known Limitations

- Local IndexedDB means conversations are per-device with no sync.
- Audio capture depends on MediaRecorder support (Safari uses mp4 fallback).
- No authentication or multi-user tenancy yet.
- Mobile sidebar duplicates content; future releases will refine navigation.

## Roadmap

- Multi-user support with optional database storage
- Authentication (OAuth / magic links)
- Rich message attachments (files, images)
- Granular role management and system prompts
- Native iOS companion app
- Advanced analytics and logging for webhook responses

## Deployment

The app builds with `npm run build`. Deploy the `.next` output to any Node-capable platform (Vercel, Fly.io, Render). Ensure environment variables are configured in the hosting environment and that webhook domains are reachable from the deployment.
