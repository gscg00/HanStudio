import assert from "node:assert/strict";
import {
  answerFeedback,
  evaluateGuidedAnswer,
  normalizeGuidedAnswer,
} from "../src/guided_course_answers.js";
import { scoreActivities } from "../src/guided_course_logic.js";
import {
  speechLanguageCode,
  speechRecognitionSupport,
} from "../src/guided_speech_recognition.js";
import { resolveGuidedOptionAudioKey, reviewItemsForSession } from "../src/japanese_course_app.js";

assert.equal(normalizeGuidedAnswer("  ¡Ça va!  ", { language: "French", keepSpaces: true }), "ca va");
assert.equal(normalizeGuidedAnswer("أَهْلًا", { language: "Arabic" }), "اهلا");
assert.equal(normalizeGuidedAnswer("안녕하세요?", { language: "Korean" }), "안녕하세요");
assert.equal(speechLanguageCode("English"), "en-US");
assert.equal(speechLanguageCode("French"), "fr-FR");
assert.equal(speechLanguageCode("Korean"), "ko-KR");
assert.equal(speechLanguageCode("Japanese"), "ja-JP");
assert.equal(speechLanguageCode("Chinese"), "zh-CN");
assert.equal(speechLanguageCode("Arabic"), "ar-SA");
assert.equal(speechRecognitionSupport().supported, false);

const listeningChoice = {
  answer: "ㄷ",
  audio: "다",
  options: ["ㄷ", "ㅍ", "ㅜ"],
};
const courseAudioActivities = [
  { target: "ㄷ", audio: "다" },
  { target: "ㅍ", audio: "파" },
  { target: "ㅜ", audio: "우" },
];
const courseAudioManifest = { 다: "audio/da.m4a", 파: "audio/pa.m4a", 우: "audio/u.m4a" };
assert.equal(resolveGuidedOptionAudioKey(listeningChoice, "ㄷ", courseAudioActivities, courseAudioManifest), "다");
assert.equal(resolveGuidedOptionAudioKey(listeningChoice, "ㅍ", courseAudioActivities, courseAudioManifest), "파");
assert.equal(resolveGuidedOptionAudioKey(listeningChoice, "ㅜ", courseAudioActivities, courseAudioManifest), "우");

const reviewNow = new Date("2026-07-30T12:00:00Z");
const dueReviews = Array.from({ length: 25 }, (_, index) => ({
  activityId: `review-${index}`,
  dueAt: "2026-07-29T12:00:00Z",
}));
assert.equal(reviewItemsForSession({ mistakes: dueReviews }, 20, reviewNow).length, 20);
assert.equal(reviewItemsForSession({ mistakes: dueReviews }, 8, reviewNow).length, 8);

const translation = {
  id: "translation",
  type: "typed_translation",
  answer: "Ich verstehe nicht.",
  accepted_answers: ["Ich verstehe nicht"],
  allow_minor_typos: true,
};
assert.equal(evaluateGuidedAnswer(translation, "ich verstehe nicht", "German").correct, true);
assert.equal(evaluateGuidedAnswer(translation, "ich verstehe", "German").correct, false);

// Las fórmulas visuales se usan para explicar una combinación, pero la
// respuesta que se escribe debe ser únicamente el resultado final.
const frenchCombination={type:"complete_without_options",answer:"ch + a → cha"};
assert.equal(evaluateGuidedAnswer(frenchCombination,"cha","French").correct,true);
assert.equal(evaluateGuidedAnswer(frenchCombination,"ch + a → cha","French").correct,true);
const koreanCombination={type:"complete_without_options",answer:"ㅁ + ㅜ + ㄴ = 문"};
assert.equal(evaluateGuidedAnswer(koreanCombination,"문","Korean").correct,true);

const optionalSpeaking = {
  id: "speaking",
  type: "speak_and_transcribe",
  answer: "Bonjour",
  optional: true,
};
assert.deepEqual(
  evaluateGuidedAnswer(optionalSpeaking, "__skipped__", "French").skipped,
  true,
);

const dialogue = {
  id: "dialogue",
  type: "guided_dialogue",
  turns: [
    { role: "model", text: "Hello" },
    { role: "learner", answer: "Hello", accepted_answers: ["Hi"] },
    { role: "model", text: "How are you?" },
    { role: "learner", answer: "I am fine", accepted_answers: ["I'm fine"] },
  ],
  minimum_correct: 2,
};
const dialogueResult = answerFeedback(
  dialogue,
  { responses: ["Hi", "I'm fine"] },
  "English",
);
assert.equal(dialogueResult.correct, true);
assert.match(dialogueResult.message, /2 de 2/);

const score = scoreActivities(
  [translation, optionalSpeaking, dialogue],
  {
    translation: "Ich verstehe nicht.",
    speaking: "__skipped__",
    dialogue: { responses: ["Hi", "wrong"] },
  },
  "German",
);
assert.equal(score.total, 2);
assert.equal(score.correct, 1);
assert.equal(score.skipped, 1);
assert.equal(score.percentage, 50);

console.log("guided production logic: ok");
