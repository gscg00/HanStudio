import Foundation

public enum Language: String, Codable, CaseIterable, Identifiable, Sendable { case korean, japanese, german, french
    public var id: String { rawValue }
    public var label: String { ["korean":"Coreano", "japanese":"Japonés", "german":"Alemán", "french":"Francés"][rawValue]! }
    public var locale: String { ["korean":"ko-KR", "japanese":"ja-JP", "german":"de-DE", "french":"fr-FR"][rawValue]! }
}
public enum Topic: String, Codable, CaseIterable, Sendable, Identifiable { case greetings, family, food, home, body, clothing
    public var id: String { rawValue }
    public var label: String { ["greetings":"Saludos", "family":"Familia", "food":"Comida", "home":"Casa", "body":"Cuerpo", "clothing":"Ropa"][rawValue]! }
    public var symbol: String { ["greetings":"hand.wave.fill", "family":"person.3.fill", "food":"fork.knife", "home":"house.fill", "body":"figure.stand", "clothing":"tshirt.fill"][rawValue]! }
}
public struct Realization: Codable, Hashable, Sendable { public let text, transcription, note: String; public let level: String }
public struct Concept: Codable, Identifiable, Hashable, Sendable { public let id: String; public let topic: Topic; public let spanish: String; public let illustration: String; public let tags: [String]; public let realizations: [Language: Realization] }
public struct Phrase: Codable, Identifiable, Hashable, Sendable { public let id: String; public let language: Language; public let text, spanish, transcription: String }
public enum ExerciseKind: String, CaseIterable, Sendable { case imageChoice, audioChoice, matching, cloze, ordering, dictation, pronunciation, scene
    public var title: String { ["imageChoice":"Imagen · palabra", "audioChoice":"Audio · imagen", "matching":"Emparejar", "cloze":"Completar", "ordering":"Ordenar", "dictation":"Dictado", "pronunciation":"Pronunciación", "scene":"Mini-escena"][rawValue]! }
}
public struct Exercise: Identifiable, Sendable { public let id = UUID(); public let kind: ExerciseKind; public let concept: Concept; public let choices: [Concept] }
