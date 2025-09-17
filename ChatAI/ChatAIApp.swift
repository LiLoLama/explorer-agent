import SwiftUI
import SwiftData

@main
struct ChatAIApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView(viewModel: ChatViewModel())
        }
        .modelContainer(sharedModelContainer)
    }

    private var sharedModelContainer: ModelContainer {
        let schema = Schema([Message.self])
        let configuration = ModelConfiguration(isStoredInMemoryOnly: false)

        do {
            return try ModelContainer(for: schema, configurations: configuration)
        } catch {
            fatalError("Failed to load SwiftData container: \(error.localizedDescription)")
        }
    }
}
