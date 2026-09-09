// Phrase-specific equivalents. These are used only for meaning-based production,
// never for dictation, copying, spelling or block assembly.
const equivalents={
 English:[['What do you think?',"What's your opinion?",'What is your opinion?'],['As a result, the project was delayed.','Consequently, the project was delayed.','Therefore, the project was delayed.']],
 French:[['Qu’est-ce que tu en penses ?','Qu’en penses-tu ?','Tu en penses quoi ?'],['Par conséquent, le projet a pris du retard.','En conséquence, le projet a pris du retard.']],
 German:[['Was meinst du dazu?','Was denkst du darüber?'],['Dadurch verzögerte sich das Projekt.','Infolgedessen verzögerte sich das Projekt.']],
 Italian:[['Tu che cosa ne pensi?','Che cosa ne pensi?','Cosa ne pensi?'],['Di conseguenza, il progetto è stato ritardato.','Pertanto, il progetto è stato ritardato.']],
 Portuguese:[['O que achas?','O que você acha?','O que pensas?'],['Como resultado, o projeto atrasou-se.','Por isso, o projeto atrasou-se.']],
 Russian:[['А ты как думаешь?','Что ты думаешь?','Как ты думаешь?'],['В результате проект задержался.','Поэтому проект задержался.']],
 Chinese:[['你觉得怎么样？','你怎么看？','你有什么看法？'],['结果，项目推迟了。','因此，项目推迟了。']],
 Japanese:[['どう思いますか。','どう思いますか？'],['その結果、計画が遅れました。','そのため、計画が遅れました。']],
 Korean:[['어떻게 생각해요?','어떻게 생각하세요?'],['저는 아침에 차를 마셔요.','아침에 차를 마셔요.'],['그 결과 프로젝트가 늦어졌어요.','그래서 프로젝트가 늦어졌어요.']],
 Arabic:[['ما رأيك؟','ما هو رأيك؟'],['ونتيجة لذلك، تأخر المشروع.','لذلك، تأخر المشروع.']]
};
export function meaningVariants(activity,language){
 if(!['typed_translation','open_question'].includes(activity.type)||activity.tags?.includes('copying')||/^Copia\b/i.test(activity.prompt||''))return [];
 // An explicit evaluation constraint takes precedence over shared equivalents.
 if(activity.answer_policy&&activity.answer_policy!=='meaning')return [];
 return equivalents[language]?.find(group=>group.includes(activity.answer))||[];
}
