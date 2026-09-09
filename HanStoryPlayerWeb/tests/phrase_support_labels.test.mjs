import test from 'node:test';
import assert from 'node:assert/strict';
import {JapaneseCourseApp} from '../src/japanese_course_app.js';
const app=Object.assign(Object.create(JapaneseCourseApp.prototype),{definition:{htmlLang:'fr'}});
test('pregunta conceptual recupera solo ejemplos previos de su propia grafía',()=>{
 const card={type:'teach_concept',target:'gn',audio_examples:[{text:'bagno',audio:'bagno'}]};
 const question={type:'select_translation',target:'gn'};
 app.lesson={activities:[card,question]};app.activityIndex=1;
 assert.match(app.questionAudioControls(question),/Escuchar bagno/);
 assert.doesNotMatch(app.questionAudioControls(question),/data-jp-audio-source="prompt"/);
 assert.equal(app.questionAudioControls({...question,target:'sc'}),'');
 app.activityIndex=0;
 assert.equal(app.questionAudioControls(question),'');
 assert.match(app.questionAudioControls({...question,audio:'gn'}),/data-jp-audio-source="prompt"/);
});
test('pregunta conceptual conserva el audio explícito de su enseñanza previa',()=>{
 const card={type:'teach_concept',target:'ひと',audio:'ひと',slow_audio:'ひと'};
 const question={type:'select_translation',target:'ひと'};
 app.lesson={activities:[card,question]};app.activityIndex=1;app.audioManifest={ひと:'audio.mp3'};
 const html=app.questionAudioControls(question);
 assert.match(html,/data-jp-audio-key="ひと"/);
  assert.match(html,/▶ Escuchar ひと/);
});
test('una pregunta conceptual no duplica una serie completa de tarjetas de audio',()=>{
 const card={type:'teach_concept',target:'あ い う え お',audio_examples:[
  {text:'あ',audio:'あ'},{text:'い',audio:'い'},{text:'う',audio:'う'},
  {text:'え',audio:'え'},{text:'お',audio:'お'},
 ]};
 const question={type:'select_translation',target:'あ い う え お'};
 app.lesson={activities:[card,question]};app.activityIndex=1;
 assert.equal(app.questionAudioControls(question),'');
});
test('la escucha con botón central no repite el control normal debajo',()=>{
 const html=app.questionAudioControls({type:'listening_choice',prompt:'¿Qué tono acabas de escuchar?',audio:'mā'});
 assert.doesNotMatch(html,/▶ Escuchar/);
 assert.match(html,/data-jp-audio="slow"/);
 assert.match(html,/data-jp-audio="repeat"/);
});
for(const compact of [false,true]){
  test(`nota sin desglose se identifica como uso y contexto (compact=${compact})`,()=>{
    const html=app.renderPhraseSupport({usage_note:'El referente es femenino.'},{compact});
    assert.match(html,/uso y contexto/i);
    assert.doesNotMatch(html,/palabra por palabra|data-jp-word-speak/i);
    assert.ok(html.includes('El referente es femenino.'));
  });
  test(`desglose conserva etiqueta y TTS (compact=${compact})`,()=>{
    const html=app.renderPhraseSupport({word_breakdown:[{text:'bonjour',meaning:'hola'}]},{compact});
    assert.match(html,/palabra por palabra/i);
    assert.ok(html.includes('data-jp-word-speak="bonjour"'));
  });
}
