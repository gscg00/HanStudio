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

const translation = {
  id: "translation",
  type: "typed_translation",
  answer: "Ich verstehe nicht.",
  accepted_answers: ["Ich verstehe nicht"],
  allow_minor_typos: true,
};
assert.equal(evaluateGuidedAnswer(translation, "ich verstehe nicht", "German").correct, true);
assert.equal(evaluateGuidedAnswer(translation, "ich verstehe", "German").correct, false);

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
