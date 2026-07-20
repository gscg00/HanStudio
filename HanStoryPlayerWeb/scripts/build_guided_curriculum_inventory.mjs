#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {CONTENT_CONTRACT,LANGUAGES,LANGUAGE_FOCUS,STAGES,validateCurriculumSpec} from '../course-authoring/guided_curriculum_spec.mjs';

validateCurriculumSpec();
const here=path.dirname(fileURLToPath(import.meta.url));
const web=path.resolve(here,'..');
const authoring=path.join(web,'course-authoring');
const unitsPerLanguage=STAGES.reduce((total,stage)=>total+stage.units.length,0);
const lessonsPerLanguage=unitsPerLanguage*CONTENT_CONTRACT.lessonsPerUnit;
const promptsPerLanguage=unitsPerLanguage*CONTENT_CONTRACT.audioPromptsPerUnit;
const minimumNewPerLanguage=unitsPerLanguage*CONTENT_CONTRACT.minimumNewAudioPromptsPerUnit;
const inventory={
  schema_version:1,
  status:'AUTHORING_APPROVED_FOR_STAGED_EXTERNAL_GENERATION',
  generated_at:new Date().toISOString(),
  contract:CONTENT_CONTRACT,
  totals:{
    languages:LANGUAGES.length,
    stagesPerLanguage:STAGES.length,
    unitsPerLanguage,
    lessonsPerLanguage,
    audioPromptsPerLanguage:promptsPerLanguage,
    minimumNewAudioPromptsPerLanguage:minimumNewPerLanguage,
    totalUnits:unitsPerLanguage*LANGUAGES.length,
    totalLessons:lessonsPerLanguage*LANGUAGES.length,
    totalAudioPrompts:promptsPerLanguage*LANGUAGES.length,
    minimumTotalNewAudioPrompts:minimumNewPerLanguage*LANGUAGES.length,
    candidateFilesIfTwoPerPrompt:promptsPerLanguage*LANGUAGES.length*2,
  },
  languages:Object.fromEntries(LANGUAGES.map(language=>[language,{
    stages:STAGES.map(stage=>({
      id:stage.id,label:stage.label,title:stage.title,objective:stage.objective,
      grammarFocus:LANGUAGE_FOCUS[language][stage.id],
      units:stage.units.map(([id,title,objective],index)=>({
        id:`${stage.id}-${id}`,title,objective,grammarFocus:LANGUAGE_FOCUS[language][stage.id][index],
        lessons:CONTENT_CONTRACT.lessonsPerUnit,newContent:{
          words:CONTENT_CONTRACT.newWordsPerUnit,
          expressions:CONTENT_CONTRACT.newExpressionsPerUnit,
          sentences:CONTENT_CONTRACT.newSentencesPerUnit,
          audioPrompts:CONTENT_CONTRACT.audioPromptsPerUnit,
          minimumNewAudioPrompts:CONTENT_CONTRACT.minimumNewAudioPromptsPerUnit,
        },
      })),
    })),
  }])),
};
fs.writeFileSync(path.join(authoring,'guided_curriculum_inventory.json'),JSON.stringify(inventory,null,2)+'\n');
const lines=[
  '# Inventario de reconstrucción de cursos guiados','',
  '> Estado: autoría aprobada para generación externa por etapas. Cada lote se audita antes de enviarse a ElevenLabs.','',
  `- Idiomas: ${inventory.totals.languages}`,
  `- Etapas por idioma: ${inventory.totals.stagesPerLanguage}`,
  `- Unidades por idioma: ${inventory.totals.unitsPerLanguage}`,
  `- Lecciones nuevas por idioma: ${inventory.totals.lessonsPerLanguage}`,
  `- Prácticas de audio por idioma: ${inventory.totals.audioPromptsPerLanguage}`,
  `- Mínimo de audios realmente nuevos por idioma: ${inventory.totals.minimumNewAudioPromptsPerLanguage}`,
  `- Total: ${inventory.totals.totalUnits} unidades · ${inventory.totals.totalLessons} lecciones · ${inventory.totals.totalAudioPrompts} prácticas de audio`,
  `- Si se conservan dos candidatos por clip: ${inventory.totals.candidateFilesIfTwoPerPrompt} archivos de audio generados`,
  '',
  '## Contrato de cada unidad','',
  `Cada unidad contiene ${CONTENT_CONTRACT.lessonsPerUnit} lecciones: ${CONTENT_CONTRACT.teachingLessonsPerUnit} de enseñanza, ${CONTENT_CONTRACT.reviewsPerUnit} repasos y ${CONTENT_CONTRACT.testsPerUnit} prueba.`,
  `Presenta ${CONTENT_CONTRACT.audioPromptsPerUnit} prácticas de audio y al menos ${CONTENT_CONTRACT.minimumNewAudioPromptsPerUnit} audios realmente nuevos; el resto puede recuperar contenido anterior sin contarlo dos veces.`,
  '',
  ...STAGES.flatMap(stage=>[
    `## ${stage.label} — ${stage.title}`,'',stage.objective,'',
    ...stage.units.map(([id,title,objective],index)=>`${index+1}. **${title}** (${id}) — ${objective}`),'',
  ]),
];
fs.writeFileSync(path.join(authoring,'GUIDED_CURRICULUM_REPORT.md'),lines.join('\n')+'\n');
console.log(`${inventory.totals.totalUnits} unidades · ${inventory.totals.totalLessons} lecciones · ${inventory.totals.totalAudioPrompts} prácticas de audio`);
