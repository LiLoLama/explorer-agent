import SwiftUI
import SwiftData

struct ChatListView: View {
    @Environment(\.modelContext) private var ctx
    @Query(sort: \Conversation.updatedAt, order: .reverse) private var convos: [Conversation]
    @State private var showingSettings = false

    var body: some View {
        NavigationStack {
            List {
                ForEach(convos) { c in
                    NavigationLink(destination: ChatDetailView(conversation: c)) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(c.title).font(.headline)
                            Text(c.updatedAt, style: .date).font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
                .onDelete { idx in idx.map { convos[$0] }.forEach { ctx.delete($0) } }
            }
            .navigationTitle("Chats")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button { showingSettings = true } label: { Image(systemName: "gear") }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        let c = Conversation(title: "Neuer Chat")
                        ctx.insert(c)
                        try? ctx.save()
                    } label: { Image(systemName: "plus") }
                }
            }
            .sheet(isPresented: $showingSettings) { SettingsView() }
        }
    }
}

struct ChatDetailView: View {
    @Environment(\.modelContext) private var ctx
    @AppStorage("webhookURL") private var webhookURL: String = ""
    @AppStorage("apiKey") private var apiKey: String = ""
    let conversation: Conversation
    @StateObject private var vmHolder = _VMHolder()

    var body: some View {
        let url = URL(string: webhookURL.isEmpty ? "https://example.com" : webhookURL)!
        let client = WebhookClient(baseURL: url, apiKey: apiKey.isEmpty ? nil : apiKey)
        let vm = vmHolder.provide { ChatViewModel(client: client, context: ctx, conversation: conversation) }

        VStack {
            List(vm.messages) { msg in
                HStack(alignment: .top) {
                    if msg.role == .assistant { Spacer(minLength: 24) }
                    Text(msg.content)
                        .padding(10)
                        .background(msg.role == .user ? Color.blue.opacity(0.1) : Color.gray.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    if msg.role == .user { Spacer(minLength: 24) }
                }
                .listRowSeparator(.hidden)
            }
            .listStyle(.plain)

            HStack {
                TextField("Nachricht…", text: $vm.input, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                Button {
                    Task { await vm.send() }
                } label: {
                    if vm.isSending { ProgressView() } else { Image(systemName: "paperplane.fill") }
                }
                .disabled(vm.isSending)
            }
            .padding()
        }
        .navigationTitle(conversation.title)
        .alert(isPresented: Binding(get: { vm.error != nil }, set: { _ in vm.error = nil })) {
            Alert(title: Text("Fehler"), message: Text(vm.error ?? ""), dismissButton: .default(Text("OK")))
        }
    }
}

private final class _VMHolder: ObservableObject {
    var instance: ChatViewModel?
    func provide(_ build: () -> ChatViewModel) -> ChatViewModel {
        if let i = instance { return i }
        let i = build(); instance = i; return i
    }
}
