#!/usr/bin/env node
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {A21_TARGETS,A21_THEMES,validateA21Content} from '../course-authoring/a21_content.mjs';
import {buildGuidedStage} from '../course-authoring/guided_stage_builder.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const webRoot=path.resolve(here,'..');

buildGuidedStage({
  webRoot,themes:A21_THEMES,targetsByLanguage:A21_TARGETS,validateContent:validateA21Content,
  stageId:'a2-1',stageTag:'A2.1',idTag:'a21',
  levelLabel:'ETAPA 4 · A2.1',levelTitle:'Planes, tiempo y decisiones',
  levelDescription:'Pasado, futuro, comparación, modalidad, servicios y conversaciones conectadas.',
  routeLabel:'RUTA GUIADA · FUNDAMENTOS, A1 Y A2.1',previousStageLastUnit:'a1-2-social',
  migrationFile:'010_all_languages_a21_complete_catalog.sql',curriculumVersion:2,courseVersion:7,
});
