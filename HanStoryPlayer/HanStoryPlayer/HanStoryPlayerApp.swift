import SwiftUI

@main struct HanStoryPlayerApp: App {
    @StateObject private var store = LibraryStore()
    @StateObject private var player = AudioPlayer()
    var body: some Scene { WindowGroup { RootView().environmentObject(store).environmentObject(player).onAppear { player.onProgress = { store.update($0) } } } }
}

