import Foundation

struct WebhookClient {
    enum ConfigurationError: LocalizedError {
        case missingURL
        case invalidURL
        case insecureURL

        var errorDescription: String? {
            switch self {
            case .missingURL:
                return "Please enter a webhook URL in Settings before sending."
            case .invalidURL:
                return "The webhook URL appears to be invalid."
            case .insecureURL:
                return "The webhook URL must use HTTPS."
            }
        }
    }

    enum RequestError: LocalizedError {
        case httpError(statusCode: Int)
        case missingReply
        case emptyReply

        var errorDescription: String? {
            switch self {
            case let .httpError(statusCode):
                return "The server responded with status code \(statusCode)."
            case .missingReply:
                return "The server response did not include a reply."
            case .emptyReply:
                return "The server returned an empty reply."
            }
        }
    }

    func url(from string: String) throws -> URL {
        let trimmed = string.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw ConfigurationError.missingURL }
        guard let url = URL(string: trimmed) else { throw ConfigurationError.invalidURL }
        guard let scheme = url.scheme?.lowercased(), scheme == "https" else {
            throw ConfigurationError.insecureURL
        }
        return url
    }

    func send(messages: [ChatMessage], webhookURL: URL, apiKey: String?) async throws -> String {
        var request = URLRequest(url: webhookURL)
        request.httpMethod = "POST"
        request.timeoutInterval = 30
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let apiKey, !apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        }

        let payload = ChatRequest(messages: messages.map(ChatRequest.Message.init),
                                  metadata: .init(client: "ios", appVersion: "1.0"))
        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(payload)

        let sessionConfiguration = URLSessionConfiguration.ephemeral
        sessionConfiguration.timeoutIntervalForRequest = 30
        sessionConfiguration.timeoutIntervalForResource = 30
        let session = URLSession(configuration: sessionConfiguration)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            throw RequestError.httpError(statusCode: httpResponse.statusCode)
        }

        let decoder = JSONDecoder()
        let chatResponse: ChatResponse
        do {
            chatResponse = try decoder.decode(ChatResponse.self, from: data)
        } catch {
            throw RequestError.missingReply
        }

        let reply = chatResponse.reply.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !reply.isEmpty else { throw RequestError.emptyReply }
        return reply
    }
}

private struct ChatRequest: Encodable {
    struct Message: Encodable {
        let role: String
        let content: String

        init(_ message: ChatMessage) {
            self.role = message.role.rawValue
            self.content = message.content
        }
    }

    struct Metadata: Encodable {
        let client: String
        let appVersion: String
    }

    let messages: [Message]
    let metadata: Metadata
}

private struct ChatResponse: Decodable {
    let reply: String
}
