import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, "..");
const coursesRoot = path.join(webRoot, "library", "courses");
const supportedLanguages = [
  "Arabic",
  "Chinese",
  "English",
  "French",
  "German",
  "Italian",
  "Japanese",
  "Korean",
  "Portuguese",
  "Russian",
];
const teachingTypes = new Set([
  "teach_concept",
  "teach_word",
  "teach_pattern",
  "teach_kanji",
  "dialogue_model",
]);
const gradableTypes = new Set([
  "audio_to_kana",
  "build_word",
  "complete_particle",
  "dialogue_comprehension",
  "image_to_word",
  "kana_choice",
  "kana_to_audio",
  "listening_choice",
  "minimal_pair",
  "reading_comprehension",
  "reorder_sentence",
  "reorder_syllables",
  "select_translation",
  "speak_and_compare",
  "trace_kana",
  "trace_kanji",
  "word_to_translation",
]);
const selectableTypes = new Set([
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
const spanishInstructionAnswers = new Set([
  "Escucha, deja una pausa y repite.",
  "Escucha y repite.",
  "Repite después del audio.",
]);

const issues = [];
const stats = {
  courses: 0,
  units: 0,
  lessons: 0,
  activities: 0,
  gradable: 0,
  audioReferences: 0,
  byLanguage: {},
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function clean(value) {
  return String(value ?? "").trim();
}

function normalize(value) {
  return clean(value)
    .normalize("NFKC")
    .toLocaleLowerCase("es")
    .replace(/[¡!¿?.,;:«»"'()[\]{}]/g, "")
    .replace(/\s+/g, " ");
}

function hasNonLatinWriting(value) {
  return /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\u0400-\u04ff\u0600-\u06ff]/u
    .test(clean(value));
}

function addIssue(severity, code, context, message) {
  issues.push({ severity, code, ...context, message });
}

function context(language, unit, lesson, activity = null) {
  return {
    language,
    unitId: unit?.id ?? "",
    lessonId: lesson?.id ?? "",
    activityId: activity?.id ?? "",
  };
}

function manifestHasAudio(manifest, key) {
  if (!key) return true;
  return Boolean(manifest[key]);
}

function manifestAudioExists(languageRoot, manifest, key) {
  if (!key || !manifest[key]) return false;
  return fs.existsSync(path.resolve(languageRoot, manifest[key]));
}

function isMeaningQuestion(activity) {
  return activity.type === "select_translation"
    && /^¿?qué significa\b/i.test(clean(activity.prompt));
}

function isPronunciationOrRuleQuestion(activity) {
  const prompt = clean(activity.prompt).toLocaleLowerCase("es");
  return prompt.includes("cómo se pronuncia")
    || prompt.includes("qué debes recordar")
    || prompt.includes("qué regla")
    || prompt.includes("qué función");
}

function hasPriorTeaching(activities, activityIndex, activity) {
  const target = normalize(activity.target);
  const answer = normalize(activity.answer);
  const audio = normalize(activity.audio);
  return activities.slice(0, activityIndex).some((candidate) => {
    if (!teachingTypes.has(candidate.type)) return false;
    const candidateTarget = normalize(candidate.target);
    const candidateMeaning = normalize(candidate.meaning);
    const candidateAudio = normalize(candidate.audio);
    return Boolean(
      (target && candidateTarget === target)
      || (answer && candidateMeaning === answer)
      || (audio && candidateAudio === audio)
    );
  });
}

function hasFollowingMeaning(activities, activityIndex, activity) {
  return activities.slice(activityIndex + 1).some((candidate) => {
    if (candidate.type !== "select_translation" || !clean(candidate.answer)) return false;
    return Boolean(
      (clean(activity.target) && clean(candidate.target) === clean(activity.target))
      || (clean(activity.audio) && clean(candidate.audio) === clean(activity.audio))
    );
  });
}

function auditActivity(language, unit, lesson, activities, index, manifest, languageRoot) {
  const activity = activities[index];
  const where = context(language, unit, lesson, activity);
  stats.activities += 1;
  stats.byLanguage[language].activities += 1;

  if (!clean(activity.id)) {
    addIssue("error", "missing_activity_id", where, "La actividad no tiene ID.");
  }

  if (
    teachingTypes.has(activity.type)
    && activity.teaching_kind === "concept"
    && clean(activity.target)
    && !clean(activity.meaning)
    && !hasFollowingMeaning(activities, index, activity)
  ) {
    addIssue(
      "error",
      "concept_without_spanish_meaning",
      where,
      "La tarjeta enseña un concepto, pero no ofrece significado en español.",
    );
  }

  for (const field of ["audio", "slow_audio"]) {
    const key = clean(activity[field]);
    if (!key) continue;
    stats.audioReferences += 1;
    if (!manifestHasAudio(manifest, key)) {
      addIssue(
        "error",
        "missing_audio_manifest_entry",
        where,
        `${field} referencia «${key}», pero no existe en audio_manifest.json.`,
      );
    } else if (!manifestAudioExists(languageRoot, manifest, key)) {
      addIssue(
        "error",
        "missing_audio_file",
        where,
        `${field} referencia «${key}», pero el archivo físico no existe.`,
      );
    }
  }

  if (gradableTypes.has(activity.type) || activity.gradable === true) {
    stats.gradable += 1;
    stats.byLanguage[language].gradable += 1;
    const options = Array.isArray(activity.options) ? activity.options : [];
    const answer = clean(activity.answer);
    const normalizedOptions = options.map(normalize);
    const normalizedAnswer = normalize(answer);

    if (!answer) {
      addIssue("error", "missing_answer", where, "La actividad evaluable no tiene respuesta.");
    }
    if (
      selectableTypes.has(activity.type)
      && options.length
      && !normalizedOptions.includes(normalizedAnswer)
    ) {
      addIssue(
        "error",
        "answer_not_selectable",
        where,
        `La respuesta «${answer}» no aparece entre las opciones.`,
      );
    }
    if (selectableTypes.has(activity.type) && options.length < 2) {
      addIssue(
        "error",
        "insufficient_options",
        where,
        "La actividad de selección ofrece menos de dos opciones.",
      );
    }
    if (options.length && new Set(normalizedOptions).size !== normalizedOptions.length) {
      const duplicateIsNeededForAssembly = activity.type === "build_word"
        || activity.type === "reorder_syllables";
      if (!duplicateIsNeededForAssembly) {
        addIssue(
          "error",
          "duplicate_options",
          where,
          "La actividad ofrece opciones duplicadas.",
        );
      }
    }
    if (options.length >= 2 && normalizedOptions.every((option) => option === normalizedAnswer)) {
      addIssue(
        "error",
        "all_options_equal_answer",
        where,
        "Todas las opciones son iguales a la respuesta.",
      );
    }
  }

  if (isMeaningQuestion(activity)) {
    if (
      normalize(activity.target) === normalize(activity.answer)
      && hasNonLatinWriting(activity.target)
    ) {
      addIssue(
        "error",
        "meaning_repeats_target",
        where,
        "La supuesta traducción repite el texto del idioma objetivo.",
      );
    } else if (normalize(activity.target) === normalize(activity.answer)) {
      addIssue(
        "warning",
        "identity_translation",
        where,
        "La traducción coincide con la forma objetivo; conviene confirmar que sea un cognado real.",
      );
    }
    if (spanishInstructionAnswers.has(clean(activity.answer))) {
      addIssue(
        "error",
        "instruction_used_as_translation",
        where,
        `La respuesta «${activity.answer}» es una instrucción, no una traducción.`,
      );
    }
  }

  if (
    activity.type === "listening_choice"
    && clean(activity.prompt) === "Escucha y elige la palabra o frase correcta"
    && clean(activity.audio)
    && normalize(activity.audio) !== normalize(activity.answer)
  ) {
    addIssue(
      "warning",
      "ambiguous_listening_prompt",
      where,
      `El audio «${activity.audio}» no coincide literalmente con la respuesta «${activity.answer}». El enunciado debe explicar qué relación se evalúa.`,
    );
  }

  for (const example of activity.audio_examples ?? []) {
    const audioKey = clean(example.audio);
    if (!audioKey || !manifestHasAudio(manifest, audioKey)) {
      addIssue(
        "error",
        "missing_example_audio",
        where,
        `El ejemplo «${clean(example.label) || clean(example.text)}» no tiene un audio válido.`,
      );
    } else if (!manifestAudioExists(languageRoot, manifest, audioKey)) {
      addIssue(
        "error",
        "missing_example_audio_file",
        where,
        `El archivo físico del ejemplo «${clean(example.label) || clean(example.text)}» no existe.`,
      );
    }
    if (!clean(example.text) || !clean(example.meaning)) {
      addIssue(
        "error",
        "incomplete_audio_example",
        where,
        "Un ejemplo de audio no incluye texto y significado.",
      );
    }
  }

  if (
    isPronunciationOrRuleQuestion(activity)
    && isMeaningQuestion(activity)
  ) {
    addIssue(
      "error",
      "rule_mislabeled_as_meaning",
      where,
      "Una regla de lectura o gramática está presentada como traducción.",
    );
  }

  if (
    gradableTypes.has(activity.type)
    && !lesson.isReview
    && !lesson.isTest
    && index > 0
    && activities.some((candidate) => teachingTypes.has(candidate.type))
    && !hasPriorTeaching(activities, index, activity)
    && ["listening_choice", "select_translation"].includes(activity.type)
  ) {
    addIssue(
      "warning",
      "tested_before_taught",
      where,
      "No se encontró una tarjeta de enseñanza anterior vinculada a esta pregunta.",
    );
  }
}

function auditCourse(language) {
  const languageRoot = path.join(coursesRoot, language);
  const coursePath = path.join(languageRoot, "course.json");
  if (!fs.existsSync(coursePath)) {
    addIssue("error", "missing_course", { language }, "Falta course.json.");
    return;
  }

  const course = readJson(coursePath);
  const audioManifestPath = path.join(languageRoot, "audio_manifest.json");
  const manifest = fs.existsSync(audioManifestPath)
    ? (readJson(audioManifestPath).items ?? {})
    : {};
  const unitIds = new Set();
  const lessonIds = new Set();
  const activityIds = new Set();
  stats.courses += 1;
  stats.byLanguage[language] = {
    units: 0,
    lessons: 0,
    activities: 0,
    gradable: 0,
  };

  for (const summary of course.units ?? []) {
    if (unitIds.has(summary.id)) {
      addIssue(
        "error",
        "duplicate_unit_id",
        { language, unitId: summary.id },
        "El curso repite un ID de unidad.",
      );
    }
    unitIds.add(summary.id);

    const manifestPath = clean(summary.manifest);
    const unitPath = path.join(languageRoot, manifestPath);
    if (!manifestPath || !fs.existsSync(unitPath)) {
      addIssue(
        "error",
        "missing_unit_manifest",
        { language, unitId: summary.id },
        `No existe el archivo de unidad «${manifestPath}».`,
      );
      continue;
    }

    const unit = readJson(unitPath);
    stats.units += 1;
    stats.byLanguage[language].units += 1;

    if (unit.id !== summary.id) {
      addIssue(
        "error",
        "unit_id_mismatch",
        { language, unitId: summary.id },
        `course.json usa «${summary.id}», pero el archivo declara «${unit.id}».`,
      );
    }

    for (const lesson of unit.lessons ?? []) {
      stats.lessons += 1;
      stats.byLanguage[language].lessons += 1;
      if (lessonIds.has(lesson.id)) {
        addIssue(
          "error",
          "duplicate_lesson_id",
          context(language, unit, lesson),
          "El curso repite un ID de lección.",
        );
      }
      lessonIds.add(lesson.id);

      const activities = Array.isArray(lesson.activities) ? lesson.activities : [];
      if (!activities.length) {
        addIssue(
          "error",
          "empty_lesson",
          context(language, unit, lesson),
          "La lección no contiene actividades.",
        );
      }
      activities.forEach((activity, index) => {
        if (activityIds.has(activity.id)) {
          addIssue(
            "error",
            "duplicate_activity_id",
            context(language, unit, lesson, activity),
            "El curso repite un ID de actividad.",
          );
        }
        activityIds.add(activity.id);
        auditActivity(language, unit, lesson, activities, index, manifest, languageRoot);
      });
    }
  }
}

for (const language of supportedLanguages) auditCourse(language);

const errors = issues.filter((issue) => issue.severity === "error");
const warnings = issues.filter((issue) => issue.severity === "warning");
const grouped = issues.reduce((result, issue) => {
  result[issue.code] = (result[issue.code] ?? 0) + 1;
  return result;
}, {});

console.log(JSON.stringify({
  stats,
  summary: {
    errors: errors.length,
    warnings: warnings.length,
    byCode: grouped,
  },
  issues,
}, null, 2));

if (errors.length) process.exitCode = 1;
