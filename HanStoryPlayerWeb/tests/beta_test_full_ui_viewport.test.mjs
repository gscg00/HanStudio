import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('el recorrido de interfaz acepta un viewport explícito para revisar móvil',()=>{
 const source=fs.readFileSync(new URL('../scripts/beta_test_full_ui.mjs',import.meta.url),'utf8');
 assert.match(source,/args\.viewport/);
 assert.match(source,/const viewport=\{width:Number\(viewportMatch\[1\]\),height:Number\(viewportMatch\[2\]\)\}/);
 assert.match(source,/browser\.newContext\(\{\s*viewport,/);
});
