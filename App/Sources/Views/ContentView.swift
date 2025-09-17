import SwiftUI

@MainActor
final class ChatViewModel: ObservableObject {
    struct AlertInfo: Identifiable {
        let id = UUID()
        let title: String
        let message: String
    }

    @Published var messages: [ChatMessage] = []
    @Published var currentInput: String = ""
    @Published var isSending = false
    @Published var alertInfo: AlertInfo?

    private let client: WebhookClient

    init(client: WebhookClient = WebhookClient()) {
        self.client = client
    }

    func send(webhookURLString: String, apiKey: String?) async {
        let trimmedInput = currentInput.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedInput.isEmpty else { return }

        let url: URL
        do {
            url = try client.url(from: webhookURLString)
        } catch {
            let message = (error as? LocalizedError)?.errorDescription ?? "An unknown configuration error occurred."
            alertInfo = AlertInfo(title: "Settings Required", message: message)
            return
        }

        guard !isSending else { return }
        isSending = true
        defer { isSending = false }

        let userMessage = ChatMessage(role: .user, content: trimmedInput)
        messages.append(userMessage)
        currentInput = ""

        do {
            let reply = try await client.send(messages: messages, webhookURL: url, apiKey: apiKey)
            let assistantMessage = ChatMessage(role: .assistant, content: reply)
            messages.append(assistantMessage)
        } catch {
            currentInput = trimmedInput
            let message = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            alertInfo = AlertInfo(title: "Unable to Send", message: message)
        }
    }
}

struct ContentView: View {
    @StateObject private var viewModel = ChatViewModel()
    @AppStorage("webhookURL") private var webhookURL: String = ""
    @AppStorage("apiKey") private var apiKey: String = ""
    @State private var isShowingSettings = false

    private var isSendDisabled: Bool {
        viewModel.isSending || viewModel.currentInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 12) {
                            ForEach(viewModel.messages) { message in
                                MessageBubbleView(message: message)
                                    .id(message.id)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)
                        .padding(.vertical, 16)
                    }
                    .background(Color(.systemGroupedBackground))
                    .onChange(of: viewModel.messages) { messages in
                        guard let lastID = messages.last?.id else { return }
                        withAnimation {
                            proxy.scrollTo(lastID, anchor: .bottom)
                        }
                    }
                }

                Divider()
                    .padding(.bottom, 8)

                HStack(alignment: .bottom, spacing: 12) {
                    TextField("Type a message…", text: $viewModel.currentInput, axis: .vertical)
                        .lineLimit(1...5)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.sentences)

                    Button(action: {
                        Task {
                            await viewModel.send(webhookURLString: webhookURL, apiKey: apiKeyOptional)
                        }
                    }) {
                        if viewModel.isSending {
                            ProgressView()
                                .progressViewStyle(.circular)
                                .frame(width: 24, height: 24)
                        } else {
                            Image(systemName: "paperplane.fill")
                                .font(.system(size: 20, weight: .semibold))
                                .foregroundColor(.white)
                                .frame(width: 44, height: 44)
                                .background(Color.accentColor)
                                .clipShape(Circle())
                        }
                    }
                    .disabled(isSendDisabled)
                }
                .padding(.horizontal)
                .padding(.bottom)
            }
            .navigationTitle("ExplorerAgent")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        isShowingSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                    }
                }
            }
            .sheet(isPresented: $isShowingSettings) {
                NavigationStack {
                    SettingsView()
                }
            }
            .alert(item: $viewModel.alertInfo) { info in
                Alert(title: Text(info.title), message: Text(info.message), dismissButton: .default(Text("OK")))
            }
        }
    }

    private var apiKeyOptional: String? {
        let trimmed = apiKey.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}

private struct MessageBubbleView: View {
    let message: ChatMessage

    private var isUser: Bool {
        message.role == .user
    }

    var body: some View {
        HStack {
            if isUser { Spacer() }
            Text(message.content)
                .padding(12)
                .foregroundColor(isUser ? .white : .primary)
                .background(isUser ? Color.accentColor : Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .frame(maxWidth: 280, alignment: isUser ? .trailing : .leading)
            if !isUser { Spacer() }
        }
        .transition(.move(edge: isUser ? .trailing : .leading).combined(with: .opacity))
    }
}
