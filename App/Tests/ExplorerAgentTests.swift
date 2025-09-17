import XCTest
@testable import ExplorerAgent

final class ExplorerAgentTests: XCTestCase {
    func testAppEntryPointIsAvailable() throws {
        let app = ExplorerAgentApp()
        _ = app.body
    }
}
