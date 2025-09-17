import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @AppStorage("webhookURL") private var webhookURL: String = ""
    @AppStorage("apiKey") private var apiKey: String = ""

    var body: some View {
        Form {
            Section(header: Text("Webhook URL"), footer: Text("Requests are sent as JSON over HTTPS.")) {
                TextField("https://example.com/webhook", text: $webhookURL)
                    .keyboardType(.URL)
                    .textInputAutocapitalization(.never)
                    .disableAutocorrection(true)
                    .textContentType(.URL)
            }

            Section(header: Text("API Key"), footer: Text("Optional. If provided, it is sent as a Bearer token.")) {
                SecureField("Optional", text: $apiKey)
                    .textInputAutocapitalization(.never)
                    .disableAutocorrection(true)
            }
        }
        .navigationTitle("Settings")
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Done") { dismiss() }
            }
        }
    }
}
