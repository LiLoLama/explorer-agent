import XCTest
@testable import ChatAI

final class ChatAITests: XCTestCase {
    func testWebhookMockEchoesMessage() async throws {
        let mock = MockN8NWebhookClient()
        let reply = try await mock.send(message: "Hello")
        XCTAssertEqual(reply, "Echo: Hello")
    }
}
