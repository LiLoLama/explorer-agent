import SwiftUI

struct SettingsView: View {
    @AppStorage("webhookURL") private var webhookURL: String = ""
    @AppStorage("apiKey") private var apiKey: String = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Endpoint") {
                    TextField("Webhook URL (https://…)", text: $webhookURL)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                    SecureField("API Key (optional)", text: $apiKey)
                }
                Section {
                    Text("Die App sendet JSON an den n8n-Workflow und erwartet JSON mit `reply` zurück.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Einstellungen")
        }
    }
}
