// Contenido editorial A1.2. Mantiene un inventario semántico común para que
// los diez cursos enseñen la misma autonomía cotidiana sin traducir palabra
// por palabra ni recurrir a transcripciones latinas en CJK.

export const A12_THEMES=Object.freeze([
  {
    id:"shopping",title:"Compras y precios",objective:"Preguntar precios, elegir una variante y completar un pago.",
    meanings:["precio","dinero","talla","barato","caro","efectivo","tarjeta","probador","¿Cuánto cuesta esto?","Necesito una talla más grande.","¿Lo tiene en azul?","Me lo llevo.","¿Puedo pagar con tarjeta?","Solo tengo efectivo.","¿Dónde está el probador?","Es demasiado caro."],
  },
  {
    id:"time",title:"Fechas, horas y citas",objective:"Hablar de días y horas y concertar un encuentro.",
    meanings:["hoy","mañana","ayer","lunes","semana","mes","temprano","tarde","¿Qué hora es?","Son las tres y media.","Quedemos mañana.","Estoy libre el lunes.","Llego a las ocho.","La cita es la próxima semana.","Llego tarde.","Nos vemos el viernes."],
  },
  {
    id:"transport",title:"Transporte y trayectos",objective:"Comprar un billete, seguir una ruta y entender cambios o retrasos.",
    meanings:["billete","tren","autobús","metro","andén","parada","aeropuerto","destino","Un billete, por favor.","¿Cuándo sale el tren?","¿Este autobús va al centro?","¿Cuál es la próxima parada?","¿Tengo que hacer transbordo?","El tren lleva retraso.","Me bajo aquí.","¿Cuánto dura el viaje?"],
  },
  {
    id:"health",title:"Cuerpo y necesidades",objective:"Describir síntomas sencillos, comprender indicaciones y pedir ayuda.",
    meanings:["cabeza","estómago","garganta","fiebre","medicina","farmacia","médico","ayuda","Me duele la cabeza.","Tengo fiebre desde ayer.","Necesito un médico.","¿Dónde hay una farmacia?","Tengo alergia a la penicilina.","Tome esto dos veces al día.","Me siento mejor.","Llame a una ambulancia."],
  },
  {
    id:"weather",title:"Clima y ropa",objective:"Comprender el pronóstico y elegir ropa adecuada.",
    meanings:["sol","lluvia","nieve","viento","calor","frío","abrigo","paraguas","Hoy hace sol.","Mañana va a llover.","Hace mucho frío.","Lleva un paraguas.","Necesito un abrigo.","El tiempo cambia rápido.","Hay diez grados.","¿Qué tiempo hará el fin de semana?"],
  },
  {
    id:"social",title:"Invitaciones y planes",objective:"Invitar, aceptar, rechazar y acordar los detalles de un plan.",
    meanings:["fiesta","invitación","plan","hora","lugar","amigo","fin de semana","mensaje","¿Quieres venir?","Sí, con mucho gusto.","Lo siento, no puedo.","¿Cuándo quedamos?","¿Dónde quedamos?","Estoy libre después de las seis.","¿Puedo traer a un amigo?","Envíame la dirección."],
  },
]);

export const A12_TARGETS=Object.freeze({
  English:{
    icons:["$","Time","Bus","Help","Sun","Meet"],
    shopping:["price","money","size","cheap","expensive","cash","card","fitting room","How much is this?","I need a larger size.","Do you have this in blue?","I’ll take it.","Can I pay by card?","I only have cash.","Where is the fitting room?","It is too expensive."],
    time:["today","tomorrow","yesterday","Monday","week","month","early","late","What time is it?","It is half past three.","Let’s meet tomorrow.","I am free on Monday.","I arrive at eight.","The appointment is next week.","I am running late.","See you on Friday."],
    transport:["ticket","train","bus","subway","platform","stop","airport","destination","One ticket, please.","When does the train leave?","Does this bus go downtown?","What is the next stop?","Do I need to change?","The train is delayed.","I am getting off here.","How long does the trip take?"],
    health:["head","stomach","throat","fever","medicine","pharmacy","doctor","help","My head hurts.","I have had a fever since yesterday.","I need a doctor.","Where is there a pharmacy?","I am allergic to penicillin.","Take this twice a day.","I feel better.","Call an ambulance."],
    weather:["sun","rain","snow","wind","heat","cold","coat","umbrella","It is sunny today.","It is going to rain tomorrow.","It is very cold.","Take an umbrella.","I need a coat.","The weather changes quickly.","It is ten degrees.","What will the weather be like this weekend?"],
    social:["party","invitation","plan","time","place","friend","weekend","message","Do you want to come?","Yes, I’d love to.","Sorry, I can’t.","When shall we meet?","Where shall we meet?","I am free after six.","Can I bring a friend?","Send me the address."],
  },
  French:{
    icons:["€","Heure","Bus","Aide","Soleil","Rdv"],
    shopping:["prix","argent","taille","bon marché","cher","espèces","carte","cabine d’essayage","Combien ça coûte ?","J’ai besoin d’une taille au-dessus.","Vous l’avez en bleu ?","Je le prends.","Je peux payer par carte ?","Je n’ai que des espèces.","Où est la cabine d’essayage ?","C’est trop cher."],
    time:["aujourd’hui","demain","hier","lundi","semaine","mois","tôt","tard","Quelle heure est-il ?","Il est trois heures et demie.","On se retrouve demain.","Je suis libre lundi.","J’arrive à huit heures.","Le rendez-vous est la semaine prochaine.","Je suis en retard.","À vendredi."],
    transport:["billet","train","bus","métro","quai","arrêt","aéroport","destination","Un billet, s’il vous plaît.","Quand part le train ?","Ce bus va-t-il au centre-ville ?","Quel est le prochain arrêt ?","Dois-je changer ?","Le train est en retard.","Je descends ici.","Combien de temps dure le trajet ?"],
    health:["tête","ventre","gorge","fièvre","médicament","pharmacie","médecin","aide","J’ai mal à la tête.","J’ai de la fièvre depuis hier.","J’ai besoin d’un médecin.","Où y a-t-il une pharmacie ?","Je suis allergique à la pénicilline.","Prenez ceci deux fois par jour.","Je me sens mieux.","Appelez une ambulance."],
    weather:["soleil","pluie","neige","vent","chaleur","froid","manteau","parapluie","Il y a du soleil aujourd’hui.","Il va pleuvoir demain.","Il fait très froid.","Prenez un parapluie.","J’ai besoin d’un manteau.","Le temps change vite.","Il fait dix degrés.","Quel temps fera-t-il ce week-end ?"],
    social:["fête","invitation","projet","heure","endroit","ami","week-end","message","Tu veux venir ?","Oui, avec plaisir.","Je regrette, je ne peux pas.","On se retrouve quand ?","On se retrouve où ?","Je suis libre après six heures.","Je peux venir avec un ami ?","Envoie-moi l’adresse."],
  },
  German:{
    icons:["€","Uhr","Zug","Hilfe","Sonne","Treff"],
    shopping:["Preis","Geld","Größe","günstig","teuer","Bargeld","Karte","Umkleidekabine","Wie viel kostet das?","Ich brauche eine größere Größe.","Haben Sie das in Blau?","Ich nehme es.","Kann ich mit Karte zahlen?","Ich habe nur Bargeld.","Wo ist die Umkleidekabine?","Das ist zu teuer."],
    time:["heute","morgen","gestern","Montag","Woche","Monat","früh","spät","Wie spät ist es?","Es ist halb vier.","Treffen wir uns morgen.","Ich habe am Montag Zeit.","Ich komme um acht Uhr an.","Der Termin ist nächste Woche.","Ich komme zu spät.","Bis Freitag."],
    transport:["Fahrkarte","Zug","Bus","U-Bahn","Bahnsteig","Haltestelle","Flughafen","Ziel","Eine Fahrkarte, bitte.","Wann fährt der Zug ab?","Fährt dieser Bus ins Stadtzentrum?","Was ist die nächste Haltestelle?","Muss ich umsteigen?","Der Zug hat Verspätung.","Ich steige hier aus.","Wie lange dauert die Fahrt?"],
    health:["Kopf","Bauch","Hals","Fieber","Medizin","Apotheke","Arzt","Hilfe","Ich habe Kopfschmerzen.","Ich habe seit gestern Fieber.","Ich brauche einen Arzt.","Wo ist eine Apotheke?","Ich bin allergisch gegen Penicillin.","Nehmen Sie das zweimal täglich.","Mir geht es besser.","Rufen Sie einen Krankenwagen."],
    weather:["Sonne","Regen","Schnee","Wind","Hitze","Kälte","Mantel","Regenschirm","Heute ist es sonnig.","Morgen regnet es.","Es ist sehr kalt.","Nehmen Sie einen Regenschirm mit.","Ich brauche einen Mantel.","Das Wetter ändert sich schnell.","Es sind zehn Grad.","Wie wird das Wetter am Wochenende?"],
    social:["Party","Einladung","Plan","Uhrzeit","Ort","Freund","Wochenende","Nachricht","Möchtest du kommen?","Ja, sehr gern.","Tut mir leid, ich kann nicht.","Wann treffen wir uns?","Wo treffen wir uns?","Ich habe nach sechs Uhr Zeit.","Kann ich einen Freund mitbringen?","Schick mir die Adresse."],
  },
  Italian:{
    icons:["€","Ora","Treno","Aiuto","Sole","Insieme"],
    shopping:["prezzo","denaro","taglia","economico","costoso","contanti","carta","camerino","Quanto costa questo?","Mi serve una taglia più grande.","Ce l’ha in blu?","Lo prendo.","Posso pagare con la carta?","Ho solo contanti.","Dov’è il camerino?","È troppo costoso."],
    time:["oggi","domani","ieri","lunedì","settimana","mese","presto","tardi","Che ore sono?","Sono le tre e mezza.","Vediamoci domani.","Lunedì ho tempo.","Arrivo alle otto.","L’appuntamento è la prossima settimana.","Arrivo tardi.","Ci vediamo venerdì."],
    transport:["biglietto","treno","autobus","metropolitana","binario","fermata","aeroporto","destinazione","Un biglietto, per favore.","Quando parte il treno?","Questo autobus va in centro?","Qual è la prossima fermata?","Devo cambiare?","Il treno è in ritardo.","Scendo qui.","Quanto dura il viaggio?"],
    health:["testa","stomaco","gola","febbre","medicina","farmacia","medico","aiuto","Mi fa male la testa.","Ho la febbre da ieri.","Ho bisogno di un medico.","Dov’è una farmacia?","Ho un’allergia alla penicillina.","Prenda questo due volte al giorno.","Mi sento meglio.","Chiami un’ambulanza."],
    weather:["sole","pioggia","neve","vento","caldo","freddo","cappotto","ombrello","Oggi c’è il sole.","Domani pioverà.","Fa molto freddo.","Porta un ombrello.","Ho bisogno di un cappotto.","Il tempo cambia rapidamente.","Ci sono dieci gradi.","Che tempo farà nel fine settimana?"],
    social:["festa","invito","piano","ora","luogo","amico","fine settimana","messaggio","Vuoi venire?","Sì, volentieri.","Mi dispiace, non posso.","Quando ci vediamo?","Dove ci vediamo?","Ho tempo dopo le sei.","Posso portare un amico?","Mandami l’indirizzo."],
  },
  Russian:{
    icons:["₽","Час","Поезд","Врач","Солнце","Вместе"],
    shopping:["цена","деньги","размер","дешёвый","дорогой","наличные","карта","примерочная","Сколько это стоит?","Мне нужен размер побольше.","У вас есть это в синем цвете?","Я беру.","Можно оплатить картой?","У меня только наличные.","Где примерочная?","Это слишком дорого."],
    time:["сегодня","завтра","вчера","понедельник","неделя","месяц","рано","поздно","Который час?","Сейчас половина четвёртого.","Давайте встретимся завтра.","В понедельник у меня есть время.","Я приеду в восемь.","Встреча на следующей неделе.","Я опаздываю.","Увидимся в пятницу."],
    transport:["билет","поезд","автобус","метро","платформа","остановка","аэропорт","пункт назначения","Один билет, пожалуйста.","Когда отправляется поезд?","Этот автобус идёт в центр?","Какая следующая остановка?","Мне нужно сделать пересадку?","Поезд задерживается.","Я выхожу здесь.","Сколько длится поездка?"],
    health:["голова","живот","горло","температура","лекарство","аптека","врач","помощь","У меня болит голова.","У меня температура со вчерашнего дня.","Мне нужен врач.","Где есть аптека?","У меня аллергия на пенициллин.","Принимайте это два раза в день.","Мне лучше.","Вызовите скорую помощь."],
    weather:["солнце","дождь","снег","ветер","жара","холод","пальто","зонт","Сегодня солнечно.","Завтра будет дождь.","Очень холодно.","Возьмите зонт.","Мне нужно пальто.","Погода быстро меняется.","Сейчас десять градусов.","Какая погода будет на выходных?"],
    social:["вечеринка","приглашение","план","время","место","друг","выходные","сообщение","Хочешь прийти?","Да, с удовольствием.","Извини, я не могу.","Когда встретимся?","Где встретимся?","У меня есть время после шести.","Можно привести друга?","Пришли мне адрес."],
  },
  Korean:{
    icons:["원","시","버스","도움","해","만남"],
    shopping:["가격","돈","사이즈","싸다","비싸다","현금","카드","탈의실","이거 얼마예요?","더 큰 사이즈가 필요해요.","파란색도 있어요?","이걸로 할게요.","카드로 결제할 수 있어요?","현금만 있어요.","탈의실이 어디예요?","너무 비싸요."],
    time:["오늘","내일","어제","월요일","주","달","일찍","늦게","지금 몇 시예요?","세 시 반이에요.","내일 만나요.","월요일에 시간이 있어요.","여덟 시에 도착해요.","약속은 다음 주예요.","늦을 것 같아요.","금요일에 봐요."],
    transport:["표","기차","버스","지하철","승강장","정류장","공항","목적지","표 한 장 주세요.","기차가 언제 출발해요?","이 버스는 시내에 가요?","다음 정류장은 어디예요?","갈아타야 해요?","기차가 지연됐어요.","여기에서 내려요.","얼마나 걸려요?"],
    health:["머리","배","목","열","약","약국","의사","도움","머리가 아파요.","어제부터 열이 있어요.","의사가 필요해요.","약국이 어디에 있어요?","페니실린 알레르기가 있어요.","이 약을 하루에 두 번 드세요.","몸이 좀 나아졌어요.","구급차를 불러 주세요."],
    weather:["해","비","눈","바람","더위","추위","코트","우산","오늘은 맑아요.","내일 비가 올 거예요.","아주 추워요.","우산을 가져가세요.","코트가 필요해요.","날씨가 빨리 변해요.","십 도예요.","주말 날씨는 어때요?"],
    social:["파티","초대","계획","시간","장소","친구","주말","메시지","올래요?","네, 좋아요.","미안하지만 못 가요.","언제 만날까요?","어디에서 만날까요?","여섯 시 이후에 시간이 있어요.","친구를 데려가도 돼요?","주소를 보내 주세요."],
  },
  Japanese:{
    icons:["円","時","電車","助","晴","会"],
    shopping:["値段","お金","サイズ","安い","高い","現金","カード","試着室","これはいくらですか。","もっと大きいサイズが必要です。","青色はありますか。","これにします。","カードで払えますか。","現金しかありません。","試着室はどこですか。","高すぎます。"],
    time:["今日","明日","昨日","月曜日","週","月","早く","遅く","今何時ですか。","三時半です。","明日会いましょう。","月曜日は時間があります。","八時に着きます。","約束は来週です。","遅れます。","金曜日に会いましょう。"],
    transport:["切符","電車","バス","地下鉄","ホーム","停留所","空港","目的地","切符を一枚ください。","電車はいつ出ますか。","このバスは市内へ行きますか。","次の停留所はどこですか。","乗り換えが必要ですか。","電車が遅れています。","ここで降ります。","どのくらいかかりますか。"],
    health:["頭","お腹","喉","熱","薬","薬局","医者","助け","頭が痛いです。","昨日から熱があります。","医者が必要です。","薬局はどこですか。","ペニシリンアレルギーがあります。","この薬を一日二回飲んでください。","よくなりました。","救急車を呼んでください。"],
    weather:["太陽","雨","雪","風","暑さ","寒さ","コート","傘","今日は晴れです。","明日は雨が降ります。","とても寒いです。","傘を持っていってください。","コートが必要です。","天気はすぐ変わります。","十度です。","週末の天気はどうですか。"],
    social:["パーティー","招待","予定","時間","場所","友達","週末","メッセージ","来ませんか。","はい、喜んで。","すみません、行けません。","いつ会いますか。","どこで会いますか。","六時以降は時間があります。","友達を連れてきてもいいですか。","住所を送ってください。"],
  },
  Chinese:{
    icons:["元","时","车","医","晴","约"],
    shopping:["价格","钱","尺码","便宜","贵","现金","卡","试衣间","这个多少钱？","我需要大一点的尺码。","有蓝色的吗？","我要这个。","可以刷卡吗？","我只有现金。","试衣间在哪里？","太贵了。"],
    time:["今天","明天","昨天","星期一","星期","月","早","晚","现在几点？","现在三点半。","我们明天见吧。","我星期一有空。","我八点到。","约会在下个星期。","我迟到了。","星期五见。"],
    transport:["票","火车","公共汽车","地铁","站台","公交站","机场","目的地","一张票，谢谢。","火车什么时候出发？","这辆公共汽车去市中心吗？","下一站是什么？","需要换乘吗？","火车晚点了。","我在这里下车。","要多长时间？"],
    health:["头","肚子","喉咙","发烧","药","药店","医生","帮助","我头疼。","我从昨天开始发烧。","我需要看医生。","哪里有药店？","我对青霉素过敏。","这个药一天吃两次。","我感觉好多了。","请叫救护车。"],
    weather:["太阳","雨","雪","风","热","冷","外套","雨伞","今天是晴天。","明天会下雨。","天气很冷。","带一把雨伞。","我要一件外套。","天气变化很快。","现在十度。","周末天气怎么样？"],
    social:["聚会","邀请","计划","时间","地方","朋友","周末","消息","你想来吗？","好啊，我很愿意。","对不起，我不能来。","我们什么时候见？","我们在哪里见？","我六点以后有空。","可以带一个朋友来吗？","把地址发给我。"],
  },
  Portuguese:{
    icons:["€","Hora","Comboio","Ajuda","Sol","Encontro"],
    shopping:["preço","dinheiro","tamanho","barato","caro","numerário","cartão","provador","Quanto custa isto?","Preciso de um tamanho maior.","Tem isto em azul?","Levo.","Posso pagar com cartão?","Só tenho dinheiro.","Onde fica o provador?","É demasiado caro."],
    time:["hoje","amanhã","ontem","segunda-feira","semana","mês","cedo","tarde","Que horas são?","São três e meia.","Encontramo-nos amanhã.","Tenho tempo na segunda-feira.","Chego às oito.","O compromisso é na próxima semana.","Chego tarde.","Até sexta-feira."],
    transport:["bilhete","comboio","autocarro","metro","plataforma","paragem","aeroporto","destino","Um bilhete, por favor.","Quando parte o comboio?","Este autocarro vai para o centro?","Qual é a próxima paragem?","Tenho de mudar?","O comboio está atrasado.","Saio aqui.","Quanto tempo dura a viagem?"],
    health:["cabeça","estômago","garganta","febre","medicamento","farmácia","médico","ajuda","Dói-me a cabeça.","Tenho febre desde ontem.","Preciso de um médico.","Onde há uma farmácia?","Tenho alergia à penicilina.","Tome isto duas vezes por dia.","Sinto-me melhor.","Chame uma ambulância."],
    weather:["sol","chuva","neve","vento","calor","frio","casaco","guarda-chuva","Hoje está sol.","Amanhã vai chover.","Está muito frio.","Leve um guarda-chuva.","Preciso de um casaco.","O tempo muda depressa.","Estão dez graus.","Como vai estar o tempo no fim de semana?"],
    social:["festa","convite","plano","hora","lugar","amigo","fim de semana","mensagem","Queres vir?","Sim, com muito gosto.","Desculpa, não posso.","Quando nos encontramos?","Onde nos encontramos?","Tenho tempo depois das seis.","Posso levar um amigo?","Envia-me a morada."],
  },
  Arabic:{
    icons:["مال","وقت","قطار","طب","شمس","لقاء"],
    shopping:["سعر","مال","مقاس","رخيص","غالٍ","نقد","بطاقة","غرفة القياس","كم سعر هذا؟","أحتاج إلى مقاس أكبر.","هل يوجد هذا باللون الأزرق؟","سآخذه.","هل يمكنني الدفع بالبطاقة؟","لدي نقد فقط.","أين غرفة القياس؟","هذا غالٍ جدًا."],
    time:["اليوم","غدًا","أمس","الاثنين","أسبوع","شهر","مبكرًا","متأخرًا","كم الساعة؟","الساعة الثالثة والنصف.","لنلتقِ غدًا.","لدي وقت يوم الاثنين.","أصل في الثامنة.","الموعد الأسبوع القادم.","سأتأخر.","أراك يوم الجمعة."],
    transport:["تذكرة","قطار","حافلة","مترو","رصيف","محطة","مطار","وجهة","تذكرة واحدة، من فضلك.","متى يغادر القطار؟","هل تذهب هذه الحافلة إلى وسط المدينة؟","ما المحطة القادمة؟","هل يجب أن أغيّر وسيلة النقل؟","القطار متأخر.","سأنزل هنا.","كم تستغرق الرحلة؟"],
    health:["رأس","معدة","حلق","حمى","دواء","صيدلية","طبيب","مساعدة","رأسي يؤلمني.","لدي حمى منذ أمس.","أحتاج إلى طبيب.","أين توجد صيدلية؟","لدي حساسية من البنسلين.","يؤخذ هذا مرتين في اليوم.","أشعر بتحسن.","اتصل بسيارة الإسعاف."],
    weather:["شمس","مطر","ثلج","رياح","حر","برد","معطف","مظلة","الجو مشمس اليوم.","ستمطر غدًا.","الجو بارد جدًا.","خذ مظلة.","أحتاج إلى معطف.","يتغير الطقس بسرعة.","الحرارة عشر درجات.","كيف سيكون الطقس في عطلة نهاية الأسبوع؟"],
    social:["حفلة","دعوة","خطة","وقت","مكان","صديق","عطلة نهاية الأسبوع","رسالة","هل تريد أن تأتي؟","نعم، بكل سرور.","للأسف، لا أستطيع.","متى نلتقي؟","أين نلتقي؟","لدي وقت بعد السادسة.","هل يمكنني إحضار صديق؟","أرسل لي العنوان."],
  },
});

export function validateA12Content(){
  for(const[language,payload]of Object.entries(A12_TARGETS)){
    if(!Array.isArray(payload.icons)||payload.icons.length!==A12_THEMES.length)throw new Error(`${language}: iconos A1.2 incompletos`);
    for(const theme of A12_THEMES){
      if(!Array.isArray(payload[theme.id])||payload[theme.id].length!==theme.meanings.length)throw new Error(`${language}/${theme.id}: se esperaban ${theme.meanings.length} contenidos`);
      if(payload[theme.id].some(value=>!String(value).trim()))throw new Error(`${language}/${theme.id}: texto vacío`);
    }
  }
  return true;
}
