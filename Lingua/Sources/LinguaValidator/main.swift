import Foundation
import LinguaCore

let store = ContentStore.shared
var problems: [String] = []
if store.concepts.count < 120 { problems.append("Se esperaban 120 conceptos; hay \(store.concepts.count).") }
for concept in store.concepts { if concept.illustration.isEmpty { problems.append("\(concept.id): sin ilustración") }; for language in Language.allCases { if concept.realizations[language]?.text.isEmpty != false { problems.append("\(concept.id): falta \(language.rawValue)") } } }
for language in Language.allCases where store.phrases.filter({$0.language == language}).count < 30 { problems.append("\(language.label): menos de 30 frases") }
let first = SM2.review(ReviewState(conceptID: "c1"), quality: 5)
let second = SM2.review(first, quality: 5)
if first.interval != 1 || second.interval != 6 { problems.append("SM-2: intervalos inesperados") }
let exercises = ExerciseGenerator().lesson(for: store.concepts(for: .greetings), language: .korean)
if exercises.count != 8 || Set(exercises.map(\.kind)).count != 8 || exercises.contains(where: { $0.choices.count != 4 }) { problems.append("Generador de ejercicios inválido") }
if problems.isEmpty { print("✓ Contenido válido: \(store.concepts.count) conceptos, \(store.phrases.count) frases.") } else { problems.forEach { print("✗ \($0)") }; exit(1) }
