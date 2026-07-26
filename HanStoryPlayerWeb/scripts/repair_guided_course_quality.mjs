#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, "..");
const coursesRoot = path.join(webRoot, "library", "courses");
const choiceTypes = new Set([
  "audio_to_kana",
  "complete_particle",
  "dialogue_comprehension",
  "image_to_word",
  "kana_choice",
  "kana_to_audio",
  "listening_choice",
  "minimal_pair",
  "reading_comprehension",
  "select_translation",
  "word_to_translation",
]);
const replacements = new Map([
  [
    "¿Podrías explicar tu conclusión con un ejemplo?",
    "¿Puedes explicarlo con un ejemplo?",
  ],
]);

const normalize = (value) => String(value ?? "")
  .normalize("NFKC")
  .trim()
  .toLocaleLowerCase("es");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function replaceText(value) {
  if (typeof value !== "string") return value;
  let result = value;
  for (const [before, after] of replacements) {
    result = result.replaceAll(before, after);
  }
  return result;
}

function repairUnit(language, unit) {
  let changes = 0;
  const activities = (unit.lessons ?? []).flatMap((lesson) => lesson.activities ?? []);
  const answerPool = activities
    .filter((activity) => choiceTypes.has(activity.type))
    .flatMap((activity) => activity.type === "select_translation"
      ? [activity.answer]
      : [activity.answer, activity.target])
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
  const translationPool = activities
    .filter((activity) => activity.type === "select_translation")
    .map((activity) => String(activity.answer ?? "").trim())
    .filter(Boolean);
  const writtenPool = activities
    .filter((activity) => choiceTypes.has(activity.type) && activity.type !== "select_translation")
    .flatMap((activity) => [activity.answer, activity.target])
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  for (const activity of activities) {
    for (const field of ["answer", "explanation", "meaning", "sound_hint", "memory_hint"]) {
      const replaced = replaceText(activity[field]);
      if (replaced !== activity[field]) {
        activity[field] = replaced;
        changes += 1;
      }
    }
    if (Array.isArray(activity.options)) {
      activity.options = activity.options.map((option) => {
        const replaced = replaceText(option);
        if (replaced !== option) changes += 1;
        return replaced;
      });
    }

    if (activity.teaching_kind === "rule") {
      const linkedMeaning = activities.find((candidate) =>
        candidate.type === "select_translation"
        && candidate.target === activity.target
        && /^¿?qué significa\b/i.test(String(candidate.prompt ?? "").trim())
      );
      if (linkedMeaning) {
        activity.teaching_kind = "concept";
        activity.meaning = linkedMeaning.answer;
        changes += 2;
      }
    }

    if (
      activity.type === "listening_choice"
      && activity.prompt === "Escucha y elige la palabra o frase correcta"
      && normalize(activity.audio) !== normalize(activity.answer)
    ) {
      activity.prompt = language === "Chinese"
        ? "Escucha la pronunciación y elige los caracteres correctos"
        : "Escucha el ejemplo y elige la letra, grupo o patrón que representa";
      changes += 1;
    }

    if (!choiceTypes.has(activity.type) || !Array.isArray(activity.options)) continue;
    const used = new Set();
    activity.options = activity.options.map((option) => {
      const key = normalize(option);
      if (!used.has(key)) {
        used.add(key);
        return option;
      }
      const replacement = answerPool.find((candidate) => {
        const candidateKey = normalize(candidate);
        return candidateKey && !used.has(candidateKey);
      });
      if (!replacement) return option;
      used.add(normalize(replacement));
      changes += 1;
      return replacement;
    });
    const preferredPool = activity.type === "select_translation"
      ? translationPool
      : writtenPool;
    for (const candidate of [...preferredPool, ...answerPool]) {
      if (activity.options.length >= 3) break;
      const candidateKey = normalize(candidate);
      if (!candidateKey || used.has(candidateKey)) continue;
      activity.options.push(candidate);
      used.add(candidateKey);
      changes += 1;
    }
  }

  return changes;
}

let changedFiles = 0;
let changedFields = 0;

for (const language of fs.readdirSync(coursesRoot)) {
  const coursePath = path.join(coursesRoot, language, "course.json");
  if (!fs.existsSync(coursePath)) continue;
  const course = readJson(coursePath);
  for (const summary of course.units ?? []) {
    if (!summary.manifest) continue;
    const unitPath = path.join(coursesRoot, language, summary.manifest);
    if (!fs.existsSync(unitPath)) continue;
    const unit = readJson(unitPath);
    const changes = repairUnit(language, unit);
    if (!changes) continue;
    fs.writeFileSync(unitPath, `${JSON.stringify(unit, null, 2)}\n`);
    changedFiles += 1;
    changedFields += changes;
  }
}

console.log(JSON.stringify({ changedFiles, changedFields }, null, 2));
