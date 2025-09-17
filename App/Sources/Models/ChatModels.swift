import Foundation
import SwiftData

enum Role: String, Codable, CaseIterable {
    case user, assistant, system
}

@Model final class Conversation {
    @Attribute(.unique) var id: UUID
    var title: String
    var createdAt: Date
    var updatedAt: Date

    init(id: UUID = UUID(), title: String, createdAt: Date = .now, updatedAt: Date = .now) {
        self.id = id
        self.title = title
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

@Model final class Message {
    @Attribute(.unique) var id: UUID
    var conversationId: UUID
    var roleRaw: String
    var content: String
    var createdAt: Date

    var role: Role { Role(rawValue: roleRaw) ?? .user }

    init(id: UUID = UUID(), conversationId: UUID, role: Role, content: String, createdAt: Date = .now) {
        self.id = id
        self.conversationId = conversationId
        self.roleRaw = role.rawValue
        self.content = content
        self.createdAt = createdAt
    }
}
