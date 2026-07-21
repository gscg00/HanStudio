import {B11_TARGETS,B11_THEMES} from './b11_content.mjs';

const priorMeanings=Object.fromEntries(B11_THEMES.map(theme=>[theme.id,theme.meanings]));
const REUSE=Object.freeze({
  conditions:['cause-effect',8],
  nuance:['media',8],
  negotiation:['register',8],
  projects:['society',8],
  perspectives:['narrative',8],
  conversation:['emotions',8],
});

const NEW_MEANINGS=Object.freeze({
  conditions:['Si salimos ahora, llegaremos antes de que oscurezca.','Si tuviera más tiempo, aprendería otro idioma.','Aunque cambie el plan, encontraremos una solución.','A menos que llueva, la reunión será afuera.','En caso de que necesites ayuda, llámame.','Habría aceptado si me lo hubieras explicado.','Cuanto más practico, más natural me resulta.','Supongamos que el tren se retrasa: ¿qué hacemos?'],
  nuance:['Estoy de acuerdo en parte, pero tengo una duda.','Entiendo tu punto, aunque lo veo de otra manera.','La idea parece buena; sin embargo, puede ser costosa.','Hasta cierto punto, el resultado fue positivo.','No necesariamente significa que sea imposible.','Probablemente funcione, siempre que todos participen.','Hay una diferencia sutil entre estas dos expresiones.','¿Qué tan segura es esa información?'],
  negotiation:['¿Podemos encontrar un punto medio?','Propongo que probemos esta opción primero.','Aceptaría si cambiamos la fecha.','Esa solución no me convence del todo.','¿Qué alternativa nos queda?','Podemos ceder en el precio, pero no en la calidad.','Antes de decidir, revisemos las condiciones.','Entonces, ¿quedamos de acuerdo en este plan?'],
  projects:['Definamos un objetivo claro y realista.','Tenemos que decidir qué es prioritario.','Yo me encargo del informe y tú de la presentación.','El plazo se acerca y aún faltan dos tareas.','Conviene prever los riesgos antes de empezar.','Revisaremos los avances al final de la semana.','El plan funcionó mejor de lo esperado.','¿Qué cambiaríamos la próxima vez?'],
  perspectives:['Desde mi punto de vista, el cambio era necesario.','Esta decisión afecta a distintos grupos.','La situación puede interpretarse de varias maneras.','Conviene considerar también el contexto histórico.','No todos tuvieron las mismas oportunidades.','La experiencia personal influye en nuestra opinión.','Comparar ambas perspectivas ayuda a comprender el problema.','¿Qué argumentos respaldan esa conclusión?'],
  conversation:['Déjame comprobar si entendí bien.','¿Qué quieres decir exactamente con eso?','En otras palabras, necesitamos más tiempo.','Volviendo al tema anterior, queda una pregunta.','Antes de continuar, quisiera aclarar un detalle.','Eso me recuerda una experiencia parecida.','En resumen, tenemos dos opciones principales.','¿Podrías explicar tu conclusión con un ejemplo?'],
});

export const B12_THEMES=Object.freeze([
  ['conditions','Hipótesis y condiciones','Imaginar posibilidades, condiciones y resultados alternativos.'],
  ['nuance','Opiniones con matices','Acordar, discrepar y expresar grados de certeza.'],
  ['negotiation','Decisiones y negociación','Proponer, ceder, rechazar y cerrar acuerdos.'],
  ['projects','Proyectos y colaboración','Planificar tareas, prioridades, riesgos y evaluación.'],
  ['perspectives','Perspectivas y argumentos','Relacionar contexto, experiencia, evidencia y conclusión.'],
  ['conversation','Conversaciones extensas','Aclarar, retomar, reformular y resumir una conversación.'],
].map(([id,title,objective])=>{
  const[source,start]=REUSE[id];
  return Object.freeze({id,title,objective,meanings:[...priorMeanings[source].slice(start,start+8),...NEW_MEANINGS[id]]});
}));

const NEW_TARGETS=Object.freeze({
  English:{icons:['If','Nuance','Deal','Plan','View','Talk'],
    conditions:["If we leave now, we'll arrive early.","If I had time, I'd learn another language.","Even if plans change, we'll find a way.","Unless it rains, we'll meet outside.",'Call me if you need help.',"I'd have agreed if you'd explained it.",'The more I practise, the easier it gets.','Suppose the train is late. What then?'],
    nuance:['I partly agree, but I have doubts.','I see your point, but I disagree.','Good idea, but perhaps too costly.','Overall, the result was positive.','That does not make it impossible.','It should work if everyone takes part.','These expressions differ slightly.','Is that information reliable?'],
    negotiation:['Can we compromise?','Let us try this option first.','I would agree if we changed the date.','That solution does not convince me.','What other option do we have?','We can compromise on price, not quality.','Let us review the terms before deciding.','So, do we agree?'],
    projects:['Let us set a clear, realistic goal.','What comes first?','I will do the report; you present it.','The deadline is near; two tasks remain.','Let us assess the risks first.','We will review progress this weekend.','The plan worked better than expected.','What should we change next time?'],
    perspectives:['In my view, change was necessary.','This decision affects several groups.','We can view the situation in several ways.','We should consider its history.','Not everyone had the same opportunities.','Experience shapes our opinions.','Comparing both views clarifies the issue.','What evidence supports that?'],
    conversation:['Let me check I understood.','What exactly do you mean?','In other words, we need more time.','Back to the topic: one question remains.','First, I want to clarify one detail.','That reminds me of a similar experience.','In short, we have two main options.','Could you explain with an example?']},
  French:{icons:['Si','Nuance','Accord','Projet','Vue','Dialogue'],
    conditions:['Si nous partons maintenant, nous arriverons tôt.','Si j’avais le temps, j’apprendrais une autre langue.','Même si le plan change, nous trouverons une solution.','Sauf s’il pleut, la réunion sera dehors.','Si tu as besoin d’aide, appelle-moi.','J’aurais accepté si tu me l’avais expliqué.','Plus je pratique, plus cela semble naturel.','Supposons que le train soit en retard. Que faire ?'],
    nuance:['Je suis en partie d’accord, mais j’hésite.','Je comprends ton avis, mais je ne suis pas d’accord.','Bonne idée, mais peut-être trop chère.','Dans l’ensemble, le résultat était positif.','Cela ne veut pas dire que c’est impossible.','Cela devrait marcher si tous participent.','Ces expressions diffèrent légèrement.','Cette information est-elle fiable ?'],
    negotiation:['Pouvons-nous trouver un compromis ?','Essayons d’abord cette option.','J’accepterais si nous changions la date.','Cette solution ne me convainc pas.','Quelle autre option nous reste ?','On peut céder sur le prix, pas la qualité.','Vérifions les conditions avant de décider.','Alors, sommes-nous d’accord ?'],
    projects:['Fixons un objectif clair et réaliste.','Quelle est la priorité ?','Je fais le rapport, toi la présentation.','La date limite approche ; deux tâches restent.','Prévoyons les risques avant de commencer.','Nous ferons le point ce week-end.','Le plan a mieux marché que prévu.','Que changer la prochaine fois ?'],
    perspectives:['Selon moi, ce changement était nécessaire.','Cette décision touche plusieurs groupes.','La situation se comprend de plusieurs façons.','Pensons aussi au contexte historique.','Tous n’ont pas eu les mêmes chances.','L’expérience influence notre opinion.','Comparer les points de vue éclaire le problème.','Quels arguments soutiennent ce point ?'],
    conversation:['Laisse-moi vérifier que j’ai compris.','Que veux-tu dire exactement ?','Autrement dit, il nous faut plus de temps.','Revenons au sujet : une question demeure.','Je veux d’abord préciser un détail.','Cela me rappelle une expérience similaire.','En résumé, nous avons deux options.','Peux-tu l’expliquer par un exemple ?']},
  German:{icons:['Wenn','Nuance','Einigung','Projekt','Sicht','Gespräch'],
    conditions:['Wenn wir jetzt fahren, kommen wir vor Einbruch der Nacht an.','Wenn ich mehr Zeit hätte, würde ich noch eine Sprache lernen.','Auch wenn der Plan sich ändert, finden wir eine Lösung.','Wenn es nicht regnet, treffen wir uns draußen.','Falls du Hilfe brauchst, ruf mich an.','Ich hätte zugestimmt, wenn du es erklärt hättest.','Je mehr ich übe, desto natürlicher wird es.','Angenommen, der Zug ist spät. Was tun wir?'],
    nuance:['Ich stimme teilweise zu, habe aber Zweifel.','Ich verstehe dich, sehe es aber anders.','Gute Idee, aber vielleicht zu teuer.','Insgesamt war das Ergebnis positiv.','Das heißt nicht, dass es unmöglich ist.','Es klappt wohl, wenn alle mitmachen.','Die Ausdrücke unterscheiden sich leicht.','Ist diese Information zuverlässig?'],
    negotiation:['Können wir einen Mittelweg finden?','Testen wir zuerst diese Möglichkeit.','Ich würde zustimmen, wenn wir das Datum ändern.','Diese Lösung überzeugt mich nicht.','Welche Alternative bleibt uns?','Beim Preis geben wir nach, bei der Qualität nicht.','Prüfen wir die Bedingungen vor der Entscheidung.','Sind wir uns einig?'],
    projects:['Legen wir ein klares, realistisches Ziel fest.','Was hat Vorrang?','Ich mache den Bericht, du die Präsentation.','Die Frist naht; zwei Aufgaben fehlen noch.','Prüfen wir die Risiken vor dem Start.','Am Wochenende prüfen wir den Fortschritt.','Der Plan lief besser als erwartet.','Was ändern wir nächstes Mal?'],
    perspectives:['Aus meiner Sicht war die Änderung nötig.','Diese Entscheidung betrifft mehrere Gruppen.','Die Situation lässt sich verschieden deuten.','Beachten wir auch den historischen Zusammenhang.','Nicht alle hatten die gleichen Chancen.','Erfahrung beeinflusst unsere Meinung.','Beide Sichtweisen erklären das Problem.','Welche Argumente stützen den Schluss?'],
    conversation:['Lass mich prüfen, ob ich richtig liege.','Was genau meinst du damit?','Mit anderen Worten brauchen wir mehr Zeit.','Zurück zum Thema bleibt eine Frage.','Zuerst möchte ich etwas klären.','Das erinnert mich an eine ähnliche Erfahrung.','Kurz gesagt haben wir zwei Möglichkeiten.','Kannst du das mit einem Beispiel erklären?']},
  Italian:{icons:['Se','Sfumatura','Accordo','Progetto','Vista','Dialogo'],
    conditions:['Se partiamo ora, arriveremo prima che faccia buio.','Se avessi tempo, imparerei un’altra lingua.','Anche se il piano cambia, troveremo una soluzione.','A meno che non piova, la riunione sarà fuori.','Se hai bisogno di aiuto, chiamami.','Avrei accettato se me lo avessi spiegato.','Più mi esercito, più sembra naturale.','Supponiamo che il treno sia in ritardo. Che facciamo?'],
    nuance:['Sono in parte d’accordo, ma ho un dubbio.','Capisco il tuo punto, ma non sono d’accordo.','Buona idea, ma forse costa troppo.','Nel complesso, il risultato è stato positivo.','Non significa che sia impossibile.','Probabilmente funzionerà, se tutti partecipano.','Le due espressioni differiscono leggermente.','Questa informazione è affidabile?'],
    negotiation:['Possiamo trovare un compromesso?','Proviamo prima questa opzione.','Accetterei se cambiassimo la data.','Questa soluzione non mi convince.','Quale altra scelta ci rimane?','Cediamo sul prezzo, non sulla qualità.','Rivediamo le condizioni prima di decidere.','Allora, siamo d’accordo?'],
    projects:['Definiamo un obiettivo chiaro e realistico.','Che cosa viene prima?','Io faccio il rapporto, tu la presentazione.','La scadenza è vicina; mancano due compiti.','Prevediamo i rischi prima di iniziare.','Controlleremo i progressi nel fine settimana.','Il piano ha funzionato meglio del previsto.','Che cosa cambieremo la prossima volta?'],
    perspectives:['Secondo me, il cambiamento era necessario.','Questa decisione riguarda diversi gruppi.','La situazione si può interpretare in vari modi.','Consideriamo anche il contesto storico.','Non tutti hanno avuto le stesse opportunità.','L’esperienza influenza la nostra opinione.','Confrontare le prospettive chiarisce il problema.','Quali argomenti sostengono la conclusione?'],
    conversation:['Fammi controllare se ho capito.','Che cosa vuoi dire esattamente?','In altre parole, ci serve più tempo.','Tornando al tema, rimane una domanda.','Prima vorrei chiarire un dettaglio.','Questo mi ricorda un’esperienza simile.','In sintesi, abbiamo due opzioni.','Puoi spiegarlo con un esempio?']},
  Russian:{icons:['Если','Нюанс','Сделка','Проект','Взгляд','Разговор'],
    conditions:['Если выйдем сейчас, приедем до темноты.','Если бы было больше времени, я бы выучил ещё один язык.','Даже если план изменится, мы найдём решение.','Если не будет дождя, встреча будет на улице.','Если нужна помощь, позвони мне.','Я бы согласился, если бы ты всё объяснил.','Чем больше я практикуюсь, тем легче получается.','Допустим, поезд задержится. Что будем делать?'],
    nuance:['Я согласен отчасти, но сомневаюсь.','Я понимаю тебя, но смотрю на это иначе.','Идея хорошая, однако может быть дорогой.','В целом результат был положительным.','Это не значит, что всё невозможно.','Вероятно, всё получится, если участвуют все.','Между выражениями есть тонкая разница.','Эта информация надёжна?'],
    negotiation:['Можем ли мы найти компромисс?','Сначала попробуем этот вариант.','Я соглашусь, если мы изменим дату.','Это решение меня не убеждает.','Какая ещё возможность остаётся?','Уступим в цене, но не в качестве.','Перед решением проверим условия.','Итак, мы согласны?'],
    projects:['Определим ясную и реальную цель.','Что важнее?','Я сделаю отчёт, а ты — презентацию.','Срок близко; две задачи не выполнены.','До начала стоит предусмотреть риски.','В конце недели проверим результаты.','План сработал лучше, чем ожидалось.','Что изменим в следующий раз?'],
    perspectives:['По-моему, это изменение было необходимо.','Это решение затрагивает разные группы.','Ситуацию можно толковать по-разному.','Учтём и исторический контекст.','Не у всех были одинаковые возможности.','Личный опыт влияет на наше мнение.','Сравнение взглядов объясняет проблему.','Какие аргументы подтверждают вывод?'],
    conversation:['Проверим, правильно ли я понял.','Что именно ты имеешь в виду?','Другими словами, нужно больше времени.','Вернёмся к теме: остаётся вопрос.','Перед продолжением я хочу кое-что уточнить.','Это напоминает мне похожий случай.','Итак, у нас два основных варианта.','Можешь объяснить вывод на примере?']},
  Korean:{icons:['조건','뉘앙스','합의','계획','관점','대화'],
    conditions:['지금 출발하면 어두워지기 전에 도착할 거예요.','시간이 더 있다면 다른 언어를 배울 거예요.','계획이 바뀌더라도 해결책을 찾을 거예요.','비가 오지 않는 한 회의는 밖에서 열릴 거예요.','도움이 필요할 경우에는 저에게 전화하세요.','설명해 줬다면 동의했을 거예요.','연습하면 할수록 더 자연스러워져요.','기차가 늦는다고 가정하면 우리는 어떻게 해야 할까요?'],
    nuance:['어느 정도 동의하지만 걱정되는 점이 있어요.','그 관점은 이해하지만 저는 다르게 생각해요.','좋은 생각 같지만 비용이 많이 들 수도 있어요.','어느 정도까지는 결과가 긍정적이었어요.','그렇다고 반드시 불가능하다는 뜻은 아니에요.','모두가 참여한다면 아마 잘될 거예요.','이 두 표현 사이에는 미묘한 차이가 있어요.','그 정보는 얼마나 믿을 만한가요?'],
    negotiation:['서로 받아들일 수 있는 중간 지점을 찾을까요?','먼저 이 방법을 시험해 보자고 제안합니다.','날짜를 바꾼다면 동의하겠습니다.','그 해결책에는 완전히 동의하기 어려워요.','우리에게 어떤 다른 선택이 남아 있나요?','가격은 양보할 수 있지만 품질은 양보할 수 없어요.','결정하기 전에 조건을 다시 확인합시다.','그러면 이 계획에 합의한 건가요?'],
    projects:['명확하고 현실적인 목표를 정합시다.','무엇을 우선해야 할지 결정해야 해요.','저는 보고서를 맡고 당신은 발표를 맡아 주세요.','마감이 다가오는데 아직 두 가지 일이 남았어요.','시작하기 전에 위험을 예상하는 것이 좋아요.','주말에 진행 상황을 검토할 거예요.','계획은 예상보다 더 잘 진행됐어요.','다음에는 무엇을 바꾸면 좋을까요?'],
    perspectives:['제 관점에서는 그 변화가 필요했어요.','이 결정은 여러 집단에 영향을 미쳐요.','이 상황은 여러 방식으로 해석할 수 있어요.','역사적 맥락도 고려할 필요가 있어요.','모두에게 같은 기회가 있었던 것은 아니에요.','개인적인 경험은 우리의 의견에 영향을 줘요.','두 관점을 비교하면 문제를 이해하는 데 도움이 돼요.','어떤 근거가 그 결론을 뒷받침하나요?'],
    conversation:['제가 제대로 이해했는지 확인할게요.','그 말이 정확히 무슨 뜻인가요?','다시 말하면 시간이 더 필요하다는 뜻이에요.','앞의 주제로 돌아가면 질문이 하나 남아 있어요.','계속하기 전에 한 가지를 분명히 하고 싶어요.','그 이야기를 들으니 비슷한 경험이 생각나요.','정리하면 우리에게 두 가지 중요한 선택이 있어요.','예를 들어서 결론을 설명해 주실 수 있나요?']},
  Japanese:{icons:['条件','微妙','合意','計画','視点','対話'],
    conditions:['今出発すれば、暗くなる前に着きます。','もっと時間があれば、別の言語を学びます。','計画が変わっても、解決策を見つけます。','雨が降らない限り、会議は外で行います。','助けが必要な場合は、私に電話してください。','説明してくれていたら、賛成したでしょう。','練習すればするほど、自然に感じられます。','電車が遅れるとしたら、どうしますか。'],
    nuance:['一部は賛成ですが、一つ気になる点があります。','あなたの考えは分かりますが、私は違う見方をしています。','いい考えですが、費用が高いかもしれません。','ある程度、結果は良かったと思います。','必ずしも不可能だという意味ではありません。','全員が参加すれば、たぶんうまくいきます。','この二つの表現には微妙な違いがあります。','その情報はどのくらい信頼できますか。'],
    negotiation:['お互いに納得できる点を見つけられますか。','まずこの方法を試すことを提案します。','日程を変えるなら、賛成します。','その解決策には完全には納得できません。','ほかにどんな選択肢が残っていますか。','価格は譲れますが、品質は譲れません。','決める前に、条件を確認しましょう。','では、この計画で合意ですね。'],
    projects:['明確で現実的な目標を決めましょう。','何を優先するか決める必要があります。','私は報告書を、あなたは発表を担当してください。','締め切りが近いのに、まだ二つの作業が残っています。','始める前に、危険を予想しておくべきです。','週末に進み具合を確認します。','計画は予想よりうまくいきました。','次回は何を変えますか。'],
    perspectives:['私の立場から見ると、その変化は必要でした。','この決定はさまざまな集団に影響します。','この状況はいくつかの方法で解釈できます。','歴史的な背景も考える必要があります。','全員に同じ機会があったわけではありません。','個人的な経験は意見に影響します。','二つの視点を比べると、問題を理解しやすくなります。','どんな根拠がその結論を支えていますか。'],
    conversation:['正しく理解したか確認させてください。','それは具体的にどういう意味ですか。','言い換えると、もっと時間が必要です。','前の話題に戻ると、一つ質問が残っています。','続ける前に、一点確認したいです。','それを聞いて、似た経験を思い出しました。','まとめると、主な選択肢は二つです。','例を使って結論を説明していただけますか。']},
  Chinese:{icons:['条件','分寸','协商','项目','观点','对话'],
    conditions:['如果我们现在出发，天黑前就能到。','如果我有更多时间，我会再学一种语言。','即使计划改变，我们也会找到解决办法。','除非下雨，否则会议会在外面举行。','万一你需要帮助，就给我打电话。','如果你当时解释清楚，我就会同意。','我练习得越多，就越觉得自然。','假设火车晚点了，我们该怎么办？'],
    nuance:['我部分同意，不过还有一点担心。','我理解你的观点，不过我的看法不同。','这个想法不错，但是成本可能很高。','从某种程度上说，结果是积极的。','这并不一定意味着不可能。','只要大家都参加，应该会成功。','这两个表达之间有细微的区别。','这个信息有多可靠？'],
    negotiation:['我们能不能找一个双方都能接受的办法？','我建议先试试这个方案。','如果我们改变日期，我就同意。','这个解决办法不能完全说服我。','我们还有什么别的选择？','价格可以让步，但是质量不能让步。','决定以前，我们先检查一下条件。','那么，我们就按这个计划达成一致了吧？'],
    projects:['我们先确定一个清楚而现实的目标。','我们需要决定什么最重要。','我负责报告，你负责演示。','截止日期快到了，还有两个任务没完成。','开始以前，最好先考虑可能的风险。','周末我们会检查进展。','这个计划比预想的效果更好。','下次我们会改变什么？'],
    perspectives:['从我的角度看，这个变化是必要的。','这个决定会影响不同的群体。','这个情况可以有不同的解释。','我们也应该考虑历史背景。','不是每个人都有同样的机会。','个人经历会影响我们的看法。','比较两种观点有助于理解问题。','什么论据支持这个结论？'],
    conversation:['让我确认一下我是不是理解对了。','你说的到底是什么意思？','换句话说，我们需要更多时间。','回到刚才的话题，还有一个问题。','继续以前，我想先说明一个细节。','这让我想起一次相似的经历。','总的来说，我们有两个主要选择。','你能用一个例子说明你的结论吗？']},
  Portuguese:{icons:['Se','Nuance','Acordo','Projeto','Perspetiva','Diálogo'],
    conditions:['Se sairmos agora, chegaremos antes de anoitecer.','Se tivesse tempo, aprenderia outra língua.','Mesmo que o plano mude, encontraremos uma solução.','A menos que chova, a reunião será fora.','Se precisares de ajuda, telefona-me.','Teria concordado se me tivesses explicado.','Quanto mais pratico, mais natural parece.','Suponhamos que o comboio se atrasa. Que fazemos?'],
    nuance:['Concordo em parte, mas tenho uma dúvida.','Compreendo o teu ponto, mas discordo.','Boa ideia, mas talvez fique cara.','No geral, o resultado foi positivo.','Isso não significa que seja impossível.','Deve funcionar se todos participarem.','As expressões diferem ligeiramente.','Esta informação é fiável?'],
    negotiation:['Podemos encontrar um meio-termo?','Vamos experimentar esta opção primeiro.','Aceitaria se mudássemos a data.','Esta solução não me convence.','Que outra alternativa nos resta?','Cedemos no preço, não na qualidade.','Vamos rever as condições antes de decidir.','Então, concordamos?'],
    projects:['Vamos definir um objetivo claro e realista.','O que vem primeiro?','Eu faço o relatório e tu a apresentação.','O prazo aproxima-se; faltam duas tarefas.','Vamos prever os riscos antes de começar.','Revemos o progresso no fim da semana.','O plano funcionou melhor do que esperávamos.','O que mudamos da próxima vez?'],
    perspectives:['Na minha opinião, a mudança era necessária.','Esta decisão afeta vários grupos.','A situação pode ser vista de várias maneiras.','Consideremos também o contexto histórico.','Nem todos tiveram as mesmas oportunidades.','A experiência influencia a nossa opinião.','Comparar perspetivas esclarece o problema.','Que argumentos sustentam a conclusão?'],
    conversation:['Deixa-me confirmar se percebi.','O que queres dizer exatamente?','Por outras palavras, precisamos de mais tempo.','Voltando ao assunto, falta uma pergunta.','Primeiro, quero esclarecer um detalhe.','Isso lembra-me uma experiência parecida.','Em resumo, temos duas opções.','Podes explicar com um exemplo?']},
  Arabic:{icons:['شرط','دقة','اتفاق','مشروع','وجهة','حوار'],
    conditions:['إذا انطلقنا الآن، سنصل قبل الظلام.','لو كان لدي وقت، لتعلمت لغة أخرى.','حتى لو تغيرت الخطة، سنجد حلًا.','ما لم تمطر، سيكون الاجتماع في الخارج.','إذا احتجت إلى مساعدة، اتصل بي.','كنت سأوافق لو شرحت الأمر.','كلما تدربت أكثر، صار أسهل.','لنفترض أن القطار تأخر. ماذا نفعل؟'],
    nuance:['أوافق جزئيًا، لكن لدي ملاحظة.','أفهم رأيك، لكنني أراه بطريقة مختلفة.','الفكرة جيدة، لكنها قد تكون مكلفة.','إلى حد ما، كانت النتيجة إيجابية.','هذا لا يعني أنه مستحيل.','ربما ينجح، بشرط أن يشارك الجميع.','هناك فرق دقيق بين التعبيرين.','هل هذه المعلومة موثوقة؟'],
    negotiation:['هل يمكننا الوصول إلى حل وسط؟','أقترح أن نجرب هذا الخيار أولًا.','سأوافق إذا غيرنا الموعد.','هذا الحل لا يقنعني تمامًا.','ما البديل المتاح لنا؟','نتنازل في السعر، لكن ليس في الجودة.','قبل القرار، لنراجع الشروط.','إذًا، هل اتفقنا على هذه الخطة؟'],
    projects:['لنحدد هدفًا واضحًا وواقعيًا.','علينا أن نقرر ما له الأولوية.','سأتولى التقرير، وأنت العرض.','يقترب الموعد وما زالت مهمتان.','من الأفضل توقع المخاطر قبل البدء.','سنراجع التقدم في نهاية الأسبوع.','نجحت الخطة أفضل مما توقعنا.','ماذا سنغير في المرة القادمة؟'],
    perspectives:['في رأيي، كان التغيير ضروريًا.','يؤثر هذا القرار في مجموعات مختلفة.','يمكن تفسير الوضع بطرق متعددة.','ينبغي مراعاة السياق التاريخي أيضًا.','لم تكن لدى الجميع الفرص نفسها.','تؤثر التجربة في آرائنا.','مقارنة وجهتي النظر توضح المشكلة.','ما الحجج التي تدعم هذا الاستنتاج؟'],
    conversation:['دعني أتأكد من أنني فهمت.','ماذا تقصد بالضبط؟','بعبارة أخرى، نحتاج إلى وقت أطول.','بالعودة إلى الموضوع، بقي سؤال واحد.','قبل أن نواصل، أود توضيح نقطة.','يذكرني ذلك بتجربة مشابهة.','باختصار، أمامنا خياران.','هل يمكنك شرح استنتاجك بمثال؟']},
});

export const B12_TARGETS=Object.freeze(Object.fromEntries(Object.entries(NEW_TARGETS).map(([language,payload])=>{
  const prior=B11_TARGETS[language];
  const merged={icons:payload.icons};
  for(const theme of B12_THEMES){
    const[source,start]=REUSE[theme.id];
    merged[theme.id]=[...prior[source].slice(start,start+8),...payload[theme.id]];
  }
  return[language,Object.freeze(merged)];
})));

export function validateB12Content(){
  for(const[language,payload]of Object.entries(B12_TARGETS)){
    if(payload.icons.length!==B12_THEMES.length)throw new Error(`${language}: iconos B1.2 incompletos`);
    for(const theme of B12_THEMES){
      if(!Array.isArray(payload[theme.id])||payload[theme.id].length!==16)throw new Error(`${language}/${theme.id}: contenido incompleto`);
      if(new Set(payload[theme.id]).size!==16)throw new Error(`${language}/${theme.id}: duplicados dentro de la unidad`);
    }
  }
  return true;
}
