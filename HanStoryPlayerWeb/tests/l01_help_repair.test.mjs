import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../library/',import.meta.url),read=url=>JSON.parse(fs.readFileSync(url,'utf8'));
test('L01 y temas comparten texto, traducción y grabación corregidos',()=>{
 const book=new URL('books/L01/',root),manifest=read(new URL('hanstory_manifest.json',book)),track=manifest.tracks.find(t=>t.id==='1092');
 assert.equal(track.text,'도와주세요.');assert.equal(track.translation,'Ayúdeme, por favor.');
 const bytes=fs.readFileSync(new URL(track.audio_path,book));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.checksums[track.audio_path]);
 assert.ok(fs.existsSync(new URL('audio/1092 - Aru - 도와주세요. Help.mp3',book)),'Se conserva el original recuperable.');
 assert.match(track.audio_provenance.review_status,/pending/);
 for(const name of ['ko_requests','ko_shopping']){
  const topic=read(new URL(`topics/Korean/${name}.json`,root)),item=topic.items.find(t=>t.book_code==='L01'&&t.track_id==='1092');
  assert.equal(item.text,track.text);assert.equal(item.translation,track.translation);assert.equal(item.audio_path,'books/L01/'+track.audio_path);
 }
 const explanations=read(new URL('explanations/track_explanations.json',book)),entry=explanations.items['1092'];
 assert.equal(entry.text,track.text);assert.ok(!entry.explanation_es.includes('Help'));
 const digest=createHash('sha256').update(['1092',track.text,track.translation,manifest.target_language,manifest.explanation_language].join('\x1f')).digest('hex');
 assert.equal(entry.source_hash,digest);
});
