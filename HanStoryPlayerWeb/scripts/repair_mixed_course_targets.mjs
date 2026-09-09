import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const web=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const changes={Chinese:['没有 conjugación','我喝 / 你喝'],Russian:['negación не','Я не знаю.'],Korean:['도와주세요. Help.','도와주세요.']};
let count=0;
for(const [language,[before,after]] of Object.entries(changes)){
 const dir=path.join(web,'library/courses',language),course=JSON.parse(fs.readFileSync(path.join(dir,'course.json'),'utf8'));
 for(const ref of course.units){const file=path.join(dir,ref.manifest),raw=fs.readFileSync(file,'utf8');if(raw.includes(before)){fs.writeFileSync(file,raw.replaceAll(before,after));count++;}}
}
const source=path.join(web,'src/data/zero_courses.js'),raw=fs.readFileSync(source,'utf8');
fs.writeFileSync(source,raw.replaceAll(changes.Chinese[0],changes.Chinese[1]).replaceAll(changes.Russian[0],changes.Russian[1]));
console.log(`${count} unidades y fuente de reglas actualizadas.`);
