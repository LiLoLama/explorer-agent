import Foundation
import SwiftData

@Model
final class Message: Identifiable {
    enum Role: String, Codable, CaseIterable {
        case user
        case assistant

        var displayName: String {
            switch self {
            case .user: return "You"
            case .assistant: return "Assistant"
            }
        }
    }

    @Attribute(.unique) var id: UUID
    var text: String
    var roleRawValue: String
    var timestamp: Date

    var role: Role {
        get { Role(rawValue: roleRawValue) ?? .assistant }
        set { roleRawValue = newValue.rawValue }
    }

    init(id: UUID = UUID(), text: String, role: Role, timestamp: Date = .now) {
        self.id = id
        self.text = text
        self.roleRawValue = role.rawValue
        self.timestamp = timestamp
    }
}

extension Message {
    @discardableResult
    static func makeSamples(in context: ModelContext) -> [Message] {
        let samples = [
            Message(text: "Welcome to the chat!", role: .assistant),
            Message(text: "Hello there.", role: .user)
        ]
        samples.forEach(context.insert)
        return samples
    }
}
