import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('el auditor de integridad declara explícitamente sus límites acústicos',()=>{
 const source=fs.readFileSync(new URL('../scripts/audit_audio_integrity.mjs',import.meta.url),'utf8');
 assert.match(source,/ffprobe/);
 assert.match(source,/no evalúa pronunciación/i);
 assert.match(source,/unreadable/);
 assert.match(source,/zeroDuration/);
});
