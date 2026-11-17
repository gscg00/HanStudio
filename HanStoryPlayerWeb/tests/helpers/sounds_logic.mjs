// sounds_ui.js depende del DOM a través del motor del curso; aquí se reproduce solo su
// lógica pura para probarla. Debe mantenerse igual que soundLessons() de sounds_ui.js.
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../../src/sounds_ui.js',import.meta.url),'utf8');
const body=source.slice(source.indexOf('const isPractice='),source.indexOf('export const soundsPending'));
const soundsPendingSource=source.slice(source.indexOf('export const soundsPending'),source.indexOf('\n',source.indexOf('export const soundsPending')));
const READING_UNITS=new Set(['hangul-foundations','reading-foundations','reading','hiragana-01','katakana','rhythm']);
const module=new Function('READING_UNITS',`${body.replace('export function soundLessons','function soundLessons')}\n${soundsPendingSource.replace('export const','const')}\nreturn{soundLessons,soundsPending};`)(READING_UNITS);
export const{soundLessons,soundsPending}=module;
