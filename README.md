# ChatAI

An initial SwiftUI + SwiftData chat skeleton that integrates with an n8n webhook backend. The project demonstrates how to persist chat history locally, call a webhook for assistant responses, and present the conversation in a modern SwiftUI interface.

## Features

- **SwiftUI-first** layout with a clean chat interface and accessibility-friendly controls.
- **SwiftData** model (`Message`) that persists conversations and seeds preview/sample data.
- **Async webhook client** that posts chat prompts to an n8n workflow and renders replies.
- **View model** that coordinates UI state, persistence bootstrapping, and webhook calls.
- **Configurable metadata** sourced from `Info.plist` keys prefixed with `ChatMetadata_`.
- **Preview-friendly mocks** to iterate on UI independently from the backend.
- **Continuous integration** workflow that validates builds and tests on the latest Xcode runner.

## Project structure

```
ChatAI/
├── ChatAIApp.swift           # Entry point that wires SwiftData container and root view
├── ContentView.swift         # SwiftUI conversation UI and message composer
├── Models/
│   └── Message.swift         # SwiftData model definitions and sample seeds
├── Services/
│   └── N8NWebhookClient.swift# Live and mock webhook clients with payload/response types
├── SupportingFiles/
│   └── AppConfiguration.swift# Loads Info.plist driven configuration for the webhook
└── ViewModels/
    └── ChatViewModel.swift   # ObservableObject powering the chat experience
```

## Configuration

Populate the following keys inside your app target's `Info.plist`:

- `N8NWebhookURL` – the HTTPS endpoint exposed by your n8n workflow.
- `ChatMetadata_*` – optional key/value metadata that will be forwarded alongside chat requests.

## Continuous Integration

The repository includes a GitHub Actions workflow (`.github/workflows/ios-ci.yml`) that builds and tests the project on macOS runners with the latest stable Xcode. Adjust the destinations and schemes once the Xcode project is added.
