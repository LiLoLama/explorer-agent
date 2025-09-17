import Foundation
import SwiftData

@MainActor
final class ChatViewModel: ObservableObject {
    @Published var input: String = ""
    @Published var isSending = false
    @Published var error: String?
    var client: WebhookClient
    var modelContext: ModelContext
    var conversation: Conversation

    init(client: WebhookClient, context: ModelContext, conversation: Conversation) {
        self.client = client
        self.modelContext = context
        self.conversation = conversation
    }

    var messages: [Message] {
        let q = FetchDescriptor<Message>(predicate: #Predicate { $0.conversationId == conversation.id },
                                         sortBy: [SortDescriptor(\.createdAt, order: .forward)])
        return (try? modelContext.fetch(q)) ?? []
    }

    func send() async {
        let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        input = ""
        let userMsg = Message(conversationId: conversation.id, role: .user, content: trimmed)
        modelContext.insert(userMsg)
        try? modelContext.save()

        isSending = true; defer { isSending = false }
        do {
            let history = messages.map { ($0.role, $0.content) } + [(.user, trimmed)]
            let reply = try await client.send(conversationId: conversation.id, messages: history)
            let bot = Message(conversationId: conversation.id, role: .assistant, content: reply)
            conversation.updatedAt = .now
            modelContext.insert(bot)
            try? modelContext.save()
        } catch {
            self.error = "Fehler: \(error.localizedDescription)"
        }
    }
}
