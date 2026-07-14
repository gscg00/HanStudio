import XCTest
@testable import HanStoryPlayer

final class HanStoryPlayerTests: XCTestCase {
    func testNaturalSort() { XCTAssertTrue(NaturalSort.less("L2-10.mp3", "L10-01.mp3")); XCTAssertTrue(NaturalSort.less("audio9.mp3", "audio12.mp3")) }
    func testLessonAndAudioIDParsing() { XCTAssertEqual(AudioNameParser.lesson("L29-01 - 3001 - Abuela.mp3"), 29); XCTAssertEqual(AudioNameParser.lesson("029_Leccion_29.mp3"), 29); XCTAssertEqual(AudioNameParser.audioID("L01-08 - V5008 - Bora.mp3"), "V5008"); XCTAssertEqual(AudioNameParser.audioID("PODB030001"), "PODB030001") }
    func testProgressRoundTrip() throws { let value=BookProgress(relativePath:"lesson_audio/L02-03.mp3",lesson:2,seconds:19.75,speed:1.25,repeatMode:.lesson,mode:.lesson); XCTAssertEqual(try JSONDecoder().decode(BookProgress.self,from:JSONEncoder().encode(value)),value) }
    func testCSVUsesCleanText() { let rows=CSV.parse("id,text,text_tts,translation_or_blank\n1001,Hola,Ho-la,Hello\n"); XCTAssertEqual(rows[1][1],"Hola"); XCTAssertEqual(rows[1][2],"Ho-la") }
    func testGroupingByLesson() { let tracks=[AudioItem(relativePath:"a",filename:"L2-a.mp3",lesson:2,audioID:"1",kind:"phrase"),AudioItem(relativePath:"b",filename:"L1-b.mp3",lesson:1,audioID:"2",kind:"phrase")]; let grouped=Dictionary(grouping:tracks,by:\.lesson); XCTAssertEqual(grouped[1]?.count,1); XCTAssertEqual(grouped[2]?.count,1) }
    func testMissingAudioDetectionFixture() throws { let root=FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString); try FileManager.default.createDirectory(at:root,withIntermediateDirectories:true); defer{try? FileManager.default.removeItem(at:root)}; XCTAssertThrowsError(try ImportService().importBook(at:root)) }
}

