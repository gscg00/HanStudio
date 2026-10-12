import Foundation

public struct ReviewState: Codable, Hashable {
    public var conceptID: String; public var ease: Double; public var interval: Int; public var repetitions: Int; public var due: Date
    public init(conceptID: String, ease: Double = 2.5, interval: Int = 0, repetitions: Int = 0, due: Date = .now) { self.conceptID = conceptID; self.ease = ease; self.interval = interval; self.repetitions = repetitions; self.due = due }
}
public enum SM2 {
    public static func review(_ state: ReviewState, quality: Int, now: Date = .now) -> ReviewState {
        var next = state; let q = min(5, max(0, quality))
        next.ease = max(1.3, state.ease + 0.1 - Double(5-q) * (0.08 + Double(5-q) * 0.02))
        if q < 3 { next.repetitions = 0; next.interval = 1 } else { next.repetitions += 1; next.interval = next.repetitions == 1 ? 1 : next.repetitions == 2 ? 6 : max(1, Int((Double(state.interval) * next.ease).rounded())) }
        next.due = Calendar.current.date(byAdding: .day, value: next.interval, to: now) ?? now
        return next
    }
}
public struct ExerciseGenerator {
    public init() {}
    public func lesson(for concepts: [Concept], language: Language, count: Int = 8) -> [Exercise] {
        let picked = Array(concepts.prefix(count)); return picked.enumerated().map { index, concept in
            let distractors = concepts.filter { $0.id != concept.id }.shuffled().prefix(3)
            return Exercise(kind: ExerciseKind.allCases[index % ExerciseKind.allCases.count], concept: concept, choices: ([concept] + distractors).shuffled())
        }
    }
}
