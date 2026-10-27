import test from 'node:test';
import assert from 'node:assert/strict';
import {languageSummaries,featuredSummary,bestStreak} from '../src/home_summary.js';

const courses={Korean:{slug:'korean'},French:{slug:'french'},German:{slug:'german'}};
const now=new Date(2026,9,27,18);

test('resume cada idioma a partir del progreso y la clase del día guardados',()=>{
  const items=[
    {id:'guided:korean:v1',completedLessons:['a','b','c'],streak:4,lastStudyDate:'2026-10-27',updatedAt:'2026-10-27T10:00'},
    {id:'daily:korean:v1',totalLessons:30,updatedAt:'2026-10-27T10:00',classes:[{number:7,title:'Comida y bebida',phasesDone:['review','listen','learn']}]},
    {id:'guided:french:v1',completedLessons:['x'],streak:9,lastStudyDate:'2026-10-20',updatedAt:'2026-10-20T10:00'},
    {id:'daily:french:v1',updatedAt:'2026-10-27T09:00',classes:[{number:2,completedDate:'2026-10-27',phasesDone:[]}]},
  ];
  const [korean,french,german]=languageSummaries(items,courses,now);
  assert.deepEqual([korean.classNumber,korean.title,korean.phasesDone,korean.inProgress,korean.completed,korean.total,korean.streak],[7,'Comida y bebida',3,true,3,30,4]);
  assert.equal(french.doneToday,true);
  assert.equal(french.phasesDone,5);
  // Una racha de hace una semana ya no cuenta.
  assert.equal(french.streak,0);
  assert.equal(german.started,false);
  assert.equal(bestStreak([korean,french,german]),4);
});

test('destaca la clase a medias antes que una ya terminada hoy',()=>{
  const summaries=[
    {language:'French',started:true,inProgress:false,doneToday:true,lastDate:'2026-10-27T12:00'},
    {language:'Korean',started:true,inProgress:true,doneToday:false,lastDate:'2026-10-26T12:00'},
    {language:'German',started:false,lastDate:''},
  ];
  assert.equal(featuredSummary(summaries).language,'Korean');
  assert.equal(featuredSummary([summaries[0]]).language,'French');
  assert.equal(featuredSummary([summaries[2]]),null);
});
