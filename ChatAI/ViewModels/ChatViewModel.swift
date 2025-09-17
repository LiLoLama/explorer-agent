import Foundation
import SwiftData
import SwiftUI

@MainActor
final class ChatViewModel: ObservableObject {
    @Published private(set) var isSending: Bool = false
    @Published private(set) var errorMessage: String?

    private let client: N8NWebhookClient
    private var hasBootstrapped = false

    init(client: N8NWebhookClient = LiveN8NWebhookClient()) {
        self.client = client
    }

    init(previewClient: N8NWebhookClient) {
        self.client = previewClient
    }

    func initializeIfNeeded(using context: ModelContext) async throws {
        guard !hasBootstrapped else { return }
        hasBootstrapped = true

        if try context.fetch(FetchDescriptor<Message>()).isEmpty {
            Message.makeSamples(in: context)
        }
    }

    func send(_ text: String, using context: ModelContext) async {
        guard !text.isEmpty else { return }

        isSending = true
        defer { isSending = false }

        let userMessage = Message(text: text, role: .user)
        context.insert(userMessage)

        do {
            let response = try await client.send(message: text)
            let assistantMessage = Message(text: response, role: .assistant)
            context.insert(assistantMessage)
        } catch {
            errorMessage = error.localizedDescription
            rollbackLastMessage(userMessage, in: context)
        }
    }

    private func rollbackLastMessage(_ message: Message, in context: ModelContext) {
        context.delete(message)
    }
}
