import test from 'node:test';
import assert from 'node:assert/strict';
import {phraseBreakdown} from '../src/guided_phrase_support.js';

test('un desglose sin traducción no inventa una glosa false',()=>{
  assert.deepEqual(phraseBreakdown({word_breakdown:['bonjour',null,false,4,{text:'hola'},{meaning:'saludo'}]}),[]);
});

test('conserva traducciones y lecturas contextuales declaradas',()=>{
  assert.deepEqual(phraseBreakdown({wordBreakdown:[
    {word:'は',translation:'marca el tema',speechText:'わ'},
    {text:'名前',meaning:'nombre',note:'sustantivo'},
  ]}),[
    {text:'は',meaning:'marca el tema',note:'',speech_text:'わ'},
    {text:'名前',meaning:'nombre',note:'sustantivo'},
  ]);
});
