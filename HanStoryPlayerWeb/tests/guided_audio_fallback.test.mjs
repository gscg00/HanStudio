import test from 'node:test';
import assert from 'node:assert/strict';
import {JapaneseCourseApp} from '../src/japanese_course_app.js';

function player(){
  const app=Object.create(JapaneseCourseApp.prototype),events=[];
  Object.assign(app,{audioManifest:{'Bonjour.':'bonjour.mp3'},playbackVersion:0,
    stopPlayback(){this.playbackVersion++;},showToast(text){events.push(['notice',text]);},
    async playFile(path,rate){events.push(['file',path,rate]);return true;},
    async speakTts(text,rate){events.push(['tts',text,rate]);return true;}});
  return {app,events};
}
test('la grabación disponible tiene prioridad y no dispara TTS',async()=>{
  const {app,events}=player();assert.equal(await app.playKeyAudio('Bonjour.'),true);
  assert.deepEqual(events,[['file','bonjour.mp3',1]]);
});
test('un ejemplo sin archivo conserva el texto explícito para el respaldo',()=>{
  const {app}=player();
  const examples=app.derivedTeachingExamples({audio_examples:[{text:'Au revoir.',audio:'Au revoir.'}]});
  assert.equal(examples.length,1);
  assert.equal(examples[0].audio,'Au revoir.');
  assert.equal(examples[0].slow_audio,'Au revoir.');
});
test('una frase sin archivo se sintetiza completa y respeta lento y repetición',async()=>{
  const {app,events}=player();await app.playKeyAudio('Au revoir.','slow');
  assert.deepEqual(events.filter(e=>e[0]==='tts'),[['tts','Au revoir.',.65]]);
  events.length=0;await app.playKeyAudio('Au revoir.','repeat');
  assert.equal(events.filter(e=>e[0]==='tts').length,3);
  assert.equal(events.filter(e=>e[0]==='notice').length,1);
});
test('si falla el archivo se usa TTS; cancelar no inicia el respaldo',async()=>{
  const {app,events}=player();app.playFile=async()=>false;
  assert.equal(await app.playKeyAudio('Bonjour.'),true);
  assert.ok(events.some(e=>e[0]==='tts'&&e[1]==='Bonjour.'));
  events.length=0;app.playFile=async()=>{app.stopPlayback();return false;};
  assert.equal(await app.playKeyAudio('Bonjour.'),false);assert.deepEqual(events,[]);
});
