import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLearningIndex,learningFeedback} from '../src/guided_learning_feedback.js';
const index=activities=>buildLearningIndex({lessons:[{id:'lesson',title:'Saludos',activities}]});
const hello={type:'teach_word',target:'Hello',meaning:'Hola',usage_note:'Saludo al encontrarse.',audio:'Hello'};
const bye={type:'teach_word',target:'Goodbye',meaning:'Adiós'};
test('no repite la explicación de la respuesta cuando ya aparece en la regla vinculada',()=>{
 const card={...hello,id:'hello-teach',explanation:'Se usa al saludar.'};
 const question={id:'hello-listen',type:'listening_choice',answer:'Hello',teaching_refs:['hello-teach']};
 const help=learningFeedback(question,'Goodbye',index([card,question]));
 assert.ok(help.references[0].notes.includes('Se usa al saludar.'));
 assert.deepEqual(help.notes,[]);
 assert.equal(help.hasExplanation,true);
});
test('conserva los ejemplos de pronunciación propios y de reglas previas enlazadas',()=>{
 const example={text:'bagno',audio:'bagno',label:'GN',meaning:'baño'};
 const card={id:'gn-teach',type:'teach_concept',target:'gn',audio_examples:[example]};
 const question={id:'gn-question',type:'select_translation',target:'gn',prompt:'¿Cómo suena GN?',answer:'Como ñ',teaching_refs:['gn-teach']};
 const help=learningFeedback(question,'Como g + n',index([card,question]));
 assert.equal(help.audioExamples[0].audio,'bagno');
 assert.equal(help.references[0].audioExamples[0].text,'bagno');
 assert.equal(help.hasExplanation,true);
 const future=learningFeedback(question,'x',index([question,card]));
 assert.deepEqual(future.references,[]);
});
test('recupera un desglose sin campo meaning solo si la equivalencia es inequívoca',()=>{
 const card={type:'teach_concept',target:'は',word_breakdown:[{text:'は',meaning:'tema',speech_text:'わ'}]};
 const question={type:'select_translation',prompt:'¿Qué significa?',target:'は',answer:'tema'};
 const help=learningFeedback(question,'tema',index([card,question]));
 assert.equal(help.words[0].speech_text,'わ');
 const ambiguous=learningFeedback(question,'tema',index([card,question,{...question,answer:'otra acepción'}]));
 assert.deepEqual(ambiguous.words,[]);
});
test('recupera explicación y audio declarados sin repetir la traducción',()=>{
 const help=learningFeedback({type:'select_translation',prompt:'¿Qué significa esta palabra?',target:'Hello',answer:'Hola',explanation:'Hola'},'Adiós',index([hello,bye]));
 assert.deepEqual(help.notes,['Saludo al encontrarse.']);
 assert.deepEqual(help.contrast,{form:'Goodbye',meaning:'Adiós',direction:'meaning'});
 assert.equal(help.audio,'Hello');assert.equal(help.sourceLessonId,'lesson');
});
test('contrasta la forma seleccionada en escucha sin invertirla',()=>{
 const help=learningFeedback({type:'listening_choice',answer:'Hello'},'Goodbye',index([hello,bye]));
 assert.deepEqual(help.contrast,{form:'Goodbye',meaning:'Adiós',direction:'form'});
});
test('no inventa equivalencias para distractores desconocidos',()=>{
 const help=learningFeedback({type:'select_translation',prompt:'¿Qué significa?',target:'Hello',answer:'Hola'},'Buenos días',index([hello]));
 assert.equal(help.contrast,null);
});
test('no recupera una explicación arbitraria para formas polisémicas',()=>{
 const sources=index([{...hello,target:'bank',meaning:'banco',usage_note:'Finanzas'},{...hello,target:'bank',meaning:'orilla',usage_note:'Río'}]);
 const help=learningFeedback({type:'dictation',answer:'bank'},'bank',sources);
 assert.equal(help.meaning,'');assert.deepEqual(help.notes,[]);assert.equal(help.audio,'');
 const specific=learningFeedback({type:'select_translation',prompt:'¿Qué significa?',target:'bank',answer:'orilla'},'banco',sources);
 assert.deepEqual(specific.notes,['Río']);
});
test('conserva la explicación propia si no existe fuente en la unidad',()=>{
 const help=learningFeedback({type:'open_question',answer:'Something',usage_note:'Nota del ejercicio.'},'x',index([]));
 assert.deepEqual(help.notes,['Nota del ejercicio.']);assert.equal(help.hasExplanation,true);
});
