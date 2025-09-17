import XCTest
@testable import WebhookChat

final class WebhookChatTests: XCTestCase {
    func testAppEntryPointIsAvailable() throws {
        let app = ExplorerAgentApp()
        _ = app.body
    }
}
