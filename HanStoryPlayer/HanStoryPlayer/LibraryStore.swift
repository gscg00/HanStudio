import Foundation
import SwiftUI

@MainActor final class LibraryStore: ObservableObject {
    @Published var books: [ImportedBook] = [] { didSet { save() } }
    @Published var importError: String?
    private let key = "hanstory.library.v1"
    let importer = ImportService()
    init() { if let data = UserDefaults.standard.data(forKey: key), let value = try? JSONDecoder().decode([ImportedBook].self, from: data) { books = value } }
    func importFolder(_ url: URL) {
        do { let book = try importer.importBook(at: url); books.removeAll { $0.code == book.code }; books.append(book) }
        catch { importError = error.localizedDescription }
    }
    func remove(_ offsets: IndexSet) { books.remove(atOffsets: offsets) }
    func update(_ book: ImportedBook) { if let i = books.firstIndex(where: { $0.id == book.id }) { books[i] = book } }
    private func save() { if let data = try? JSONEncoder().encode(books) { UserDefaults.standard.set(data, forKey: key) } }
}

