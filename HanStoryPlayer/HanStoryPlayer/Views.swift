import SwiftUI
import UniformTypeIdentifiers

struct RootView: View {
    @EnvironmentObject var store: LibraryStore; @EnvironmentObject var player: AudioPlayer
    var body: some View { TabView {
        NavigationStack { LibraryView() }.tabItem { Label("Biblioteca", systemImage: "books.vertical") }
        NavigationStack { FavoritesView() }.tabItem { Label("Repasar", systemImage: "heart") }
        NavigationStack { SettingsView() }.tabItem { Label("Configuración", systemImage: "gear") }
    }.safeAreaInset(edge: .bottom) { if player.current != nil { MiniPlayer() } } }
}

struct LibraryView: View {
    @EnvironmentObject var store: LibraryStore; @State private var importer=false
    var body: some View { List { if store.books.isEmpty { ContentUnavailableView("Tu biblioteca está vacía", systemImage: "books.vertical", description: Text("Selecciona la carpeta de un proyecto HanStory.")) }
        ForEach(store.books) { book in NavigationLink { BookView(bookID: book.id) } label: { BookRow(book: book) } }.onDelete(perform: store.remove)
    }.navigationTitle("HanStory Player").toolbar { Button { importer=true } label: { Label("Seleccionar carpeta HanStory", systemImage: "folder.badge.plus") } }.fileImporter(isPresented: $importer, allowedContentTypes: [.folder]) { result in if case .success(let url)=result { store.importFolder(url) } else if case .failure(let e)=result { store.importError=e.localizedDescription } }.alert("No se pudo importar", isPresented: Binding(get:{store.importError != nil}, set:{if !$0 {store.importError=nil}})) { Button("Aceptar"){} } message:{Text(store.importError ?? "")} }
}
struct BookRow: View { let book: ImportedBook
    var body: some View { HStack { Image(systemName:"book.closed.fill").font(.largeTitle).foregroundStyle(.indigo); VStack(alignment:.leading) { Text(book.title).font(.headline); Text("\(book.code) · \(book.lessonCount) lecciones · \(book.tracks.count) audios").font(.caption).foregroundStyle(.secondary); if !book.progress.relativePath.isEmpty { Label("Continuar · L\(book.progress.lesson) · \(Int(book.progress.seconds)) s", systemImage:"play.circle").font(.caption) } } } }
}
struct BookView: View {
    @EnvironmentObject var store: LibraryStore; @EnvironmentObject var player: AudioPlayer; let bookID: UUID; @State private var mode: PlaybackMode = .fullBook
    var book: ImportedBook? { store.books.first { $0.id == bookID } }
    var lessons: [Int] { Array(Set(book?.tracks.map(\.lesson) ?? [])).sorted() }
    var body: some View { Group { if let book { List { Section { Picker("Modo", selection:$mode) { ForEach(PlaybackMode.allCases) { Text($0.rawValue).tag($0) } }; Button { player.load(book, mode:mode); player.play() } label:{Label(book.progress.relativePath.isEmpty ? "Reproducir libro" : "Continuar desde donde te quedaste", systemImage:"play.fill")} }
        Section("Lecciones") { ForEach(lessons, id:\.self) { n in let tracks=book.tracks.filter{$0.lesson==n}; NavigationLink { LessonView(bookID: bookID, number:n) } label:{VStack(alignment:.leading){Text(n==0 ? "Sin número de lección" : "Lección \(n)"); Text("\(tracks.count) audios · \(format(tracks.reduce(0){$0+$1.duration})) · \(book.lessonStates[n]?.rawValue ?? LessonState.notStarted.rawValue)").font(.caption).foregroundStyle(.secondary)}} } }
        if !book.errors.isEmpty { Section("Advertencias") { ForEach(book.errors, id:\.self) { Label($0, systemImage:"exclamationmark.triangle").foregroundStyle(.orange) } } }
    }.navigationTitle(book.title) } else { ContentUnavailableView("Libro no disponible", systemImage:"questionmark.folder") } } }
}
struct LessonView: View {
    @EnvironmentObject var store: LibraryStore
    @EnvironmentObject var player: AudioPlayer
    let bookID: UUID; let number: Int
    var book: ImportedBook? { store.books.first { $0.id == bookID } }
    var tracks: [AudioItem] { book?.tracks.filter { $0.lesson == number } ?? [] }
    var body: some View {
        List {
            Section {
                Button { if let b = book { player.load(b, mode: .lesson, lesson: number); player.play() } } label: { Label("Reproducir lección", systemImage: "play.fill") }
                if let b = book {
                    Picker("Estado", selection: Binding(get: { b.lessonStates[number] ?? .notStarted }, set: { value in var copy=b; copy.lessonStates[number]=value; store.update(copy) })) {
                        ForEach(LessonState.allCases, id: \.self) { Text($0.rawValue) }
                    }
                }
            }
            Section("Audios") {
                ForEach(tracks) { item in
                    VStack(alignment: .leading) {
                        Text(item.info?.text.isEmpty == false ? item.info!.text : item.filename)
                        if let info = item.info { Text([info.character, info.translation, info.id].filter { !$0.isEmpty }.joined(separator: " · ")).font(.caption).foregroundStyle(.secondary) }
                    }
                }
            }
        }.navigationTitle(number == 0 ? "Sin lección" : "Lección \(number)")
    }
}

struct MiniPlayer: View { @EnvironmentObject var player:AudioPlayer; @State private var expanded=false
    var body: some View { Button { expanded=true } label:{HStack{VStack(alignment:.leading){Text(player.current?.info?.text.isEmpty==false ? player.current!.info!.text:player.current?.filename ?? "").lineLimit(1);Text(player.book?.title ?? "").font(.caption).foregroundStyle(.secondary)};Spacer();Button{player.toggle()}label:{Image(systemName:player.playing ? "pause.fill":"play.fill").font(.title2)};Button{player.next()}label:{Image(systemName:"forward.fill")}}.padding().background(.ultraThinMaterial)}.buttonStyle(.plain).sheet(isPresented:$expanded){PlayerView()} }
}
struct PlayerView: View { @EnvironmentObject var player:AudioPlayer; @EnvironmentObject var store:LibraryStore; @Environment(\.dismiss) var dismiss
    var body:some View{NavigationStack{ScrollView{VStack(spacing:20){RoundedRectangle(cornerRadius:28).fill(.indigo.gradient).frame(height:260).overlay(Image(systemName:"waveform").font(.system(size:80)).foregroundStyle(.white));Text(player.current?.info?.text.isEmpty==false ? player.current!.info!.text:player.current?.filename ?? "Sin audio").font(.title2).multilineTextAlignment(.center);if let i=player.current?.info{Text(i.translation).foregroundStyle(.secondary);Text([i.character,i.id,"Lección \(i.lesson ?? player.current?.lesson ?? 0)"].filter{!$0.isEmpty}.joined(separator:" · ")).font(.caption)};Slider(value:Binding(get:{player.currentTime},set:{player.seek(to:$0)}),in:0...max(1,player.duration));HStack{Text(format(player.currentTime));Spacer();Text("−"+format(max(0,player.duration-player.currentTime)))}.font(.caption.monospacedDigit());HStack(spacing:28){Button{player.previous()}label:{Image(systemName:"backward.end.fill")};Button{player.seek(-10)}label:{Image(systemName:"gobackward.10")};Button{player.toggle()}label:{Image(systemName:player.playing ? "pause.circle.fill":"play.circle.fill").font(.system(size:64))};Button{player.seek(10)}label:{Image(systemName:"goforward.10")};Button{player.next()}label:{Image(systemName:"forward.end.fill")}}.font(.title2);HStack{Menu("\(player.speed.formatted())x"){ForEach([0.75,1,1.25,1.5,2],id:\.self){v in Button("\(v.formatted())x"){player.speed=Float(v)}}};Menu(player.repeatMode.rawValue){ForEach(RepeatMode.allCases){v in Button(v.rawValue){player.repeatMode=v}}};Button{toggleFavorite()}label:{Image(systemName:isFavorite ? "heart.fill":"heart")}};HStack{Button("Marcar A"){player.markA()};Button("Marcar B"){player.markB()};if player.abStart != nil{Button("Quitar A-B"){player.clearAB()}}};Button("Repetir esta frase"){player.repeatCurrent()}}.padding()}.navigationTitle("Reproductor").toolbar{Button("Cerrar"){dismiss()}}}}
    var isFavorite:Bool{guard let b=player.book,let c=player.current else{return false};return b.favorites.contains(c.relativePath)}
    func toggleFavorite(){guard var b=player.book,let c=player.current else{return};if b.favorites.contains(c.relativePath){b.favorites.remove(c.relativePath)}else{b.favorites.insert(c.relativePath)};player.book=b;store.update(b)}
}
struct FavoritesView: View {
    @EnvironmentObject var store: LibraryStore; @EnvironmentObject var player: AudioPlayer
    var body: some View {
        List { ForEach(store.books) { book in
            let tracks = book.tracks.filter { book.favorites.contains($0.relativePath) }
            if !tracks.isEmpty { Section(book.title) { ForEach(tracks) { track in
                Button { player.load(book); if let i=player.queue.firstIndex(of: track) { player.index=i; player.prepare(); player.play() } } label: {
                    VStack(alignment:.leading) { Text(track.info?.text.isEmpty == false ? track.info!.text : track.filename); Text(track.info?.translation ?? "").font(.caption).foregroundStyle(.secondary) }
                }
            } } }
        } }.navigationTitle("Frases para repasar")
    }
}
struct SettingsView: View {
    @EnvironmentObject var player: AudioPlayer
    var body: some View {
        Form {
            Section("Escucha activa") {
                Toggle("Pausa automática después de cada audio", isOn: $player.autoPause)
                Picker("Duración de pausa", selection: $player.pauseDuration) { ForEach([0.5,1,2,3,4,5], id: \.self) { Text("\($0.formatted()) s") } }
                Picker("Repetir cada frase", selection: $player.phraseRepeats) { ForEach([1,2,3,5], id: \.self) { Text("\($0) veces") } }
                Toggle("Primera repetición lenta", isOn: $player.slowFirst)
            }
            Section("Privacidad") { Label("Todo funciona localmente", systemImage: "lock.shield"); Text("Sin cuentas, anuncios, analítica ni cargas a servidores.").font(.caption) }
        }.navigationTitle("Configuración")
    }
}
func format(_ seconds:Double)->String{let s=Int(seconds.isFinite ? seconds:0);return String(format:"%d:%02d",s/60,s%60)}
