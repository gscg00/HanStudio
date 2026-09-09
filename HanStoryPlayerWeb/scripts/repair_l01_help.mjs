import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../library/',import.meta.url),book=new URL('books/L01/',root);
const read=url=>JSON.parse(fs.readFileSync(url,'utf8'));
const write=(url,data)=>fs.writeFileSync(url,JSON.stringify(data,null,2)+'\n');
const hash=data=>createHash('sha256').update(data).digest('hex');
const course=read(new URL('courses/Korean/audio_manifest.json',root)),text='도와주세요.',translation='Ayúdeme, por favor.';
const source=new URL(`courses/Korean/${course.items[text]}`,root),bytes=fs.readFileSync(source),audio='audio/1092-qa-help-ko.mp3',destination=new URL(audio,book);
if(fs.existsSync(destination)&&hash(fs.readFileSync(destination))!==hash(bytes))throw Error('El destino ya contiene una grabación diferente.');
if(!fs.existsSync(destination))fs.copyFileSync(source,destination);
const file=new URL('hanstory_manifest.json',book),manifest=read(file),track=manifest.tracks.find(t=>t.id==='1092');
if(!track)throw Error('No existe L01/1092');
track.text=text;track.translation=translation;track.audio_path=audio;
track.audio_provenance={source:'courses/Korean/'+course.items[text],provider:course.provider,voice_id:course.item_voices?.[text],review_status:'listening_and_character_voice_review_pending',note:'Reutiliza el modelo del curso; no se ha verificado que coincida con la voz narrativa de Aru.'};
manifest.checksums[audio]=hash(bytes);write(file,manifest);
for(const name of ['ko_requests','ko_shopping']){
 const topicFile=new URL(`topics/Korean/${name}.json`,root),topic=read(topicFile);
 const visit=value=>{if(!value||typeof value!=='object')return;if(value.book_code==='L01'&&value.track_id==='1092'){value.text=text;value.translation=translation;value.audio_path='books/L01/'+audio;}for(const child of Object.values(value))visit(child);};
 visit(topic);write(topicFile,topic);
}
const explanationFile=new URL('explanations/track_explanations.json',book),explanations=read(explanationFile);
const items=explanations.items||explanations.tracks||explanations,entry=items['1092'];
if(!entry)throw Error('No se encontró la explicación 1092');
entry.text=text;entry.translation=translation;
entry.explanation_es='La frase es una petición cortés de ayuda. Puede usarse para pedir asistencia; el contexto y la entonación determinan si se trata de una solicitud tranquila o una llamada urgente.';
entry.breakdown=[{text:'도와',romanization:'',meaning_es:'forma de 돕다 (ayudar) al combinarse con -아/어',function_es:'Forma irregular de 돕다.'},{text:'주세요',romanization:'',meaning_es:'por favor, haga… para mí',function_es:'Expresa una petición cortés con 주다.'}];
entry.source_hash=hash(['1092',text,translation,manifest.target_language,manifest.explanation_language].join('\x1f'));write(explanationFile,explanations);
for(const name of ['book.html','Audios_Tecnico.txt','Audio_Master.csv','Podcast_Master.csv']){
 const url=new URL(name,book),raw=fs.readFileSync(url,'utf8');
 let next=raw.replaceAll('도와주세요. Help.','도와주세요.');
 if(name.endsWith('.csv'))next=next.replace(/^(1092,.*|PODB010214,.*)\r$/gm,'$1');
 fs.writeFileSync(url,next);
 if(Object.hasOwn(manifest.checksums,name))manifest.checksums[name]=hash(fs.readFileSync(url));
}
if(Object.hasOwn(manifest.checksums,'explanations/track_explanations.json'))manifest.checksums['explanations/track_explanations.json']=hash(fs.readFileSync(explanationFile));
write(file,manifest);
console.log('L01/1092 y dos temas actualizados; archivo original conservado. Voz narrativa y escucha siguen pendientes.');
