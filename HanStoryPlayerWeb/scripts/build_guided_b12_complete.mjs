#!/usr/bin/env node
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {B12_TARGETS,B12_THEMES,validateB12Content} from '../course-authoring/b12_content.mjs';
import {buildGuidedStage} from '../course-authoring/guided_stage_builder.mjs';

const webRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
buildGuidedStage({
  webRoot,themes:B12_THEMES,targetsByLanguage:B12_TARGETS,validateContent:validateB12Content,
  stageId:'b1-2',stageTag:'B1.2',idTag:'b12',levelLabel:'ETAPA 7 · B1.2',
  levelTitle:'Conversación intermedia',
  levelDescription:'Hipótesis, matices, negociación, proyectos, argumentos y conversaciones extensas.',
  routeLabel:'RUTA GUIADA · DE CERO A B1',previousStageLastUnit:'b1-1-register',
  migrationFile:'013_all_languages_b12_complete_catalog.sql',curriculumVersion:2,courseVersion:10,
});
