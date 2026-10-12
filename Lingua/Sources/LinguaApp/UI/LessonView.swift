import SwiftUI
import LinguaCore

struct LessonView: View {
    let topic: Topic; let language: Language; let showSpanish: Bool
    @Environment(\.dismiss) private var dismiss
    @State private var index = 0; @State private var correct = 0; @State private var answer = ""
    private var exercises: [Exercise] { ExerciseGenerator().lesson(for: ContentStore.shared.concepts(for: topic), language: language) }
    var body: some View {
        VStack(spacing: 20) {
            ProgressView(value: Double(index), total: Double(exercises.count)).padding()
            if index < exercises.count { prompt(exercises[index]) } else { summary }
        }.frame(minWidth: 620, minHeight: 500).padding().navigationTitle(topic.label)
    }
    @ViewBuilder private func prompt(_ exercise: Exercise) -> some View {
        VStack(spacing: 18) {
            Text(exercise.kind.title).font(.headline).foregroundStyle(.secondary)
            IllustrationView(name: exercise.concept.illustration).frame(width: 210, height: 180)
            if showSpanish { Text(exercise.concept.spanish).foregroundStyle(.secondary) }
            if exercise.kind == .cloze || exercise.kind == .dictation {
                TextField("Escribe la respuesta", text: $answer).textFieldStyle(.roundedBorder).frame(width: 300)
                Button("Comprobar") { submit(answer == exercise.concept.realizations[language]!.text) }.keyboardShortcut(.return)
            } else {
                Text(exercise.kind == .ordering ? "Ordena: \(exercise.concept.realizations[language]!.text)" : "Elige la respuesta correcta")
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())]) {
                    ForEach(Array(exercise.choices.enumerated()), id: \.element.id) { number, choice in
                        Button(choice.realizations[language]!.text) { submit(choice.id == exercise.concept.id) }
                            .buttonStyle(.bordered).keyboardShortcut(KeyEquivalent(Character("\(number + 1)")), modifiers: [])
                    }
                }.frame(maxWidth: 500)
            }
        }
    }
    private var summary: some View { VStack(spacing: 18) { Image(systemName: "checkmark.seal.fill").font(.system(size: 72)).foregroundStyle(.mint); Text("Lección terminada").font(.largeTitle.bold()); Text("\(correct) de \(exercises.count) respuestas correctas"); Button("Volver al mapa") { dismiss() }.buttonStyle(.borderedProminent).keyboardShortcut(.return) } }
    private func submit(_ isCorrect: Bool) { if isCorrect { correct += 1 }; answer = ""; index += 1 }
}

struct IllustrationView: View {
    let name: String
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var body: some View {
        TimelineView(.animation(minimumInterval: reduceMotion ? 3600 : 1.6)) { timeline in
            Canvas { context, size in
                let colors: [Color] = [.mint, .orange, .purple, .pink, .teal]
                let fill = colors[abs(name.hashValue) % colors.count]
                let bob = reduceMotion ? 0 : sin(timeline.date.timeIntervalSinceReferenceDate * 3) * 4
                let rect = CGRect(x: size.width * 0.18, y: size.height * 0.2 + bob, width: size.width * 0.64, height: size.height * 0.6)
                context.fill(Path(roundedRect: rect, cornerRadius: 28), with: .color(fill.opacity(0.78)))
                context.stroke(Path(roundedRect: rect, cornerRadius: 28), with: .color(.primary.opacity(0.75)), lineWidth: 3)
            }
        }.aspectRatio(1, contentMode: .fit).accessibilityHidden(true)
    }
}
