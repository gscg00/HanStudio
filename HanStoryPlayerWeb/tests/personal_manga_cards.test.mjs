import test from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';

const {cards}=JSON.parse(readFileSync(new URL('../library/personal_manga/cards.json',import.meta.url),'utf8'));
const editorial=/^(?:inhalt|extra|kapitel|episode|tokio\b|chef de guerre|chi.?s sweet home|mein ärgster bester freund)/ui;
const koreanNoise=/(?:^출처:|^제작|@|\]\s*만|(?:^|\s)ep\d|^정신이의 과학 노트[!.]*$|^잘 치는 타)/u;
const unreliable=/(?:imposible interpretarlo|impide interpretarlo|no se puede interpretar|parece enumerar)/ui;

test('las frases personales son estudiables, completas y solo cubren los idiomas con material',()=>{
  assert.ok(cards.length>=400);
  assert.deepEqual(new Set(cards.map(card=>card.language)),new Set(['French','German','Korean']));
  for(const card of cards){
    assert.match(card.text,/\p{L}/u);
    assert.ok(card.translation?.trim(),`falta traducción para ${card.id}`);
    assert.ok(Array.isArray(card.breakdown)&&card.breakdown.length,`falta desglose para ${card.id}`);
    assert.ok(card.breakdown.every(word=>word.term?.trim()&&word.meaning?.trim()),`desglose incompleto para ${card.id}`);
    assert.ok(Number(card.unlockAfter)>=2,`la frase ${card.id} se desbloquea demasiado pronto`);
    assert.ok(!editorial.test(card.text),`ruido editorial: ${card.text}`);
    assert.ok(!koreanNoise.test(card.text),`ruido coreano: ${card.text}`);
    assert.ok(!unreliable.test(card.note||''),`interpretación no fiable: ${card.text}`);
  }
});
