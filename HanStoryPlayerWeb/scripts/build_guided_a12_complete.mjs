#!/usr/bin/env node
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {A12_TARGETS,A12_THEMES,validateA12Content} from '../course-authoring/a12_content.mjs';
import {buildGuidedStage} from '../course-authoring/guided_stage_builder.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const webRoot=path.resolve(here,'..');

buildGuidedStage({
  webRoot,
  themes:A12_THEMES,
  targetsByLanguage:A12_TARGETS,
  validateContent:validateA12Content,
  stageId:'a1-2',
  stageTag:'A1.2',
  idTag:'a12',
  levelLabel:'ETAPA 3 · A1.2',
  levelTitle:'Vida diaria y autonomía',
  levelDescription:'Compras, citas, transporte, salud, clima y planes sociales en situaciones reales.',
  routeLabel:'RUTA GUIADA · FUNDAMENTOS, A1.1 Y A1.2',
  previousStageLastUnit:'a1-1-places',
  migrationFile:'009_all_languages_a12_complete_catalog.sql',
  curriculumVersion:2,
  courseVersion:6,
});
