#!/usr/bin/env node
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {B11_TARGETS,B11_THEMES,validateB11Content} from '../course-authoring/b11_content.mjs';
import {buildGuidedStage} from '../course-authoring/guided_stage_builder.mjs';

const webRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
buildGuidedStage({
  webRoot,themes:B11_THEMES,targetsByLanguage:B11_TARGETS,validateContent:validateB11Content,
  stageId:'b1-1',stageTag:'B1.1',idTag:'b11',levelLabel:'ETAPA 6 · B1.1',
  levelTitle:'Narración y razones',levelDescription:'Narraciones conectadas, causas, medios, emociones, sociedad y registro.',
  routeLabel:'RUTA GUIADA · FUNDAMENTOS A B1',previousStageLastUnit:'a2-2-problemSolving',
  migrationFile:'012_all_languages_b11_complete_catalog.sql',curriculumVersion:2,courseVersion:9,
});
