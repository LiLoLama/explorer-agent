import Foundation

struct WebhookClient {
    struct Payload: Codable {
        struct Msg: Codable { let role: String; let content: String }
        let conversationId: UUID
        let messages: [Msg]
        let metadata: [String:String]?
    }
    struct Response: Codable {
        let conversationId: UUID
        let reply: String
        let metadata: [String:String]?
    }

    var baseURL: URL
    var apiKey: String? // optional, falls in n8n benötigt

    func send(conversationId: UUID, messages: [(Role,String)], timeout: TimeInterval = 30) async throws -> String {
        var request = URLRequest(url: baseURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let apiKey { request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization") }
        let payload = Payload(
            conversationId: conversationId,
            messages: messages.map { .init(role: $0.0.rawValue, content: $0.1) },
            metadata: ["client":"ios","appVersion":"1.0"]
        )
        request.httpBody = try JSONEncoder().encode(payload)
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = timeout
        let (data, resp) = try await URLSession(configuration: config).data(for: request)
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        let res = try JSONDecoder().decode(Response.self, from: data)
        return res.reply
    }
}
