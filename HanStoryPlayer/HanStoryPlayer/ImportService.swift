import Foundation
import AVFoundation

enum ImportError: LocalizedError { case noAccess, noAudio
    var errorDescription: String? { self == .noAccess ? "No se pudo acceder a la carpeta." : "No se encontraron audios compatibles." }
}

enum NaturalSort {
    static func less(_ a: String, _ b: String) -> Bool {
        a.compare(b, options: [.numeric, .caseInsensitive, .diacriticInsensitive]) == .orderedAscending
    }
}

enum AudioNameParser {
    static func lesson(_ name: String) -> Int {
        for pattern in [#"(?i)(?:^|[^a-z])L(?:ecci[oó]n)?[_ -]*0*(\d+)"#, #"^0*(\d+)_Lecci[oó]n"#, #"(?i)^POD[A-Z]*0*(\d{2})(?:\d{4})"#] {
            if let r = name.range(of: pattern, options: .regularExpression),
               let n = Int(String(name[r]).replacingOccurrences(of: #"\D"#, with: "", options: .regularExpression).prefix(2)) { return n }
        }
        return 0
    }
    static func audioID(_ name: String) -> String? {
        let patterns = [#"(?i)\bPOD[A-Z]*\d+\b"#, #"(?i)(?:^|\s-\s)(V?\d{3,})(?:\s-\s|\b)"#]
        for p in patterns where name.range(of: p, options: .regularExpression) != nil {
            let match = String(name[name.range(of: p, options: .regularExpression)!])
            return match.trimmingCharacters(in: CharacterSet.alphanumerics.inverted).components(separatedBy: " - ").first(where: { $0.rangeOfCharacter(from: .decimalDigits) != nil })
        }
        return nil
    }
}

final class ImportService {
    private let fm = FileManager.default
    func importBook(at root: URL) throws -> ImportedBook {
        guard root.startAccessingSecurityScopedResource() else { throw ImportError.noAccess }
        defer { root.stopAccessingSecurityScopedResource() }
        let bookmark = try root.bookmarkData(options: .minimalBookmark, includingResourceValuesForKeys: nil, relativeTo: nil)
        let metadata = readMetadata(root)
        let manifests = ["Podcast_Tecnico.txt", "Audios_Tecnico.txt"].compactMap { manifest(root.appendingPathComponent($0)) }
        let rankings = Dictionary(uniqueKeysWithValues: manifests.flatMap { $0 }.enumerated().map { ($1.lowercased(), $0) })
        let csv = readCSV(root.appendingPathComponent("Audio_Master.csv")).merging(readCSV(root.appendingPathComponent("Podcast_Master.csv"))) { a, _ in a }
        let keys: [URLResourceKey] = [.isRegularFileKey, .fileSizeKey]
        let options: FileManager.DirectoryEnumerationOptions = [.skipsHiddenFiles, .skipsPackageDescendants]
        let urls = (fm.enumerator(at: root, includingPropertiesForKeys: keys, options: options)?.allObjects as? [URL] ?? [])
            .filter { ["mp3", "m4a", "wav"].contains($0.pathExtension.lowercased()) }
        guard !urls.isEmpty else { throw ImportError.noAudio }
        var errors: [String] = []
        var items = urls.map { url -> AudioItem in
            let relative = String(url.path.dropFirst(root.path.count + 1))
            let id = AudioNameParser.audioID(url.deletingPathExtension().lastPathComponent)
            let folder = url.deletingLastPathComponent().lastPathComponent.lowercased()
            let kind = folder.contains("podcast") ? "podcast" : "phrase"
            if (try? url.resourceValues(forKeys: Set(keys)).fileSize) == 0 { errors.append("Archivo vacío: \(relative)") }
            return AudioItem(relativePath: relative, filename: url.lastPathComponent, lesson: AudioNameParser.lesson(relative), audioID: id, kind: kind, info: id.flatMap { csv[$0.lowercased()] })
        }
        items.sort { a, b in
            let ar = rankings[a.audioID?.lowercased() ?? ""]
            let br = rankings[b.audioID?.lowercased() ?? ""]
            if ar != nil || br != nil { return (ar ?? Int.max) < (br ?? Int.max) }
            if a.lesson != b.lesson { return a.lesson < b.lesson }
            if a.audioID != b.audioID { return NaturalSort.less(a.audioID ?? "~", b.audioID ?? "~") }
            return NaturalSort.less(a.relativePath, b.relativePath)
        }
        let cover = ["cover.jpg", "cover.png", "portada.jpg", "portada.png"].first { fm.fileExists(atPath: root.appendingPathComponent($0).path) }
        return ImportedBook(id: UUID(), title: metadata.title ?? root.lastPathComponent, code: metadata.code ?? root.lastPathComponent.components(separatedBy: "_").first ?? "HanStory", bookmark: bookmark, coverRelativePath: cover, tracks: items, errors: errors)
    }
    func resolve(_ book: ImportedBook) throws -> URL {
        var stale = false
        return try URL(resolvingBookmarkData: book.bookmark, options: [.withoutUI], relativeTo: nil, bookmarkDataIsStale: &stale)
    }
    private func readMetadata(_ root: URL) -> (title: String?, code: String?) {
        guard let data = try? Data(contentsOf: root.appendingPathComponent("project_config.json")), let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return (nil, nil) }
        func value(_ keys: [String]) -> String? { keys.compactMap { json[$0] as? String }.first }
        return (value(["book_title", "title", "project_name"]), value(["book_code", "code", "project_code"]))
    }
    private func manifest(_ url: URL) -> [String]? {
        guard let text = try? String(contentsOf: url, encoding: .utf8) else { return nil }
        return text.split(whereSeparator: \.isNewline).compactMap { line in
            let s = String(line)
            guard !s.trimmingCharacters(in: .whitespaces).hasPrefix("#") else { return nil }
            return AudioNameParser.audioID(s)
        }
    }
    private func readCSV(_ url: URL) -> [String: PhraseInfo] {
        guard let text = try? String(contentsOf: url, encoding: .utf8) else { return [:] }
        let rows = CSV.parse(text); guard let header = rows.first else { return [:] }
        let names = header.map { $0.lowercased() }
        func idx(_ choices: [String]) -> Int? { choices.compactMap { names.firstIndex(of: $0) }.first }
        guard let id = idx(["id", "audio_id"]) else { return [:] }
        var result: [String: PhraseInfo] = [:]
        for row in rows.dropFirst() where row.count > id {
            func field(_ choices: [String]) -> String { idx(choices).flatMap { row.indices.contains($0) ? row[$0] : nil } ?? "" }
            let key = row[id].lowercased(); guard !key.isEmpty else { continue }
            result[key] = PhraseInfo(id: row[id], text: field(["text", "texto", "target_text"]), translation: field(["translation", "translation_or_blank", "traduccion"]), character: field(["speaker", "speaker_or_blank", "character", "personaje"]), lesson: Int(field(["lesson", "lesson_number"])))
        }
        return result
    }
}

enum CSV {
    static func parse(_ text: String) -> [[String]] {
        var rows = [[String]](), row = [String](), field = ""; var quoted = false
        let chars = Array(text); var i = 0
        while i < chars.count { let c = chars[i]
            if c == "\"" { if quoted && i + 1 < chars.count && chars[i+1] == "\"" { field.append("\""); i += 1 } else { quoted.toggle() } }
            else if c == "," && !quoted { row.append(field); field = "" }
            else if c.isNewline && !quoted { if c == "\n" { row.append(field); rows.append(row); row=[]; field="" } }
            else { field.append(c) }; i += 1
        }
        if !field.isEmpty || !row.isEmpty { row.append(field); rows.append(row) }
        return rows
    }
}
