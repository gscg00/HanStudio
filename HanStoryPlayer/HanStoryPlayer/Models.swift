import Foundation

enum PlaybackMode: String, Codable, CaseIterable, Identifiable {
    case phrases = "Frases individuales", lesson = "Una lección completa"
    case podcastLesson = "Podcast por lección", fullBook = "Libro completo"
    var id: String { rawValue }
}
enum RepeatMode: String, Codable, CaseIterable, Identifiable {
    case off = "Desactivada", track = "Repetir audio", lesson = "Repetir lección", book = "Repetir libro"
    var id: String { rawValue }
}
enum LessonState: String, Codable, CaseIterable { case notStarted = "No iniciada", active = "En progreso", done = "Terminada", review = "Repasar" }

struct PhraseInfo: Codable, Hashable {
    var id = "", text = "", translation = "", character = ""
    var lesson: Int?
}
struct AudioItem: Identifiable, Codable, Hashable {
    var id: String { relativePath }
    let relativePath: String
    let filename: String
    let lesson: Int
    let audioID: String?
    let kind: String
    var duration: Double = 0
    var info: PhraseInfo?
}
struct Lesson: Identifiable, Codable, Hashable {
    var id: Int { number }
    let number: Int
    var tracks: [AudioItem]
    var state: LessonState = .notStarted
    var duration: Double { tracks.reduce(0) { $0 + $1.duration } }
}
struct BookProgress: Codable, Hashable {
    var relativePath: String = ""
    var lesson = 0
    var seconds: Double = 0
    var speed: Float = 1
    var repeatMode: RepeatMode = .off
    var mode: PlaybackMode = .fullBook
}
struct ImportedBook: Identifiable, Codable, Hashable {
    var id: UUID
    var title: String
    var code: String
    var bookmark: Data
    var coverRelativePath: String?
    var tracks: [AudioItem]
    var lessonStates: [Int: LessonState] = [:]
    var progress = BookProgress()
    var favorites: Set<String> = []
    var errors: [String] = []
    var lessonCount: Int { Set(tracks.map(\.lesson)).count }
}

