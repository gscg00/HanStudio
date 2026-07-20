import {A22_TARGETS,A22_THEMES} from './a22_content.mjs';

const priorMeanings=Object.fromEntries(A22_THEMES.map(theme=>[theme.id,theme.meanings]));
const REUSE=Object.freeze({
  narrative:['experiences',8],
  'cause-effect':['opinions',8],
  media:['culture',8],
  emotions:['opinions',0],
  society:['culture',0],
  register:['problemSolving',8],
});
const NEW_MEANINGS=Object.freeze({
  narrative:['Mientras volvía a casa, empezó a llover.','De repente, todas las luces se apagaron.','Al principio, nadie sabía qué hacer.','Más tarde, encontramos una puerta abierta.','Mientras tanto, mi hermana llamó a la policía.','Al final, todo salió bien.','Entonces me di cuenta de mi error.','Desde entonces, siempre compruebo la puerta.'],
  'cause-effect':['La carretera estaba cerrada, así que tomamos otro camino.','Como perdí el autobús, llegué tarde.','El vuelo se canceló debido a la tormenta.','No había suficiente tiempo; por eso nos fuimos.','Como resultado, el proyecto se retrasó.','Aunque estaba cansada, terminó el trabajo.','Gracias a tu ayuda, resolvimos el problema.','¿Qué causó este cambio?'],
  media:['La novela cuenta la historia de una familia.','La protagonista intenta descubrir la verdad.','La trama comienza en un pueblo pequeño.','Mi escena favorita ocurre al final.','El desenlace me sorprendió mucho.','La directora muestra dos puntos de vista.','La recomiendo porque los personajes parecen reales.','La crítica dice que la historia avanza lentamente.'],
  emotions:['Me sentí aliviado cuando llamó.','Ella estaba decepcionada con el resultado.','Nos entendimos mal.','Después hablamos con calma.','Deberías decirle cómo te sientes.','Desde entonces, confiamos más el uno en el otro.','A veces es difícil perdonar.','Aprendí a escuchar antes de responder.'],
  society:['El barrio ha cambiado mucho.','Necesitamos más transporte público.','Hay que proteger este parque.','Los vecinos organizaron una reunión.','La contaminación afecta a nuestra salud.','El ayuntamiento anunció un nuevo plan.','Quiero participar como voluntario.','Todos podemos mejorar nuestra comunidad.'],
  register:['¿Podría ayudarme, por favor?','Le agradecería una respuesta antes del viernes.','Disculpe la molestia.','¿Le importaría cerrar la ventana?','Gracias por avisarme con tiempo.','Lamento informarle de que la cita se canceló.','Entre amigos podemos hablar de manera más directa.','Es importante adaptar el tono a la situación.'],
});

export const B11_THEMES=Object.freeze([
  ['narrative','Narraciones conectadas','Organizar antecedentes, hechos y desenlace.'],
  ['cause-effect','Causas y consecuencias','Explicar por qué ocurrió algo y qué produjo.'],
  ['media','Historias, cine y medios','Resumir una obra y comentar personajes o acontecimientos.'],
  ['emotions','Relaciones y emociones','Expresar reacciones, conflictos, consejos y cambios.'],
  ['society','Sociedad y entorno','Hablar de comunidad, medio ambiente y vida urbana.'],
  ['register','Registro y cortesía','Adaptar peticiones y opiniones a situaciones formales e informales.'],
].map(([id,title,objective])=>{
  const[source,start]=REUSE[id];
  return Object.freeze({id,title,objective,meanings:[...priorMeanings[source].slice(start,start+8),...NEW_MEANINGS[id]]});
}));

const NEW_TARGETS=Object.freeze({
  English:{icons:['Story','Why','Media','Feel','City','Please'],
    narrative:['While I was walking home, it started to rain.','Suddenly, all the lights went out.','At first, nobody knew what to do.','Later, we found an open door.','Meanwhile, my sister called the police.','In the end, everything turned out well.','Then I realized my mistake.','Since then, I always check the door.'],
    'cause-effect':['The road was closed, so we took another route.','Because I missed the bus, I arrived late.','The flight was cancelled due to the storm.','There was not enough time; therefore, we left.','As a result, the project was delayed.','Although she was tired, she finished the work.','Thanks to your help, we solved the problem.','What caused this change?'],
    media:['The novel tells the story of a family.','The main character tries to discover the truth.','The plot begins in a small town.','My favourite scene happens at the end.','The ending surprised me a lot.','The director shows two points of view.','I recommend it because the characters feel real.','The review says the story moves slowly.'],
    emotions:['I felt relieved when she called.','She was disappointed with the result.','We misunderstood each other.','Afterwards, we talked calmly.','You should tell him how you feel.','Since then, we trust each other more.','Sometimes it is difficult to forgive.','I learned to listen before answering.'],
    society:['The neighbourhood has changed a lot.','We need more public transport.','This park must be protected.','The neighbours organised a meeting.','Pollution affects our health.','The council announced a new plan.','I want to take part as a volunteer.','We can all improve our community.'],
    register:['Could you help me, please?','I would appreciate a reply before Friday.','I am sorry to bother you.','Would you mind closing the window?','Thank you for letting me know in advance.','I regret to inform you that the appointment was cancelled.','Among friends, we can speak more directly.','It is important to adapt your tone to the situation.']},
  French:{icons:['Récit','Cause','Média','Émotion','Ville','Politesse'],
    narrative:['Pendant que je rentrais chez moi, il a commencé à pleuvoir.','Soudain, toutes les lumières se sont éteintes.','Au début, personne ne savait quoi faire.','Plus tard, nous avons trouvé une porte ouverte.','Pendant ce temps, ma sœur a appelé la police.','Finalement, tout s’est bien terminé.','C’est alors que j’ai compris mon erreur.','Depuis, je vérifie toujours la porte.'],
    'cause-effect':['La route était fermée, alors nous avons pris un autre chemin.','Comme j’ai raté le bus, je suis arrivé en retard.','Le vol a été annulé à cause de la tempête.','Il n’y avait pas assez de temps ; nous sommes donc partis.','Par conséquent, le projet a pris du retard.','Bien qu’elle soit fatiguée, elle a terminé le travail.','Grâce à ton aide, nous avons résolu le problème.','Qu’est-ce qui a provoqué ce changement ?'],
    media:['Le roman raconte l’histoire d’une famille.','Le personnage principal essaie de découvrir la vérité.','L’intrigue commence dans un petit village.','Ma scène préférée se passe à la fin.','La fin m’a beaucoup surpris.','La réalisatrice montre deux points de vue.','Je le recommande parce que les personnages semblent réels.','La critique dit que l’histoire avance lentement.'],
    emotions:['Je me suis senti soulagé quand elle a appelé.','Elle était déçue du résultat.','Nous nous sommes mal compris.','Ensuite, nous avons parlé calmement.','Tu devrais lui dire ce que tu ressens.','Depuis, nous nous faisons davantage confiance.','Il est parfois difficile de pardonner.','J’ai appris à écouter avant de répondre.'],
    society:['Le quartier a beaucoup changé.','Nous avons besoin de plus de transports en commun.','Il faut protéger ce parc.','Les voisins ont organisé une réunion.','La pollution a des effets sur notre santé.','La mairie a annoncé un nouveau projet.','Je veux participer comme bénévole.','Nous pouvons tous améliorer notre communauté.'],
    register:['Pourriez-vous m’aider, s’il vous plaît ?','Je vous serais reconnaissant de répondre avant vendredi.','Excusez-moi de vous déranger.','Cela vous dérangerait de fermer la fenêtre ?','Merci de m’avoir prévenu à l’avance.','J’ai le regret de vous informer que le rendez-vous a été annulé.','Entre amis, on peut parler plus directement.','Il est important d’adapter son ton à la situation.']},
  German:{icons:['Erzählung','Grund','Medien','Gefühl','Umwelt','Höflich'],
    narrative:['Als ich nach Hause ging, fing es an zu regnen.','Plötzlich gingen alle Lichter aus.','Zuerst wusste niemand, was zu tun war.','Später fanden wir eine offene Tür.','Inzwischen rief meine Schwester die Polizei.','Am Ende ging alles gut aus.','Dann erkannte ich meinen Fehler.','Seitdem überprüfe ich immer die Tür.'],
    'cause-effect':['Die Straße war gesperrt, deshalb nahmen wir einen anderen Weg.','Weil ich den Bus verpasst hatte, kam ich zu spät.','Der Flug wurde wegen des Sturms abgesagt.','Es gab nicht genug Zeit; deshalb gingen wir.','Dadurch verzögerte sich das Projekt.','Obwohl sie müde war, beendete sie die Arbeit.','Dank deiner Hilfe haben wir das Problem gelöst.','Was hat diese Veränderung verursacht?'],
    media:['Der Roman erzählt die Geschichte einer Familie.','Die Hauptfigur versucht, die Wahrheit herauszufinden.','Die Handlung beginnt in einer kleinen Stadt.','Meine Lieblingsszene kommt am Ende.','Das Ende hat mich sehr überrascht.','Die Regisseurin zeigt zwei Sichtweisen.','Ich empfehle ihn, weil die Figuren echt wirken.','Die Kritik sagt, dass die Geschichte langsam vorankommt.'],
    emotions:['Ich war erleichtert, als sie anrief.','Sie war vom Ergebnis enttäuscht.','Wir haben uns missverstanden.','Danach haben wir ruhig miteinander gesprochen.','Du solltest ihm sagen, wie du dich fühlst.','Seitdem vertrauen wir einander mehr.','Manchmal ist es schwer zu verzeihen.','Ich habe gelernt, vor dem Antworten zuzuhören.'],
    society:['Das Viertel hat sich stark verändert.','Wir brauchen mehr öffentliche Verkehrsmittel.','Dieser Park muss geschützt werden.','Die Nachbarn haben ein Treffen organisiert.','Umweltverschmutzung schadet unserer Gesundheit.','Die Stadtverwaltung hat einen neuen Plan angekündigt.','Ich möchte mich ehrenamtlich beteiligen.','Wir alle können unsere Gemeinschaft verbessern.'],
    register:['Könnten Sie mir bitte helfen?','Ich wäre Ihnen für eine Antwort vor Freitag dankbar.','Entschuldigen Sie bitte die Störung.','Würde es Ihnen etwas ausmachen, das Fenster zu schließen?','Vielen Dank, dass Sie mir rechtzeitig Bescheid gesagt haben.','Leider muss ich Ihnen mitteilen, dass der Termin abgesagt wurde.','Unter Freunden können wir direkter sprechen.','Es ist wichtig, den Ton an die Situation anzupassen.']},
  Italian:{icons:['Racconto','Causa','Media','Emozione','Società','Cortesia'],
    narrative:['Mentre tornavo a casa, ha cominciato a piovere.','All’improvviso, tutte le luci si sono spente.','All’inizio, nessuno sapeva cosa fare.','Più tardi, abbiamo trovato una porta aperta.','Nel frattempo, mia sorella ha chiamato la polizia.','Alla fine, è andato tutto bene.','Allora mi sono reso conto del mio errore.','Da allora controllo sempre la porta.'],
    'cause-effect':['La strada era chiusa, quindi abbiamo preso un’altra strada.','Dato che ho perso l’autobus, sono arrivato tardi.','Il volo è stato cancellato a causa della tempesta.','Non c’era abbastanza tempo; perciò siamo partiti.','Di conseguenza, il progetto è stato ritardato.','Sebbene fosse stanca, ha finito il lavoro.','Grazie al tuo aiuto, abbiamo risolto il problema.','Che cosa ha causato questo cambiamento?'],
    media:['Il romanzo racconta la storia di una famiglia.','La protagonista cerca di scoprire la verità.','La trama comincia in un piccolo paese.','La mia scena preferita avviene alla fine.','Il finale mi ha sorpreso molto.','La regista mostra due punti di vista.','Lo consiglio perché i personaggi sembrano reali.','La recensione dice che la storia procede lentamente.'],
    emotions:['Mi sono sentito sollevato quando ha chiamato.','Era delusa dal risultato.','Ci siamo fraintesi.','Dopo abbiamo parlato con calma.','Dovresti dirgli come ti senti.','Da allora ci fidiamo di più l’uno dell’altro.','A volte è difficile perdonare.','Ho imparato ad ascoltare prima di rispondere.'],
    society:['Il quartiere è cambiato molto.','Abbiamo bisogno di più trasporti pubblici.','Bisogna proteggere questo parco.','I vicini hanno organizzato una riunione.','L’inquinamento danneggia la nostra salute.','Il comune ha annunciato un nuovo piano.','Voglio partecipare come volontario.','Tutti possiamo migliorare la nostra comunità.'],
    register:['Potrebbe aiutarmi, per favore?','Le sarei grato per una risposta entro venerdì.','Mi scusi per il disturbo.','Le dispiacerebbe chiudere la finestra?','Grazie per avermi avvisato in anticipo.','Mi dispiace informarla che l’appuntamento è stato cancellato.','Tra amici possiamo parlare in modo più diretto.','È importante adattare il tono alla situazione.']},
  Russian:{icons:['Рассказ','Причина','Медиа','Чувства','Общество','Вежливо'],
    narrative:['Когда я возвращался домой, начался дождь.','Вдруг весь свет погас.','Сначала никто не знал, что делать.','Позже мы нашли открытую дверь.','Тем временем моя сестра позвонила в полицию.','В конце концов всё закончилось хорошо.','Тогда я понял свою ошибку.','С тех пор я всегда проверяю дверь.'],
    'cause-effect':['Дорога была закрыта, поэтому мы поехали другим путём.','Так как я пропустил автобус, я опоздал.','Рейс отменили из-за бури.','Времени было недостаточно, поэтому мы ушли.','В результате проект задержался.','Хотя она устала, она закончила работу.','Благодаря твоей помощи мы решили проблему.','Что вызвало это изменение?'],
    media:['Роман рассказывает историю одной семьи.','Главная героиня пытается узнать правду.','Сюжет начинается в маленьком городе.','Моя любимая сцена происходит в конце.','Концовка меня очень удивила.','Режиссёр показывает две точки зрения.','Я советую его, потому что герои кажутся настоящими.','В рецензии говорится, что история развивается медленно.'],
    emotions:['Я почувствовал облегчение, когда она позвонила.','Она была разочарована результатом.','Мы неправильно поняли друг друга.','Потом мы спокойно поговорили.','Тебе стоит сказать ему, что ты чувствуешь.','С тех пор мы больше доверяем друг другу.','Иногда трудно простить.','Я научился слушать, прежде чем отвечать.'],
    society:['Район сильно изменился.','Нам нужно больше общественного транспорта.','Этот парк нужно защищать.','Соседи организовали собрание.','Загрязнение влияет на наше здоровье.','Городские власти объявили о новом плане.','Я хочу участвовать как волонтёр.','Мы все можем улучшить наше сообщество.'],
    register:['Не могли бы вы мне помочь?','Буду благодарен за ответ до пятницы.','Извините за беспокойство.','Вы не могли бы закрыть окно?','Спасибо, что предупредили меня заранее.','С сожалением сообщаю, что встречу отменили.','С друзьями можно говорить более прямо.','Важно менять тон в зависимости от ситуации.']},
  Korean:{icons:['이야기','원인','매체','감정','사회','예의'],
    narrative:['집에 돌아가고 있을 때 비가 오기 시작했어요.','갑자기 모든 불이 꺼졌어요.','처음에는 아무도 무엇을 해야 할지 몰랐어요.','나중에 열린 문을 발견했어요.','그동안 제 여동생은 경찰에 전화했어요.','결국 모든 일이 잘 끝났어요.','그때 제 실수를 깨달았어요.','그 이후로 항상 문을 확인해요.'],
    'cause-effect':['길이 막혀서 다른 길로 갔어요.','버스를 놓쳤기 때문에 늦었어요.','폭풍 때문에 비행기가 취소됐어요.','시간이 부족해서 떠났어요.','그 결과 프로젝트가 늦어졌어요.','피곤했지만 일을 끝냈어요.','도와준 덕분에 문제를 해결했어요.','무엇이 이런 변화를 일으켰어요?'],
    media:['그 소설은 한 가족의 이야기를 다뤄요.','주인공은 진실을 밝히려고 해요.','줄거리는 작은 마을에서 시작해요.','제가 가장 좋아하는 장면은 마지막에 나와요.','결말이 정말 놀라웠어요.','감독은 두 가지 관점을 보여 줘요.','인물들이 실제 같아서 추천해요.','평론에서는 이야기가 천천히 진행된다고 해요.'],
    emotions:['전화가 왔을 때 안심했어요.','그녀는 결과에 실망했어요.','우리는 서로 오해했어요.','그 후에 차분하게 이야기했어요.','어떻게 느끼는지 말하는 게 좋아요.','그 이후로 서로를 더 믿게 됐어요.','가끔은 용서하기가 어려워요.','대답하기 전에 듣는 법을 배웠어요.'],
    society:['동네가 많이 변했어요.','대중교통이 더 필요해요.','이 공원을 보호해야 해요.','이웃들이 회의를 열었어요.','오염은 우리 건강에 영향을 줘요.','시청이 새로운 계획을 발표했어요.','자원봉사자로 참여하고 싶어요.','우리 모두 지역 사회를 더 좋게 만들 수 있어요.'],
    register:['도와주시겠어요?','금요일까지 답변해 주시면 감사하겠습니다.','방해해서 죄송합니다.','창문을 닫아 주시겠어요?','미리 알려 주셔서 감사합니다.','약속이 취소되었음을 알려 드리게 되어 유감입니다.','친구끼리는 더 직접적으로 말할 수 있어요.','상황에 맞게 말투를 바꾸는 것이 중요해요.']},
  Japanese:{icons:['物語','原因','作品','感情','社会','丁寧'],
    narrative:['家に帰っている途中で、雨が降り始めました。','突然、すべての電気が消えました。','初めは、誰もどうすればいいか分かりませんでした。','その後、開いているドアを見つけました。','その間に、妹が警察に電話しました。','最後には、すべてうまくいきました。','その時、自分の間違いに気づきました。','それ以来、いつもドアを確認しています。'],
    'cause-effect':['道が閉まっていたので、別の道を通りました。','バスに乗り遅れたため、遅刻しました。','嵐のため、飛行機は欠航になりました。','時間が足りなかったので、帰りました。','その結果、計画が遅れました。','疲れていましたが、仕事を終えました。','手伝ってくれたおかげで、問題を解決できました。','何がこの変化の原因になったのですか。'],
    media:['その小説は、ある家族の物語です。','主人公は真実を見つけようとします。','物語は小さな町で始まります。','一番好きな場面は最後にあります。','結末にはとても驚きました。','監督は二つの見方を示しています。','登場人物が本物らしいので、おすすめです。','批評には、物語がゆっくり進むと書いてあります。'],
    emotions:['電話が来た時、安心しました。','彼女は結果にがっかりしていました。','私たちはお互いに誤解していました。','その後、落ち着いて話しました。','自分の気持ちを伝えたほうがいいです。','それ以来、前より信頼し合っています。','許すのが難しい時もあります。','答える前に聞くことを学びました。'],
    society:['この地域は大きく変わりました。','もっと公共交通機関が必要です。','この公園を守らなければなりません。','近所の人たちは会議を開きました。','汚染は私たちの健康に影響します。','市役所は新しい計画を発表しました。','ボランティアとして参加したいです。','みんなで地域をより良くできます。'],
    register:['手伝っていただけますか。','金曜日までにお返事をいただければ幸いです。','お忙しいところ、失礼します。','窓を閉めていただけませんか。','早めに知らせていただき、ありがとうございます。','予約がキャンセルされたことをお知らせいたします。','友達同士なら、もっと直接話せます。','状況に合わせて話し方を変えることが大切です。']},
  Chinese:{icons:['故事','原因','媒体','感情','社会','礼貌'],
    narrative:['我回家的时候，开始下雨了。','突然，所有的灯都灭了。','一开始，谁也不知道该怎么办。','后来，我们发现一扇门开着。','与此同时，我妹妹给警察打了电话。','最后，一切都顺利解决了。','那时我才发现自己的错误。','从那以后，我总会检查门。'],
    'cause-effect':['路被封了，所以我们走了另一条路。','因为我没赶上公交车，所以迟到了。','航班因为暴风雨被取消了。','时间不够，因此我们离开了。','结果，项目推迟了。','虽然她很累，但是她完成了工作。','多亏你的帮助，我们解决了问题。','是什么引起了这个变化？'],
    media:['这本小说讲的是一个家庭的故事。','主人公试图找出真相。','故事从一个小镇开始。','我最喜欢的场景出现在最后。','结局让我非常惊讶。','导演展示了两种观点。','我推荐它，因为人物很真实。','评论说故事发展得很慢。'],
    emotions:['她打电话时，我松了一口气。','她对结果感到失望。','我们误会了对方。','后来，我们冷静地谈了谈。','你应该告诉他你的感受。','从那以后，我们更信任对方了。','有时候原谅别人很难。','我学会了先听再回答。'],
    society:['这个社区变化很大。','我们需要更多公共交通。','这个公园必须受到保护。','邻居们组织了一次会议。','污染会影响我们的健康。','市政府宣布了一项新计划。','我想参加志愿者活动。','我们都能让社区变得更好。'],
    register:['您能帮帮我吗？','如果您能在星期五前回复，我将非常感谢。','不好意思，打扰您了。','麻烦您把窗户关上，可以吗？','谢谢您提前告诉我。','很遗憾地通知您，预约已经取消。','在朋友之间，我们可以说得更直接。','根据情况调整语气很重要。']},
  Portuguese:{icons:['Relato','Causa','Média','Emoção','Sociedade','Cortesia'],
    narrative:['Enquanto voltava para casa, começou a chover.','De repente, todas as luzes se apagaram.','No início, ninguém sabia o que fazer.','Mais tarde, encontrámos uma porta aberta.','Entretanto, a minha irmã telefonou à polícia.','No fim, tudo acabou bem.','Foi então que percebi o meu erro.','Desde então, verifico sempre a porta.'],
    'cause-effect':['A estrada estava fechada, por isso seguimos outro caminho.','Como perdi o autocarro, cheguei atrasado.','O voo foi cancelado devido à tempestade.','Não havia tempo suficiente; por isso fomos embora.','Como resultado, o projeto atrasou-se.','Embora estivesse cansada, terminou o trabalho.','Graças à tua ajuda, resolvemos o problema.','O que causou esta mudança?'],
    media:['O romance conta a história de uma família.','A personagem principal tenta descobrir a verdade.','O enredo começa numa pequena vila.','A minha cena preferida acontece no fim.','O final surpreendeu-me muito.','A realizadora mostra dois pontos de vista.','Recomendo-o porque as personagens parecem reais.','A crítica diz que a história avança devagar.'],
    emotions:['Senti-me aliviado quando ela telefonou.','Ela ficou desiludida com o resultado.','Nós entendemo-nos mal.','Depois, conversámos com calma.','Deves dizer-lhe como te sentes.','Desde então, confiamos mais um no outro.','Às vezes é difícil perdoar.','Aprendi a ouvir antes de responder.'],
    society:['O bairro mudou muito.','Precisamos de mais transportes públicos.','É preciso proteger este parque.','Os vizinhos organizaram uma reunião.','A poluição afeta a nossa saúde.','A câmara anunciou um novo plano.','Quero participar como voluntário.','Todos podemos melhorar a nossa comunidade.'],
    register:['Poderia ajudar-me, por favor?','Agradecia uma resposta antes de sexta-feira.','Peço desculpa pelo incómodo.','Importa-se de fechar a janela?','Obrigado por me avisar com antecedência.','Lamento informar que a marcação foi cancelada.','Entre amigos, podemos falar de forma mais direta.','É importante adaptar o tom à situação.']},
  Arabic:{icons:['قصة','سبب','إعلام','مشاعر','مجتمع','لباقة'],
    narrative:['بينما كنت أعود إلى البيت، بدأ المطر.','فجأة انطفأت كل الأنوار.','في البداية، لم يعرف أحد ماذا يفعل.','لاحقًا، وجدنا بابًا مفتوحًا.','في هذه الأثناء، اتصلت أختي بالشرطة.','في النهاية، انتهى كل شيء على ما يرام.','عندها أدركت خطئي.','ومنذ ذلك الحين، أتحقق دائمًا من الباب.'],
    'cause-effect':['كان الطريق مغلقًا، لذلك سلكنا طريقًا آخر.','لأنني فاتني الحافلة، وصلت متأخرًا.','أُلغيت الرحلة بسبب العاصفة.','لم يكن هناك وقت كافٍ، ولذلك غادرنا.','ونتيجة لذلك، تأخر المشروع.','مع أنها كانت متعبة، أنهت العمل.','بفضل مساعدتك، حللنا المشكلة.','ما الذي سبب هذا التغيير؟'],
    media:['تحكي الرواية قصة عائلة.','تحاول الشخصية الرئيسية اكتشاف الحقيقة.','تبدأ الأحداث في بلدة صغيرة.','يأتي مشهدي المفضل في النهاية.','فاجأتني النهاية كثيرًا.','تعرض المخرجة وجهتي نظر.','أوصي به لأن الشخصيات تبدو حقيقية.','يقول النقد إن القصة تتقدم ببطء.'],
    emotions:['شعرت بالارتياح عندما اتصلت.','كانت محبطة من النتيجة.','أسأنا فهم بعضنا بعضًا.','بعد ذلك تحدثنا بهدوء.','يجب أن تخبره بما تشعر به.','منذ ذلك الحين، نثق ببعضنا أكثر.','أحيانًا يكون التسامح صعبًا.','تعلمت أن أستمع قبل أن أجيب.'],
    society:['تغير الحي كثيرًا.','نحتاج إلى مزيد من وسائل النقل العام.','يجب حماية هذه الحديقة.','نظم الجيران اجتماعًا.','يؤثر التلوث في صحتنا.','أعلنت البلدية خطة جديدة.','أريد المشاركة متطوعًا.','يمكننا جميعًا تحسين مجتمعنا.'],
    register:['هل يمكن أن تساعدني من فضلك؟','سأكون ممتنًا لردك قبل الجمعة.','أعتذر عن الإزعاج.','هل تمانع في إغلاق النافذة؟','شكرًا لإخباري مسبقًا.','يؤسفني إبلاغك بأن الموعد قد أُلغي.','يمكننا التحدث بصورة مباشرة أكثر بين الأصدقاء.','من المهم تكييف نبرة الكلام مع الموقف.']},
});

export const B11_TARGETS=Object.freeze(Object.fromEntries(Object.entries(NEW_TARGETS).map(([language,payload])=>{
  const prior=A22_TARGETS[language];
  const merged={icons:payload.icons};
  for(const theme of B11_THEMES){
    const[source,start]=REUSE[theme.id];
    merged[theme.id]=[...prior[source].slice(start,start+8),...payload[theme.id]];
  }
  return[language,Object.freeze(merged)];
})));

export function validateB11Content(){
  for(const[language,payload]of Object.entries(B11_TARGETS)){
    if(payload.icons.length!==B11_THEMES.length)throw new Error(`${language}: iconos B1.1 incompletos`);
    for(const theme of B11_THEMES){
      if(!Array.isArray(payload[theme.id])||payload[theme.id].length!==16)throw new Error(`${language}/${theme.id}: contenido incompleto`);
      if(new Set(payload[theme.id]).size!==16)throw new Error(`${language}/${theme.id}: duplicados dentro de la unidad`);
    }
  }
  return true;
}
