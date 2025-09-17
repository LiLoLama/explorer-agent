import SwiftUI
import SwiftData

@main
struct WebhookChatApp: App {
    var body: some Scene {
        WindowGroup {
            ChatListView()
        }
        .modelContainer(for: [Conversation.self, Message.self])
    }
}
