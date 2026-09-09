import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sequenceChineseToneLesson} from '../scripts/chinese_tone_sequence.mjs';

const unit=JSON.parse(fs.readFileSync(new URL('../library/courses/Chinese/units/reading-foundations.json',import.meta.url)));
const lesson=unit.lessons.find(item=>item.id==='chinese-reading-00-02');

test('los cuatro tonos se presentan antes de la primera discriminación auditiva',()=>{
 const firstQuestion=lesson.activities.findIndex(activity=>activity.gradable!==false&&activity.type==='listening_choice');
 assert.ok(firstQuestion>0);
 const cards=lesson.activities.slice(0,firstQuestion).filter(activity=>activity.type==='teach_concept');
 assert.deepEqual(cards.map(activity=>activity.target),['mā','má','mǎ','mà']);
 assert.equal(sequenceChineseToneLesson(lesson),lesson);
});
