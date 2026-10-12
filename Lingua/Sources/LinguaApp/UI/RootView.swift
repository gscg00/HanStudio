import SwiftUI
import LinguaCore

struct RootView: View {
    @AppStorage("targetLanguage") private var languageID = Language.korean.rawValue
    @AppStorage("showSpanish") private var showSpanish = true
    @State private var selection = "Inicio"
    @State private var lessonTopic: Topic?
    @State private var showingOnboarding = false
    private var language: Language { Language(rawValue: languageID) ?? .korean }
    var body: some View {
        NavigationSplitView {
            List(selection: $selection) {
                Label("Inicio", systemImage: "house").tag("Inicio")
                Label("Mapa", systemImage: "map").tag("Mapa")
                Label("Repasar", systemImage: "arrow.clockwise").tag("Repasar")
                Label("Diccionario", systemImage: "magnifyingglass").tag("Diccionario")
                Label("Estadísticas", systemImage: "chart.bar").tag("Estadísticas")
            }.navigationTitle("Lingua")
        } detail: {
            detailView
                .sheet(item: $lessonTopic) { LessonView(topic: $0, language: language, showSpanish: showSpanish) }
                .toolbar { ToolbarItem { Picker("Idioma", selection: $languageID) { ForEach(Language.allCases) { Text($0.label).tag($0.rawValue) } }.labelsHidden() }; ToolbarItem { Button("Configurar") { showingOnboarding = true } } }
                .sheet(isPresented: $showingOnboarding) { OnboardingView() }
        }
    }
    @ViewBuilder private var detailView: some View {
        switch selection {
        case "Mapa": TopicMapView { lessonTopic = $0 }
        case "Diccionario": DictionaryView(language: language, showSpanish: showSpanish)
        case "Repasar": ContentUnavailableView("Sin repasos pendientes", systemImage: "checkmark.circle", description: Text("Tus respuestas aparecerán aquí según su fecha de repaso."))
        case "Estadísticas": ContentUnavailableView("Tu progreso", systemImage: "chart.bar", description: Text("Completa una lección para empezar."))
        default: HomeView(language: language) { lessonTopic = .greetings }
        }
    }
}

struct HomeView: View { let language: Language; let start: () -> Void
    var body: some View { VStack(alignment: .leading, spacing: 24) { Text("Aprende \(language.label)").font(.largeTitle.bold()); Text("Inmersión visual, a tu ritmo.").foregroundStyle(.secondary); HStack { card("0", "repasos hoy"); card("1", "racha suave"); card("0 XP", "esta semana") }; Button(action: start) { Label("Continuar con Saludos", systemImage: "play.fill") }.buttonStyle(.borderedProminent).keyboardShortcut(.return); Spacer() }.padding(36) }
    private func card(_ value: String, _ label: String) -> some View { VStack(alignment: .leading) { Text(value).font(.title.bold()); Text(label).foregroundStyle(.secondary) }.frame(width: 150, alignment: .leading).padding().background(.quaternary, in: RoundedRectangle(cornerRadius: 16)) }
}
struct TopicMapView: View { let select: (Topic) -> Void
    var body: some View { ScrollView { VStack(alignment: .leading) { Text("Mapa de temas").font(.largeTitle.bold()); Text("A1 · fundamentos visuales").foregroundStyle(.secondary); LazyVGrid(columns: [GridItem(.adaptive(minimum: 180))], spacing: 16) { ForEach(Topic.allCases, id: \.self) { topic in Button { select(topic) } label: { VStack(alignment: .leading, spacing: 12) { Image(systemName: topic.symbol).font(.title); Text(topic.label).font(.headline); ProgressView(value: 0).tint(.mint); Text("20 conceptos · A1–A2").font(.caption).foregroundStyle(.secondary) }.frame(maxWidth: .infinity, minHeight: 130, alignment: .leading).padding().background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18)) }.buttonStyle(.plain) } } }.padding(32) } }
}
struct DictionaryView: View { let language: Language; let showSpanish: Bool; @State private var query = ""
    var body: some View { List(ContentStore.shared.search(query, language: language)) { c in HStack { IllustrationView(name: c.illustration).frame(width: 54, height: 54); VStack(alignment: .leading) { Text(c.realizations[language]!.text).font(.headline); if showSpanish { Text(c.spanish).foregroundStyle(.secondary) } } } }.searchable(text: $query, prompt: "Busca una palabra").navigationTitle("Diccionario visual") }
}
struct OnboardingView: View { @Environment(\.dismiss) private var dismiss; @AppStorage("targetLanguage") private var languageID = Language.korean.rawValue; @State private var goal = 10
    var body: some View { VStack(alignment: .leading, spacing: 20) { Text("Bienvenido a Lingua").font(.title.bold()); Text("Elige tu idioma y una meta diaria. Puedes cambiarlo después."); Picker("Idioma meta", selection: $languageID) { ForEach(Language.allCases) { Text($0.label).tag($0.rawValue) } }; Stepper("\(goal) minutos al día", value: $goal, in: 5...60, step: 5); Button("Empezar") { dismiss() }.buttonStyle(.borderedProminent).frame(maxWidth: .infinity, alignment: .trailing) }.padding(32).frame(width: 420) }
}
struct SettingsView: View { @AppStorage("showSpanish") private var showSpanish = true; @AppStorage("speechRate") private var speechRate = 0.45
    var body: some View { Form { Toggle("Mostrar apoyo en español", isOn: $showSpanish); Slider(value: $speechRate, in: 0.3...0.6) { Text("Velocidad de voz") }; Section("Voces") { Text("Lingua usa voces instaladas de macOS. Descarga voces adicionales en Ajustes del Sistema › Accesibilidad › Contenido hablado.").font(.caption) }; Section("Datos") { Button("Exportar progreso JSON") {}; Button("Importar progreso JSON") {} } }.padding().frame(width: 480) }
}
