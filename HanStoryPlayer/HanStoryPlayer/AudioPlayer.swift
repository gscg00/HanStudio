import AVFoundation
import MediaPlayer

@MainActor final class AudioPlayer: NSObject, ObservableObject, AVAudioPlayerDelegate {
    @Published var book: ImportedBook?
    @Published var queue: [AudioItem] = []
    @Published var index = 0
    @Published var playing = false
    @Published var currentTime: Double = 0
    @Published var duration: Double = 0
    @Published var speed: Float = 1 { didSet { player?.rate = speed } }
    @Published var repeatMode: RepeatMode = .off
    @Published var mode: PlaybackMode = .fullBook
    @Published var autoPause = false
    @Published var pauseDuration = 1.0
    @Published var phraseRepeats = 1
    @Published var slowFirst = false
    @Published var abStart: Double?
    @Published var abEnd: Double?
    @Published var errors: [String] = []
    var onProgress: ((ImportedBook) -> Void)?
    private var root: URL?, player: AVAudioPlayer?, timer: Timer?, repetition = 0, access = false

    override init() { super.init(); configureSession(); configureRemote() }
    deinit { if access { root?.stopAccessingSecurityScopedResource() } }
    var current: AudioItem? { queue.indices.contains(index) ? queue[index] : nil }
    func load(_ selected: ImportedBook, mode: PlaybackMode? = nil, lesson: Int? = nil) {
        stopAccess(); book = selected; self.mode = mode ?? selected.progress.mode; speed = selected.progress.speed; repeatMode = selected.progress.repeatMode
        do { root = try ImportService().resolve(selected); access = root?.startAccessingSecurityScopedResource() ?? false }
        catch { errors.append(error.localizedDescription); return }
        queue = selected.tracks.filter { item in
            if let lesson, item.lesson != lesson { return false }
            switch self.mode { case .phrases, .lesson: return item.kind == "phrase"; case .podcastLesson: return item.kind == "podcast"; case .fullBook: return true }
        }
        index = max(0, queue.firstIndex { $0.relativePath == selected.progress.relativePath } ?? 0)
        prepare(at: selected.progress.seconds)
    }
    func prepare(at seconds: Double = 0) {
        guard let item = current, let root else { return }
        do { player = try AVAudioPlayer(contentsOf: root.appendingPathComponent(item.relativePath)); player?.enableRate = true; player?.rate = speed; player?.delegate = self; player?.currentTime = min(seconds, player?.duration ?? 0); currentTime = player?.currentTime ?? 0; duration = player?.duration ?? 0; updateNowPlaying() }
        catch { errors.append("No se pudo reproducir \(item.filename): \(error.localizedDescription)"); next() }
    }
    func toggle() { playing ? pause() : play() }
    func play() { if player == nil { prepare() }; player?.rate = speed; player?.play(); playing = true; startTimer(); updateNowPlaying() }
    func pause() { player?.pause(); playing = false; persist(); updateNowPlaying() }
    func seek(_ delta: Double) { seek(to: currentTime + delta) }
    func seek(to value: Double) { player?.currentTime = min(max(0, value), duration); currentTime = player?.currentTime ?? 0; updateNowPlaying() }
    func previous() { if currentTime > 3 { seek(to: 0) } else { move(to: max(0, index - 1)) } }
    func next() { move(to: index + 1) }
    func repeatCurrent() { seek(to: 0); play() }
    func markA() { abStart = currentTime; if let end = abEnd, end <= currentTime { abEnd = nil } }
    func markB() { if let start = abStart, currentTime > start { abEnd = currentTime; seek(to: start); play() } }
    func clearAB() { abStart=nil; abEnd=nil }
    private func move(to target: Int) {
        if target >= queue.count { if repeatMode == .book { index = 0 } else { pause(); return } }
        else { index = target }
        repetition = 0; prepare(); play(); persist()
    }
    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) { Task { @MainActor in self.finished() } }
    private func finished() {
        if repeatMode == .track || repetition + 1 < phraseRepeats { repetition += 1; prepare(); if slowFirst && repetition == 0 { player?.rate = 0.75 }; play(); return }
        if repeatMode == .lesson, let lesson = current?.lesson, let first = queue.firstIndex(where: { $0.lesson == lesson }), index + 1 >= queue.count || queue[index + 1].lesson != lesson { index = first; prepare(); play(); return }
        if autoPause { playing = false; DispatchQueue.main.asyncAfter(deadline: .now() + pauseDuration) { [weak self] in self?.next() } } else { next() }
    }
    private func startTimer() { timer?.invalidate(); timer = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { [weak self] _ in Task { @MainActor in guard let self else { return }; self.currentTime = self.player?.currentTime ?? 0; if let end = self.abEnd, self.currentTime >= end { self.seek(to: self.abStart ?? 0); self.play() }; self.persist() } } }
    private func persist() { guard var book, let current else { return }; book.progress = BookProgress(relativePath: current.relativePath, lesson: current.lesson, seconds: currentTime, speed: speed, repeatMode: repeatMode, mode: mode); self.book = book; onProgress?(book) }
    private func configureSession() { try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio); try? AVAudioSession.sharedInstance().setActive(true) }
    private func configureRemote() { let c = MPRemoteCommandCenter.shared(); c.playCommand.addTarget { [weak self] _ in Task { @MainActor in self?.play() }; return .success }; c.pauseCommand.addTarget { [weak self] _ in Task { @MainActor in self?.pause() }; return .success }; c.nextTrackCommand.addTarget { [weak self] _ in Task { @MainActor in self?.next() }; return .success }; c.previousTrackCommand.addTarget { [weak self] _ in Task { @MainActor in self?.previous() }; return .success }; c.skipForwardCommand.preferredIntervals=[10]; c.skipForwardCommand.addTarget { [weak self] _ in Task { @MainActor in self?.seek(10) }; return .success }; c.skipBackwardCommand.preferredIntervals=[10]; c.skipBackwardCommand.addTarget { [weak self] _ in Task { @MainActor in self?.seek(-10) }; return .success } }
    private func updateNowPlaying() { guard let item = current else { return }; MPNowPlayingInfoCenter.default().nowPlayingInfo = [MPMediaItemPropertyTitle: item.info?.text.isEmpty == false ? item.info!.text : item.filename, MPMediaItemPropertyArtist: item.info?.character ?? book?.title ?? "HanStory", MPNowPlayingInfoPropertyElapsedPlaybackTime: currentTime, MPMediaItemPropertyPlaybackDuration: duration, MPNowPlayingInfoPropertyPlaybackRate: playing ? speed : 0] }
    private func stopAccess() { player?.stop(); timer?.invalidate(); if access { root?.stopAccessingSecurityScopedResource() }; access=false }
}

