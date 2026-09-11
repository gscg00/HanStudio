import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const cacheRoot='/Users/saulcervantes/Library/Application Support/manga-lingua/Cache';
const output=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../library/personal_manga/cards.json');
const sources=[
  {language:'French',title:'Choujin X',file:'djQtZXM6Q2hvdWppbiBYIFsxXzNdIC0gS0NDLm1vYmk6NDE5NTU4Nzc2.json',limit:72},
  {language:'French',title:'Ashe',file:'djQtZXM6YXNoZS1mci5jYno6NTk0MDUyNTU.json',limit:48},
  {language:'German',title:'Kleine Katze Chi',file:'djQtZXM6S2xlaW5lIEthdHplIENoaSAwMSAoQ2FybHNlbiAyMDE0KSAtIERlc2Nvbm9jaWRvLm1vYmk6NTk0OTI2Mjg.json',limit:36},
  {language:'German',title:'Fate Rewinder',file:'djQtZXM6RmF0ZSBSZXdpbmRlciAwMSAoQ2FybHNlbiBNYW5nYSwgMjAyNSkgLSBEZXNjb25vY2lkby5tb2JpOjEwNTcxNzUyNA.json',limit:36},
  {language:'German',title:'Young Donald Duck',file:'djQtZXM6THVzdGlnZXMgVGFzY2hlbmJ1Y2ggWW91bmcgQ29taWNzIDAwMSAtIFlvdW5nIERvbmFsZCBEdWNrICgyMDIyKSAoR2VybWFuKSAoZGlnaXRhbC5tb2JpOjg5MzI5ODg5.json',limit:36},
  {language:'German',title:'K/DA',file:'djQtZXM6a2RhLWRlLmNiejo4NzEzMzkxMw.json',limit:48},
  {language:'Korean',title:'놓지 마 과학!',file:'djQtZXM6c2NpZW5jZSAyLmNiejoyMjQ0NDY5NA.json',limit:54},
  {language:'Korean',title:'놓지마 어휘',file:'djQtZXM6dm9jYWJ1bGFyeS5jYno6NDI3MDQ4Nzc.json',limit:54},
  {language:'Korean',title:'장난을 잘 치는 타카기 양',file:'djQtZXM6amFuZ25hbmV1bCBqYWxjaW5ldW4gdGFrYWdpIHlhbmcgWzFfMl0gLSBLQ0MubW9iaTo0MTYzNjQ5NDg.json',limit:54},
  {language:'Korean',title:'Lux',file:'djQtZXM6bHV4LWtvLmNiejo2MzMwODMwMg.json',limit:54}
];

const clean=value=>String(value??'').replace(/\s+/gu,' ').trim();
const normalizeTerm=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/gu,'').toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/u).filter(term=>term.length>=2);
const courseDirectory={French:'French',German:'German',Korean:'Korean'};
const curriculumFor=language=>{
  const directory=courseDirectory[language];
  if(!directory)return{lessonCount:1,firstSeen:new Map()};
  const root=path.resolve(path.dirname(output),'../courses',directory),course=JSON.parse(fs.readFileSync(path.join(root,'course.json'),'utf8')),firstSeen=new Map();
  let lessonCount=0;
  for(const summary of course.units||[]){
    if(!summary.manifest)continue;
    const unit=JSON.parse(fs.readFileSync(path.join(root,summary.manifest),'utf8'));
    for(const lesson of unit.lessons||[]){
      lessonCount++;
      for(const activity of lesson.activities||[]){
        const terms=[...normalizeTerm(activity.target),...normalizeTerm(activity.answer),...(activity.word_breakdown||[]).flatMap(item=>normalizeTerm(item.term||item.text))];
        for(const term of terms)if(!firstSeen.has(term))firstSeen.set(term,lessonCount);
      }
    }
  }
  return{lessonCount,firstSeen};
};
const curricula=Object.fromEntries(Object.keys(courseDirectory).map(language=>[language,curriculumFor(language)]));
const useful=({text,translation,language})=>{
  const source=clean(text),spanish=clean(translation?.translation),words=source.split(/\s+/u).filter(Boolean);
  const phraseLike=language==='Korean'||words.length>=2||/[a-zà-ÿ]/u.test(source);
  return phraseLike&&source.length>=4&&source.length<=150&&spanish.length>=2&&spanish.length<=180&&/[\p{L}\p{N}]/u.test(source);
};
const spread=(items,count)=>{
  if(items.length<=count)return items;
  return [...new Set(Array.from({length:count},(_,index)=>items[Math.round(index*(items.length-1)/(count-1))]))];
};
const readingLevel=({text,breakdown})=>{
  const words=clean(text).split(/\s+/u).filter(Boolean).length;
  const density=(breakdown||[]).length;
  if(words<=3&&text.length<=26)return 1;
  if(words<=7&&text.length<=56&&density<=5)return 2;
  if(words<=14&&text.length<=105)return 3;
  return 4;
};
const unlockAfter=({language,text,breakdown,level})=>{
  const curriculum=curricula[language],terms=[...new Set([...normalizeTerm(text),...(breakdown||[]).flatMap(item=>normalizeTerm(item.term))])],fallback=Math.max(2,Math.ceil((curriculum.lessonCount||1)*Number(level||4)/4));
  if(!terms.length||!terms.every(term=>curriculum.firstSeen.has(term)))return fallback;
  return Math.max(2,...terms.map(term=>curriculum.firstSeen.get(term)));
};
const studyWorthy=({language,text,translation,breakdown,title})=>{
  const source=clean(text),spanish=clean(translation?.translation),terms=normalizeTerm(source),sound=/\b(?:jaj|aaah|aah|uff|glup|gruñ|suspiro|zumb|onomatopeya)\b/ui,normalized=terms.join(''),editorial=/^(?:inhalt|extra|kapitel|episode|tokio\b|chef de guerre|chi.?s sweet home|mein ärgster bester freund)/ui,koreanNoise=/(?:^출처:|^제작|@|\]\s*만|(?:^|\s)ep\d|^정신이의 과학 노트[!.]*$|^잘 치는 타)/u;
  if(!breakdown.length||/[〈《【]/u.test(source)||editorial.test(source)||koreanNoise.test(source)||/^(?:\s*(?:ep\d+|어휘\s*체크|총\s*\d+부작))/ui.test(source)||normalized===normalizeTerm(title).join(''))return false;
  if(sound.test(spanish)||/(.)\1{3,}/u.test(source))return false;
  if(new Set(terms).size===1)return false;
  if(language!=='Korean'&&terms.length<2)return false;
  return terms.length>0;
};

const cards=[];
for(const source of sources){
  const payload=JSON.parse(fs.readFileSync(path.join(cacheRoot,source.file),'utf8'));
  const candidates=[];
  for(const [page,entries] of Object.entries(payload.dialogues||{}))for(const entry of entries||[]){
    const text=clean(entry.text),translation=payload.translations?.[entry.text],breakdown=(translation?.breakdown||[]).map(item=>({term:clean(item.term),meaning:clean(item.meaning),note:clean(item.note)})).filter(item=>item.term&&item.meaning);
    if(Number(page)>1&&useful({text,translation,language:source.language})&&studyWorthy({language:source.language,text,translation,breakdown,title:source.title}))candidates.push({text,translation,page:Number(page)||0,rank:normalizeTerm(text).length>=3?0:1});
  }
  for(const entry of candidates.sort((a,b)=>a.rank-b.rank||a.page-b.page).slice(0,source.limit)){
    const breakdown=(entry.translation.breakdown||[]).map(item=>({term:clean(item.term),meaning:clean(item.meaning),note:clean(item.note)})).filter(item=>item.term&&item.meaning);
    cards.push({
    id:`${source.language.toLowerCase()}-${source.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/gu,'').replace(/[^a-z0-9]+/gu,'-')}-${entry.page}-${cards.length+1}`,
    language:source.language,
    source:source.title,
    page:entry.page,
    text:entry.text,
    translation:clean(entry.translation.translation),
    note:clean(entry.translation.note),
    breakdown,
    level:readingLevel({text:entry.text,breakdown}),
    unlockAfter:unlockAfter({language:source.language,text:entry.text,breakdown,level:readingLevel({text:entry.text,breakdown})}),
    priority:clean(entry.text).split(/\s+/u).filter(Boolean).length>=2?0:1
  });
  }
}
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify({updatedAt:new Date().toISOString(),scope:'Material personal exportado desde la caché local de Manga Lingua para práctica privada.',cards},null,2)+'\n');
console.log(`Exportadas ${cards.length} tarjetas personales a ${output}`);
