import AVFoundation
import LinguaCore

@MainActor final class SpeechService: NSObject, ObservableObject {
    private let synthesizer = AVSpeechSynthesizer()
    @Published var voiceAvailable = true
    func speak(_ text: String, language: Language, rate: Float = 0.45) {
        let voice = AVSpeechSynthesisVoice(language: language.locale); voiceAvailable = voice != nil
        let utterance = AVSpeechUtterance(string: text); utterance.voice = voice; utterance.rate = rate; synthesizer.speak(utterance)
    }
}
