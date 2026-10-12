import Testing
@testable import LinguaCore

@Test func contentCoverage() { let s=ContentStore.shared; #expect(s.concepts.count == 120); #expect(s.phrases.count == 120); for c in s.concepts { #expect(c.realizations.count == 4); #expect(!c.illustration.isEmpty) } }
@Test func sm2SchedulesSuccessFurtherAway() { let now=Date(); let first=SM2.review(ReviewState(conceptID:"c1"),quality:5,now:now); let second=SM2.review(first,quality:5,now:now); #expect(first.interval == 1); #expect(second.interval == 6); #expect(second.due > first.due) }
@Test func sm2ResetsAfterFailure() { var state=ReviewState(conceptID:"c1",interval:20,repetitions:4); state=SM2.review(state,quality:1); #expect(state.repetitions == 0); #expect(state.interval == 1) }
@Test func generatorCreatesEightKinds() { let ex=ExerciseGenerator().lesson(for:ContentStore.shared.concepts(for:.greetings),language:.korean); #expect(ex.count == 8); #expect(Set(ex.map(\.kind)).count == 8); #expect(ex.allSatisfy{$0.choices.count == 4}) }
}
