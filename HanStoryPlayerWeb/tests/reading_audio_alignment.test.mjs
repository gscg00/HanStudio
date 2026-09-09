import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

test('las asociaciones de audio contextual revisadas no ocultan nuevas alertas',()=>{
 execFileSync(process.execPath,['scripts/audit_reading_audio_alignment.mjs'],{stdio:'pipe'});
 const report=JSON.parse(fs.readFileSync('docs/qa_reading_audio_alignment.json','utf8'));
 assert.equal(report.courses.reduce((sum,item)=>sum+item.flagged,0),0);
 assert.equal(report.findings.filter(item=>item.classification==='reviewed_contextual_audio_mapping').length,5);
 assert.ok(report.findings.every(item=>item.severity==='info'));
});
