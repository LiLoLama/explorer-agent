import Foundation
import AVFoundation
import Speech

@MainActor
final class AudioSpeechService: NSObject, AVAudioRecorderDelegate {
    private var recorder: AVAudioRecorder?
    private let audioSession = AVAudioSession.sharedInstance()
    private let recognizer = SFSpeechRecognizer()
    private var recognitionTask: SFSpeechRecognitionTask?
    private let request = SFSpeechAudioBufferRecognitionRequest()
    private let engine = AVAudioEngine()

    func requestPermissions() async throws {
        let micOk = try await audioSession.requestRecordPermission()
        guard micOk else { throw NSError(domain: "mic", code: 1) }
        _ = SFSpeechRecognizer.authorizationStatus()
        // App fragt beim ersten Start automatisch um Erlaubnis (Info.plist Texte vorhanden)
    }

    func transcribeLive() async throws -> AsyncStream<String> {
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true)

        let input = engine.inputNode
        let format = input.outputFormat(forBus: 0)
        input.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
            self?.request.append(buffer)
        }
        engine.prepare()
        try engine.start()

        let stream = AsyncStream<String> { cont in
            recognitionTask = recognizer?.recognitionTask(with: request) { result, error in
                if let t = result?.bestTranscription.formattedString {
                    cont.yield(t)
                }
                if let _ = error { cont.finish() }
                if result?.isFinal == true { cont.finish() }
            }
        }
        return stream
    }

    func stopTranscription() {
        engine.stop()
        engine.inputNode.removeTap(onBus: 0)
        request.endAudio()
        recognitionTask?.cancel()
    }
}
