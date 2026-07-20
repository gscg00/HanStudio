#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {GUIDED_COURSES} from '../src/guided_course_config.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const web=path.resolve(here,'..');
const prototypeIds=new Set([
  'a1-2-daily-life','a2-1-plans-and-time','a2-2-description-and-comparison',
  'b1-1-narration-and-reasons','b1-2-independent-reading',
]);
for(const[language,definition]of Object.entries(GUIDED_COURSES)){
  const coursePath=path.join(web,'library','courses',definition.directory,'course.json');
  const course=JSON.parse(fs.readFileSync(coursePath,'utf8'));
  course.version=Math.max(4,Number(course.version||1));
  course.routeLabel='RUTA GUIADA · FUNDAMENTOS Y PILOTO A1.1';
  course.levels=(course.levels||[]).filter(level=>!['a1-2','a2-1','a2-2','b1-1','b1-2'].includes(level.id));
  const a11=course.levels.find(level=>level.id==='a1-1');
  if(a11){
    a11.label='PILOTO · A1.1';
    a11.title='Primeras conversaciones · piloto';
    a11.description='Unidad piloto disponible mientras se redactan las etapas completas por idioma.';
  }
  course.units=(course.units||[]).filter(unit=>!prototypeIds.has(unit.id));
  fs.writeFileSync(coursePath,JSON.stringify(course,null,2)+'\n');
  console.log(`${language}: prototipos posteriores retirados del mapa`);
}

