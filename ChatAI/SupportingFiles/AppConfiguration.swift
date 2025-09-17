import Foundation

struct AppConfiguration {
    let webhookURL: String
    let metadata: [String: String]

    static var `default`: AppConfiguration {
        let infoDictionary = Bundle.main.infoDictionary ?? [:]
        let url = infoDictionary["N8NWebhookURL"] as? String ?? ""

        let metadataEntries = infoDictionary.filter { key, _ in
            key.hasPrefix("ChatMetadata_")
        }

        let metadata = metadataEntries.reduce(into: [String: String]()) { result, entry in
            let key = entry.key.replacingOccurrences(of: "ChatMetadata_", with: "")
            if let value = entry.value as? String {
                result[key] = value
            }
        }

        return AppConfiguration(webhookURL: url, metadata: metadata)
    }
}
