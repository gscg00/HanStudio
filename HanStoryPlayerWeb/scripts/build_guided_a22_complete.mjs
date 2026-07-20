#!/usr/bin/env node
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {A22_TARGETS,A22_THEMES,validateA22Content} from '../course-authoring/a22_content.mjs';
import {buildGuidedStage} from '../course-authoring/guided_stage_builder.mjs';

const webRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
buildGuidedStage({
  webRoot,themes:A22_THEMES,targetsByLanguage:A22_TARGETS,validateContent:validateA22Content,
  stageId:'a2-2',stageTag:'A2.2',idTag:'a22',levelLabel:'ETAPA 5 · A2.2',
  levelTitle:'Descripción y resolución',levelDescription:'Opiniones, experiencias, trabajo, tecnología, cultura y resolución de imprevistos.',
  routeLabel:'RUTA GUIADA · FUNDAMENTOS Y A2',previousStageLastUnit:'a2-1-conversation',
  migrationFile:'011_all_languages_a22_complete_catalog.sql',curriculumVersion:2,courseVersion:8,
});
