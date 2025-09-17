import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Message.timestamp) private var messages: [Message]
    @ObservedObject var viewModel: ChatViewModel
    @State private var draftText: String = ""
    @FocusState private var messageFieldFocused: Bool

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    List(messages) { message in
                        MessageBubble(message: message)
                            .listRowSeparator(.hidden)
                            .listRowBackground(Color.clear)
                            .id(message.id)
                    }
                    .listStyle(.plain)
                    .onChange(of: messages.last?.id) { _ in
                        if let lastId = messages.last?.id {
                            withAnimation { proxy.scrollTo(lastId, anchor: .bottom) }
                        }
                    }
                }

                Divider()

                HStack(alignment: .center) {
                    TextField("Message", text: $draftText, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .focused($messageFieldFocused)
                        .lineLimit(1...3)
                        .submitLabel(.send)
                        .onSubmit(sendMessage)

                    Button(action: sendMessage) {
                        Image(systemName: "paperplane.fill")
                            .imageScale(.large)
                            .padding(8)
                    }
                    .disabled(draftText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || viewModel.isSending)
                    .buttonStyle(.borderedProminent)
                    .accessibilityLabel("Send message")
                }
                .padding()
            }
            .navigationTitle("Chat")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    if viewModel.isSending {
                        ProgressView().progressViewStyle(.circular)
                    }
                }
            }
        }
        .task {
            try? await viewModel.initializeIfNeeded(using: context)
        }
    }

    private func sendMessage() {
        let trimmed = draftText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        Task {
            await viewModel.send(trimmed, using: context)
        }

        draftText = ""
        messageFieldFocused = true
    }
}

struct MessageBubble: View {
    let message: Message

    var body: some View {
        HStack {
            if message.role == .assistant { Spacer() }

            VStack(alignment: .leading, spacing: 6) {
                Text(message.role.displayName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(message.text)
                    .font(.body)
                    .foregroundStyle(.primary)
            }
            .padding(12)
            .background(message.role == .user ? Color.accentColor.opacity(0.2) : Color.gray.opacity(0.2))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

            if message.role == .user { Spacer() }
        }
        .padding(.vertical, 4)
        .animation(.default, value: message.id)
    }
}

#Preview {
    let container = try! ModelContainer(for: Message.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    let context = ModelContext(container)
    Message.makeSamples(in: context)
    return ContentView(viewModel: ChatViewModel(previewClient: MockN8NWebhookClient()))
        .modelContainer(container)
}
