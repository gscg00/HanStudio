import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source=fs.readFileSync(new URL('../src/japanese_course_app.js',import.meta.url),'utf8');

test('la explicación no repite la respuesta aceptada al acertar',()=>{
  assert.match(source,/\$\{!entry\.evaluation\?\.correct\?`<p><strong>Modelo de esta actividad:/);
  assert.match(source,/detailsAvailable\|\|=!entry\.evaluation\?\.correct/);
  assert.match(source,/this\.feedback\.correct\?'Ver explicación':'Ver explicación y modelo'/);
  assert.match(source,/taskUsesAudio=isAudioRecognitionActivity\(entry\.activity\)/);
});
