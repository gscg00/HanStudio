import fs from 'node:fs';
const repairs={
  Italian:{target:'gli · sci',examples:[{label:'EJEMPLO CON GLI',text:'famiglia',meaning:'familia',audio:'famiglia'},{label:'SC ANTE E',text:'scena',meaning:'escena',audio:'scena'}]},
  Portuguese:{target:'casa',examples:[{label:'S ENTRE VOCALES',text:'casa',meaning:'casa',audio:'casa'}]},
  Russian:{target:'а↔я · о↔ё · у↔ю',examples:[{text:'А',audio:'а'},{text:'Я',audio:'я'},{text:'О',audio:'о'},{text:'Ё',audio:'ё'},{text:'У',audio:'у'},{text:'Ю',audio:'ю'}]},
  RussianVowelPair:{language:'Russian',target:'э↔е · ы↔и',examples:[{text:'Э',audio:'э'},{text:'Е',audio:'е'},{text:'Ы',audio:'ы'},{text:'И',audio:'и'}]},
};
let changed=0;
for(const [key,specification] of Object.entries(repairs)){
  const language=specification.language||key;
  const spec=specification;
  const file=new URL(`../library/courses/${language}/units/reading-foundations.json`,import.meta.url);
  const unit=JSON.parse(fs.readFileSync(file,'utf8'));
  for(const lesson of unit.lessons)for(const activity of lesson.activities){
    if(activity.type!=='teach_concept'||activity.target!==spec.target)continue;
    const before=JSON.stringify(activity);
    activity.audio='';activity.slow_audio='';activity.audio_examples=spec.examples;
    if(before!==JSON.stringify(activity))changed++;
  }
  fs.writeFileSync(file,JSON.stringify(unit,null,2)+'\n');
}
console.log(JSON.stringify({changed}));
