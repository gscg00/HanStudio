#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, '..');
const root = path.resolve(web, '..');
const cachePath = path.join(web, 'course-authoring', 'generated_phrase_support.json');
const args = process.argv.slice(2);
const flag = name => args.includes(`--${name}`);
const option = (name, fallback = '') => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const apply = flag('apply');
const languageFilter = option('language');
const limit = Math.max(1, Number(option('limit', '40')) || 40);
const batchSize = Math.min(12, Math.max(1, Number(option('batch-size', '8')) || 8));
const model = option('model', process.env.OPENAI_MODEL || 'gpt-5-mini');
let cacheNormalized = false;
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const keyFor = (language, target, translation) =>
  [language, clean(target), clean(translation)].join('|').toLocaleLowerCase();

function loadDotEnv() {
  const file = path.join(root, '.env');
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function walk(value, visit) {
  if (Array.isArray(value)) return value.forEach(item => walk(item, visit));
  if (!value || typeof value !== 'object') return;
  visit(value);
  Object.values(value).forEach(item => walk(item, visit));
}

function isPhrase(activity) {
  if (activity.type !== 'teach_concept') return false;
  const target = clean(activity.target);
  const translation = clean(activity.meaning || activity.translation);
  if (!target || !translation || target === translation) return false;
  if ((activity.word_breakdown || activity.wordBreakdown || []).length) return false;
  if (activity.teaching_kind === 'rule') return false;
  if (/^[\p{L}\p{M}]{1,2}$/u.test(target)) return false;
  if (/^[\p{L}\p{M}]\s*[+→=]\s*/u.test(target)) return false;
  return /\s/u.test(target) || /[\u0600-\u06ff\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/u.test(target);
}

function readCache() {
  if (!fs.existsSync(cachePath)) {
    return { schema_version: 1, generated_at: null, records: {} };
  }
  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  cache.records ||= {};
  for (const record of Object.values(cache.records)) {
    if (record.file && path.isAbsolute(record.file)) {
      record.file = path.relative(web, record.file);
      cacheNormalized = true;
    }
  }
  return cache;
}

function collectCandidates(cache) {
  const courseRoot = path.join(web, 'library', 'courses');
  const results = [];
  for (const directory of fs.readdirSync(courseRoot, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
    const language = directory.name;
    if (languageFilter && language.toLocaleLowerCase() !== languageFilter.toLocaleLowerCase()) continue;
    const unitRoot = path.join(courseRoot, language, 'units');
    if (!fs.existsSync(unitRoot)) continue;
    for (const filename of fs.readdirSync(unitRoot).filter(name => name.endsWith('.json'))) {
      const file = path.join(unitRoot, filename);
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      walk(data, activity => {
        if (!isPhrase(activity)) return;
        const target = clean(activity.target);
        const translation = clean(activity.meaning || activity.translation);
        const key = keyFor(language, target, translation);
        if (cache.records[key] || results.some(item => item.key === key)) return;
        results.push({ key, id: `p${results.length + 1}`, language, target, translation, file });
      });
    }
  }
  return results.slice(0, limit);
}

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'word_breakdown', 'usage_note', 'context_note'],
        properties: {
          id: { type: 'string' },
          word_breakdown: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['text', 'meaning', 'note'],
              properties: {
                text: { type: 'string' },
                meaning: { type: 'string' },
                note: { type: 'string' }
              }
            }
          },
          usage_note: { type: 'string' },
          context_note: { type: 'string' }
        }
      }
    }
  }
};

function outputText(response) {
  if (response.output_text) return response.output_text;
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) return content.text;
    }
  }
  throw new Error('OpenAI no devolvió texto estructurado.');
}

async function enrichBatch(batch) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: 'Eres un lingüista y diseñador de cursos para hispanohablantes. Divide cada frase en unidades pedagógicas reales del idioma objetivo. Escribe significados naturales en español. No uses romanización. Conserva partículas, contracciones y expresiones fijas; no inventes ni omitas texto. Las notas deben ser breves y solo aclarar función o uso.'
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify(batch.map(({ id, language, target, translation }) => ({ id, language, target, translation })))
            }
          ]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'guided_phrase_support',
          strict: true,
          schema
        }
      }
    })
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI respondió ${response.status}: ${body.slice(0, 500)}`);
  }
  return JSON.parse(outputText(await response.json())).items;
}

function validate(source, generated) {
  const byId = new Map(generated.map(item => [item.id, item]));
  return source.map(item => {
    const value = byId.get(item.id);
    if (!value?.word_breakdown?.length) throw new Error(`Falta el desglose de ${item.id}.`);
    for (const part of value.word_breakdown) {
      if (!clean(part.text) || !clean(part.meaning)) throw new Error(`Desglose incompleto en ${item.id}.`);
    }
    return {
      source: item,
      value: {
        language: item.language,
        target: item.target,
        translation: item.translation,
        word_breakdown: value.word_breakdown.map(part => ({
          text: clean(part.text),
          meaning: clean(part.meaning),
          note: clean(part.note)
        })),
        usage_note: clean(value.usage_note),
        context_note: clean(value.context_note)
      }
    };
  });
}

function applyCacheToUnits(cache) {
  const files = new Set(Object.values(cache.records).map(record => record.file).filter(Boolean));
  let changed = 0;
  for (const storedFile of files) {
    const file = path.isAbsolute(storedFile) ? storedFile : path.join(web, storedFile);
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    let dirty = false;
    const language = path.basename(path.dirname(path.dirname(file)));
    walk(data, activity => {
      if (!isPhrase(activity)) return;
      const translation = clean(activity.meaning || activity.translation);
      const record = cache.records[keyFor(language, activity.target, translation)];
      if (!record?.word_breakdown?.length) return;
      activity.word_breakdown = record.word_breakdown;
      if (!activity.usage_note && record.usage_note) activity.usage_note = record.usage_note;
      if (!activity.context_note && record.context_note) activity.context_note = record.context_note;
      dirty = true;
    });
    if (dirty) {
      fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
      changed++;
    }
  }
  return changed;
}

loadDotEnv();
const cache = readCache();
const candidates = collectCandidates(cache);
console.log(`${apply ? 'Aplicar' : 'Simular'}: ${candidates.length} frases nuevas; modelo ${model}.`);
for (const [language, count] of Object.entries(candidates.reduce((acc, item) => {
  acc[item.language] = (acc[item.language] || 0) + 1;
  return acc;
}, {}))) console.log(`- ${language}: ${count}`);

if (apply && cacheNormalized) {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
}
if (!apply || !candidates.length) process.exit(0);
if (!process.env.OPENAI_API_KEY) throw new Error('Falta OPENAI_API_KEY en el entorno o .env.');
fs.mkdirSync(path.dirname(cachePath), { recursive: true });
for (let start = 0; start < candidates.length; start += batchSize) {
  const batch = candidates.slice(start, start + batchSize);
  const rows = validate(batch, await enrichBatch(batch));
  for (const { source, value } of rows) {
    cache.records[source.key] = { ...value, file: path.relative(web, source.file) };
  }
  cache.generated_at = new Date().toISOString();
  fs.writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
  console.log(`Guardadas ${Math.min(start + batch.length, candidates.length)}/${candidates.length}.`);
}
console.log(`Archivos de unidad actualizados: ${applyCacheToUnits(cache)}.`);
