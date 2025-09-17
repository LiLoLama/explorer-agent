import Foundation

protocol N8NWebhookClient {
    func send(message: String) async throws -> String
}

struct LiveN8NWebhookClient: N8NWebhookClient {
    private let session: URLSession
    private let configuration: AppConfiguration

    init(session: URLSession = .shared, configuration: AppConfiguration = .default) {
        self.session = session
        self.configuration = configuration
    }

    func send(message: String) async throws -> String {
        guard !configuration.webhookURL.isEmpty else {
            throw WebhookError.missingURL
        }

        guard let url = URL(string: configuration.webhookURL) else {
            throw WebhookError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload = WebhookPayload(text: message, metadata: configuration.metadata)
        request.httpBody = try JSONEncoder().encode(payload)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw WebhookError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unexpected status code"
            throw WebhookError.serverError(statusCode: httpResponse.statusCode, message: errorMessage)
        }

        if data.isEmpty {
            return ""
        }

        if let decoded = try? JSONDecoder().decode(WebhookResponse.self, from: data) {
            return decoded.reply
        }

        return String(data: data, encoding: .utf8) ?? ""
    }
}

struct MockN8NWebhookClient: N8NWebhookClient {
    func send(message: String) async throws -> String {
        "Echo: \(message)"
    }
}

struct WebhookPayload: Codable {
    let text: String
    let metadata: [String: String]
}

struct WebhookResponse: Codable {
    let reply: String
}

enum WebhookError: LocalizedError {
    case missingURL
    case invalidURL
    case invalidResponse
    case serverError(statusCode: Int, message: String)

    var errorDescription: String? {
        switch self {
        case .missingURL:
            return "Missing n8n webhook URL."
        case .invalidURL:
            return "The n8n webhook URL is invalid."
        case .invalidResponse:
            return "The webhook response was not valid."
        case let .serverError(statusCode, message):
            return "Webhook error (\(statusCode)): \(message)"
        }
    }
}
