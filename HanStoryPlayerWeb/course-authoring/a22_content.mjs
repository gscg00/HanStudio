import {A21_TARGETS,A21_THEMES} from './a21_content.mjs';

const priorMeanings=Object.fromEntries(A21_THEMES.map(theme=>[theme.id,theme.meanings]));
const REUSE=Object.freeze({
  opinions:['conversation',0],experiences:['past',8],workStudy:['ability',0],
  technology:['services',0],culture:['comparison',0],problemSolving:['services',8],
});
const NEW_MEANINGS=Object.freeze({
  opinions:['En mi opinión, es una buena idea.','Estoy totalmente de acuerdo.','No estoy seguro de eso.','Prefiero la primera opción.','Me gusta porque es sencillo.','No me gusta, aunque es útil.','¿Tú qué opinas?','Depende de la situación.'],
  experiences:['He visitado tres países.','Nunca he viajado solo.','Ya he probado ese plato.','Todavía no he visto el mar.','Una vez perdí el tren.','Fue la primera vez.','¿Alguna vez has estado allí?','Quiero volver algún día.'],
  workStudy:['Trabajo desde casa dos días.','Estoy estudiando para mi examen.','Mi tarea principal es atender clientes.','Necesito terminar este informe.','Esta lección me resulta difícil.','Quiero mejorar mi escritura.','¿Puedes explicarlo otra vez?','Mi objetivo es cambiar de trabajo.'],
  technology:['No tengo conexión a Internet.','He olvidado mi contraseña.','La pantalla se ha quedado bloqueada.','¿Puedes enviarme el archivo?','Necesito cargar el teléfono.','La aplicación no se abre.','Guarda una copia antes de cerrar.','Ya he solucionado el problema.'],
  culture:['Aquí es costumbre quitarse los zapatos.','La fiesta se celebra en primavera.','En mi país cenamos más tarde.','Esta tradición es importante.','Hay que respetar las normas.','¿Qué se suele hacer aquí?','Me sorprendió esta costumbre.','Las dos culturas tienen algo en común.'],
  problemSolving:['Podemos probar otra solución.','Si llamamos ahora, llegarán pronto.','Yo hablaré con el encargado.','¿Qué opción te parece mejor?','Eso no resolverá el problema.','Necesitamos más información.','Vamos a dividir el trabajo.','Si no funciona, pediremos ayuda.'],
});

export const A22_THEMES=Object.freeze([
  ['opinions','Opiniones y razones','Expresar acuerdo, desacuerdo, causa y preferencia.'],
  ['experiences','Viajes y experiencias','Contar una experiencia y reaccionar a la de otra persona.'],
  ['workStudy','Trabajo y estudio','Describir responsabilidades, objetivos y dificultades.'],
  ['technology','Tecnología y comunicación','Resolver problemas digitales y comunicarte a distancia.'],
  ['culture','Costumbres y cultura','Describir normas sociales, celebraciones y diferencias.'],
  ['problemSolving','Resolver imprevistos','Comprender un problema, proponer y evaluar soluciones.'],
].map(([id,title,objective])=>{
  const[source,start]=REUSE[id];
  return Object.freeze({id,title,objective,meanings:[...priorMeanings[source].slice(start,start+8),...NEW_MEANINGS[id]]});
}));

const NEW_TARGETS=Object.freeze({
  English:{icons:['Think','Been','Work','Online','Custom','Solve'],
    opinions:['In my opinion, it is a good idea.','I completely agree.','I am not sure about that.','I prefer the first option.','I like it because it is simple.','I do not like it, although it is useful.','What do you think?','It depends on the situation.'],
    experiences:['I have visited three countries.','I have never travelled alone.','I have already tried that dish.','I have not seen the sea yet.','I missed the train once.','It was my first time.','Have you ever been there?','I want to go back someday.'],
    workStudy:['I work from home two days a week.','I am studying for my exam.','My main task is helping customers.','I need to finish this report.','I find this lesson difficult.','I want to improve my writing.','Can you explain it again?','My goal is to change jobs.'],
    technology:['I do not have an Internet connection.','I have forgotten my password.','The screen has frozen.','Can you send me the file?','I need to charge my phone.','The app will not open.','Save a copy before closing.','I have already fixed the problem.'],
    culture:['It is customary to take off your shoes here.','The festival is celebrated in spring.','In my country, we eat dinner later.','This tradition is important.','You have to respect the rules.','What do people usually do here?','This custom surprised me.','The two cultures have something in common.'],
    problemSolving:['We can try another solution.','If we call now, they will arrive soon.','I will speak to the manager.','Which option seems better to you?','That will not solve the problem.','We need more information.','Let us divide the work.','If it does not work, we will ask for help.']},
  French:{icons:['Avis','Vécu','Travail','Réseau','Culture','Solution'],
    opinions:['À mon avis, c’est une bonne idée.','Je suis tout à fait d’accord.','Je n’en suis pas sûr.','Je préfère la première option.','Ça me plaît parce que c’est simple.','Je n’aime pas, même si c’est utile.','Qu’est-ce que tu en penses ?','Ça dépend de la situation.'],
    experiences:['J’ai visité trois pays.','Je n’ai jamais voyagé seul.','J’ai déjà goûté ce plat.','Je n’ai pas encore vu la mer.','Une fois, j’ai raté le train.','C’était la première fois.','Tu es déjà allé là-bas ?','Je veux y retourner un jour.'],
    workStudy:['Je travaille chez moi deux jours par semaine.','J’étudie pour mon examen.','Ma tâche principale est d’aider les clients.','Je dois terminer ce rapport.','Je trouve cette leçon difficile.','Je veux améliorer mon écriture.','Tu peux l’expliquer encore une fois ?','Mon objectif est de changer de travail.'],
    technology:['Je n’ai pas de connexion Internet.','J’ai oublié mon mot de passe.','L’écran est bloqué.','Tu peux m’envoyer le fichier ?','Je dois recharger mon téléphone.','L’application ne s’ouvre pas.','Enregistre une copie avant de fermer.','J’ai déjà résolu le problème.'],
    culture:['Ici, on enlève habituellement ses chaussures.','La fête a lieu au printemps.','Dans mon pays, on dîne plus tard.','Cette tradition est importante.','Il faut respecter les règles.','Qu’est-ce qu’on fait habituellement ici ?','Cette coutume m’a surpris.','Les deux cultures ont quelque chose en commun.'],
    problemSolving:['On peut essayer une autre solution.','Si on appelle maintenant, ils arriveront vite.','Je vais parler au responsable.','Quelle option te semble meilleure ?','Ça ne résoudra pas le problème.','Il nous faut plus d’informations.','On va partager le travail.','Si ça ne marche pas, on demandera de l’aide.']},
  German:{icons:['Meinung','Erlebt','Arbeit','Netz','Kultur','Lösung'],
    opinions:['Meiner Meinung nach ist das eine gute Idee.','Ich stimme völlig zu.','Da bin ich mir nicht sicher.','Ich bevorzuge die erste Möglichkeit.','Es gefällt mir, weil es einfach ist.','Es gefällt mir nicht, obwohl es nützlich ist.','Was meinst du dazu?','Das hängt von der Situation ab.'],
    experiences:['Ich habe drei Länder besucht.','Ich bin noch nie allein gereist.','Ich habe dieses Gericht schon probiert.','Ich habe das Meer noch nicht gesehen.','Einmal habe ich den Zug verpasst.','Es war das erste Mal.','Warst du schon einmal dort?','Ich möchte eines Tages zurückkehren.'],
    workStudy:['Ich arbeite zwei Tage pro Woche zu Hause.','Ich lerne für meine Prüfung.','Meine Hauptaufgabe ist die Kundenbetreuung.','Ich muss diesen Bericht fertigstellen.','Diese Lektion fällt mir schwer.','Ich möchte mein Schreiben verbessern.','Kannst du das noch einmal erklären?','Mein Ziel ist es, den Arbeitsplatz zu wechseln.'],
    technology:['Ich habe keine Internetverbindung.','Ich habe mein Passwort vergessen.','Der Bildschirm ist eingefroren.','Kannst du mir die Datei schicken?','Ich muss mein Handy aufladen.','Die App lässt sich nicht öffnen.','Speichere eine Kopie, bevor du schließt.','Ich habe das Problem schon gelöst.'],
    culture:['Hier zieht man normalerweise die Schuhe aus.','Das Fest wird im Frühling gefeiert.','In meinem Land essen wir später zu Abend.','Diese Tradition ist wichtig.','Man muss die Regeln beachten.','Was macht man hier normalerweise?','Dieser Brauch hat mich überrascht.','Die beiden Kulturen haben etwas gemeinsam.'],
    problemSolving:['Wir können eine andere Lösung versuchen.','Wenn wir jetzt anrufen, kommen sie bald.','Ich werde mit dem Verantwortlichen sprechen.','Welche Möglichkeit findest du besser?','Das wird das Problem nicht lösen.','Wir brauchen mehr Informationen.','Teilen wir die Arbeit auf.','Wenn es nicht klappt, bitten wir um Hilfe.']},
  Italian:{icons:['Parere','Vissuto','Lavoro','Rete','Cultura','Soluzione'],
    opinions:['Secondo me, è una buona idea.','Sono completamente d’accordo.','Non ne sono sicuro.','Preferisco la prima opzione.','Mi piace perché è semplice.','Non mi piace, anche se è utile.','Tu che cosa ne pensi?','Dipende dalla situazione.'],
    experiences:['Ho visitato tre paesi.','Non ho mai viaggiato da solo.','Ho già assaggiato quel piatto.','Non ho ancora visto il mare.','Una volta ho perso il treno.','Era la prima volta.','Sei mai stato lì?','Voglio tornarci un giorno.'],
    workStudy:['Lavoro da casa due giorni alla settimana.','Studio per il mio esame.','Il mio compito principale è assistere i clienti.','Devo finire questa relazione.','Questa lezione mi sembra difficile.','Voglio migliorare la mia scrittura.','Puoi spiegarlo di nuovo?','Il mio obiettivo è cambiare lavoro.'],
    technology:['Non ho una connessione Internet.','Ho dimenticato la password.','Lo schermo si è bloccato.','Puoi mandarmi il file?','Devo caricare il telefono.','L’applicazione non si apre.','Salva una copia prima di chiudere.','Ho già risolto il problema.'],
    culture:['Qui è normale togliersi le scarpe.','La festa si celebra in primavera.','Nel mio paese ceniamo più tardi.','Questa tradizione è importante.','Bisogna rispettare le regole.','Che cosa si fa di solito qui?','Questa usanza mi ha sorpreso.','Le due culture hanno qualcosa in comune.'],
    problemSolving:['Possiamo provare un’altra soluzione.','Se chiamiamo ora, arriveranno presto.','Parlerò con il responsabile.','Quale opzione ti sembra migliore?','Questo non risolverà il problema.','Abbiamo bisogno di più informazioni.','Dividiamo il lavoro.','Se non funziona, chiederemo aiuto.']},
  Russian:{icons:['Мнение','Опыт','Работа','Сеть','Обычай','Решение'],
    opinions:['По-моему, это хорошая идея.','Я полностью согласен.','Я в этом не уверен.','Я предпочитаю первый вариант.','Мне это нравится, потому что это просто.','Мне это не нравится, хотя это полезно.','А ты как думаешь?','Это зависит от ситуации.'],
    experiences:['Я посетил три страны.','Я никогда не путешествовал один.','Я уже пробовал это блюдо.','Я ещё не видел море.','Однажды я опоздал на поезд.','Это было в первый раз.','Ты когда-нибудь там был?','Я хочу когда-нибудь туда вернуться.'],
    workStudy:['Я работаю дома два дня в неделю.','Я готовлюсь к экзамену.','Моя главная задача — помогать клиентам.','Мне нужно закончить этот отчёт.','Этот урок кажется мне трудным.','Я хочу лучше писать.','Можешь объяснить это ещё раз?','Моя цель — сменить работу.'],
    technology:['У меня нет подключения к Интернету.','Я забыл пароль.','Экран завис.','Можешь отправить мне файл?','Мне нужно зарядить телефон.','Приложение не открывается.','Сохрани копию перед закрытием.','Я уже решил проблему.'],
    culture:['Здесь принято снимать обувь.','Праздник отмечают весной.','В моей стране мы ужинаем позже.','Эта традиция важна.','Нужно уважать правила.','Что здесь обычно делают?','Этот обычай меня удивил.','У двух культур есть что-то общее.'],
    problemSolving:['Мы можем попробовать другое решение.','Если мы позвоним сейчас, они скоро приедут.','Я поговорю с ответственным.','Какой вариант тебе кажется лучше?','Это не решит проблему.','Нам нужно больше информации.','Давайте разделим работу.','Если не получится, попросим помощи.']},
  Korean:{icons:['의견','경험','업무','연결','문화','해결'],
    opinions:['제 생각에는 좋은 생각이에요.','저도 완전히 동의해요.','그건 잘 모르겠어요.','첫 번째 선택이 더 좋아요.','간단해서 마음에 들어요.','유용하지만 마음에 들지 않아요.','어떻게 생각해요?','상황에 따라 달라요.'],
    experiences:['세 나라를 방문한 적이 있어요.','혼자 여행한 적이 없어요.','그 음식을 이미 먹어 봤어요.','아직 바다를 보지 못했어요.','한 번 기차를 놓친 적이 있어요.','처음이었어요.','거기에 가 본 적이 있어요?','언젠가 다시 가고 싶어요.'],
    workStudy:['일주일에 이틀은 집에서 일해요.','시험을 위해 공부하고 있어요.','주요 업무는 고객을 돕는 일이에요.','이 보고서를 끝내야 해요.','이 수업은 어려운 것 같아요.','글쓰기 실력을 향상하고 싶어요.','다시 설명해 줄 수 있어요?','제 목표는 직장을 바꾸는 거예요.'],
    technology:['인터넷에 연결되지 않아요.','비밀번호를 잊어버렸어요.','화면이 멈췄어요.','파일을 보내 줄 수 있어요?','휴대전화를 충전해야 해요.','앱이 열리지 않아요.','닫기 전에 복사본을 저장하세요.','문제를 이미 해결했어요.'],
    culture:['여기에서는 신발을 벗는 것이 관습이에요.','축제는 봄에 열려요.','우리 나라에서는 저녁을 더 늦게 먹어요.','이 전통은 중요해요.','규칙을 존중해야 해요.','여기에서는 보통 무엇을 해요?','이 관습이 놀라웠어요.','두 문화에는 공통점이 있어요.'],
    problemSolving:['다른 해결책을 시도해 볼 수 있어요.','지금 전화하면 곧 올 거예요.','제가 담당자와 이야기할게요.','어떤 선택이 더 좋아 보여요?','그것으로는 문제가 해결되지 않을 거예요.','더 많은 정보가 필요해요.','일을 나눠서 해요.','안 되면 도움을 요청할게요.']},
  Japanese:{icons:['意見','経験','仕事','通信','文化','解決'],
    opinions:['私の意見では、いい考えです。','まったく同感です。','それはよく分かりません。','最初の選択肢のほうがいいです。','簡単なので気に入っています。','役に立ちますが、好きではありません。','どう思いますか。','状況によります。'],
    experiences:['三つの国を訪れたことがあります。','一人で旅行したことがありません。','その料理はもう食べたことがあります。','まだ海を見たことがありません。','一度、電車に乗り遅れました。','初めてでした。','そこへ行ったことがありますか。','いつかまた行きたいです。'],
    workStudy:['週に二日は家で働きます。','試験のために勉強しています。','主な仕事はお客様を手伝うことです。','この報告書を終えなければなりません。','この授業は難しいと思います。','文章を書く力を伸ばしたいです。','もう一度説明してもらえますか。','目標は仕事を変えることです。'],
    technology:['インターネットにつながりません。','パスワードを忘れました。','画面が動かなくなりました。','ファイルを送ってもらえますか。','携帯電話を充電する必要があります。','アプリが開きません。','閉じる前にコピーを保存してください。','もう問題を解決しました。'],
    culture:['ここでは靴を脱ぐ習慣があります。','祭りは春に行われます。','私の国ではもっと遅く夕食を食べます。','この伝統は大切です。','規則を守らなければなりません。','ここでは普通、何をしますか。','この習慣には驚きました。','二つの文化には共通点があります。'],
    problemSolving:['別の解決方法を試すことができます。','今電話すれば、すぐ来るでしょう。','私が責任者と話します。','どの選択肢がいいと思いますか。','それでは問題は解決しません。','もっと情報が必要です。','仕事を分けましょう。','うまくいかなければ、助けを頼みます。']},
  Chinese:{icons:['意见','经验','工作','网络','文化','解决'],
    opinions:['我觉得这是一个好主意。','我完全同意。','我不太确定。','我更喜欢第一个选择。','我喜欢它，因为很简单。','虽然有用，但是我不喜欢。','你觉得怎么样？','要看情况。'],
    experiences:['我去过三个国家。','我从来没有一个人旅行过。','我已经吃过那道菜了。','我还没见过大海。','有一次我没赶上火车。','那是第一次。','你去过那里吗？','我希望有一天再去。'],
    workStudy:['我每周在家工作两天。','我在准备考试。','我的主要工作是帮助顾客。','我得完成这份报告。','我觉得这节课很难。','我想提高写作水平。','你能再解释一次吗？','我的目标是换工作。'],
    technology:['我没有网络连接。','我忘记密码了。','屏幕卡住了。','你能把文件发给我吗？','我得给手机充电。','应用打不开。','关闭以前保存一个副本。','我已经解决了这个问题。'],
    culture:['这里有脱鞋的习惯。','这个节日在春天庆祝。','在我的国家，我们吃晚饭更晚。','这个传统很重要。','应该遵守规定。','这里通常做什么？','这个习惯让我很惊讶。','两种文化有共同点。'],
    problemSolving:['我们可以试试别的办法。','如果现在打电话，他们很快就会来。','我来跟负责人谈。','你觉得哪个选择更好？','那不能解决问题。','我们需要更多信息。','我们把工作分开做吧。','如果不行，我们就请人帮忙。']},
  Portuguese:{icons:['Opinião','Experiência','Trabalho','Rede','Cultura','Solução'],
    opinions:['Na minha opinião, é uma boa ideia.','Concordo completamente.','Não tenho a certeza disso.','Prefiro a primeira opção.','Gosto porque é simples.','Não gosto, embora seja útil.','O que achas?','Depende da situação.'],
    experiences:['Já visitei três países.','Nunca viajei sozinho.','Já provei esse prato.','Ainda não vi o mar.','Uma vez perdi o comboio.','Foi a primeira vez.','Já estiveste lá?','Quero voltar um dia.'],
    workStudy:['Trabalho em casa dois dias por semana.','Estou a estudar para o exame.','A minha principal tarefa é ajudar os clientes.','Preciso de terminar este relatório.','Esta lição parece-me difícil.','Quero melhorar a minha escrita.','Podes explicar outra vez?','O meu objetivo é mudar de trabalho.'],
    technology:['Não tenho ligação à Internet.','Esqueci-me da palavra-passe.','O ecrã ficou bloqueado.','Podes enviar-me o ficheiro?','Preciso de carregar o telefone.','A aplicação não abre.','Guarda uma cópia antes de fechar.','Já resolvi o problema.'],
    culture:['Aqui é costume tirar os sapatos.','A festa celebra-se na primavera.','No meu país, jantamos mais tarde.','Esta tradição é importante.','É preciso respeitar as regras.','O que se costuma fazer aqui?','Este costume surpreendeu-me.','As duas culturas têm algo em comum.'],
    problemSolving:['Podemos tentar outra solução.','Se telefonarmos agora, chegam depressa.','Vou falar com o responsável.','Qual opção te parece melhor?','Isso não vai resolver o problema.','Precisamos de mais informações.','Vamos dividir o trabalho.','Se não funcionar, pedimos ajuda.']},
  Arabic:{icons:['رأي','تجربة','عمل','شبكة','ثقافة','حل'],
    opinions:['في رأيي، هذه فكرة جيدة.','أوافق تمامًا.','لست متأكدًا من ذلك.','أفضل الخيار الأول.','أعجبني لأنه بسيط.','لا يعجبني رغم أنه مفيد.','ما رأيك؟','يعتمد ذلك على الموقف.'],
    experiences:['زرت ثلاثة بلدان.','لم أسافر وحدي من قبل.','لقد جربت ذلك الطبق بالفعل.','لم أر البحر بعد.','فاتني القطار مرة.','كانت المرة الأولى.','هل سبق أن ذهبت إلى هناك؟','أريد العودة يومًا ما.'],
    workStudy:['أعمل من المنزل يومين في الأسبوع.','أدرس من أجل امتحاني.','مهمتي الأساسية هي مساعدة العملاء.','يجب أن أنهي هذا التقرير.','أجد هذا الدرس صعبًا.','أريد تحسين كتابتي.','هل يمكنك شرحه مرة أخرى؟','هدفي هو تغيير عملي.'],
    technology:['ليس لدي اتصال بالإنترنت.','نسيت كلمة المرور.','توقفت الشاشة عن العمل.','هل يمكنك إرسال الملف إلي؟','أحتاج إلى شحن هاتفي.','التطبيق لا يفتح.','احفظ نسخة قبل الإغلاق.','لقد حللت المشكلة بالفعل.'],
    culture:['من المعتاد خلع الأحذية هنا.','يُحتفل بالمهرجان في الربيع.','في بلدي نتناول العشاء في وقت متأخر.','هذا التقليد مهم.','يجب احترام القواعد.','ماذا يفعل الناس عادة هنا؟','فاجأتني هذه العادة.','للثقافتين شيء مشترك.'],
    problemSolving:['يمكننا تجربة حل آخر.','إذا اتصلنا الآن فسيصلون قريبًا.','سأتحدث مع المسؤول.','أي خيار يبدو أفضل لك؟','هذا لن يحل المشكلة.','نحتاج إلى مزيد من المعلومات.','لنقسم العمل.','إذا لم ينجح، سنطلب المساعدة.']},
});

export const A22_TARGETS=Object.freeze(Object.fromEntries(Object.entries(NEW_TARGETS).map(([language,payload])=>{
  const prior=A21_TARGETS[language];
  const merged={icons:payload.icons};
  for(const theme of A22_THEMES){
    const[source,start]=REUSE[theme.id];
    merged[theme.id]=[...prior[source].slice(start,start+8),...payload[theme.id]];
  }
  return[language,Object.freeze(merged)];
})));

export function validateA22Content(){
  for(const[language,payload]of Object.entries(A22_TARGETS)){
    if(payload.icons.length!==A22_THEMES.length)throw new Error(`${language}: iconos A2.2 incompletos`);
    for(const theme of A22_THEMES){
      if(!Array.isArray(payload[theme.id])||payload[theme.id].length!==16)throw new Error(`${language}/${theme.id}: contenido incompleto`);
      if(new Set(payload[theme.id]).size!==16)throw new Error(`${language}/${theme.id}: duplicados dentro de la unidad`);
    }
  }
  return true;
}
