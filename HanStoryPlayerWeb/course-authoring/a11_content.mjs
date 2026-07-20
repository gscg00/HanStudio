// Contenido editorial A1.1. Este archivo es fuente local y no forma parte del
// artefacto público. El generador valida que cada idioma tenga exactamente el
// mismo inventario semántico antes de crear unidades o solicitar audio.

export const A11_THEMES=Object.freeze([
  {
    id:'identity',title:'Identidad y saludos',objective:'Saludar, presentarte, preguntar el nombre y pedir ayuda básica.',
    meanings:['hola','buenos días','buenas noches','adiós','nombre','país','idioma','persona','Me llamo Ana.','Mucho gusto.','Gracias.','Por favor.','¿Cómo te llamas?','Soy de México.','Hablo un poco de este idioma.','No entiendo.'],
  },
  {
    id:'people',title:'Familia y personas',objective:'Identificar personas, relaciones, edad y convivencia.',
    meanings:['madre','padre','hermana','hermano','amigo','niño','mujer','hombre','Esta es mi familia.','Él es mi amigo.','Ella es mi hermana.','Tengo dos hermanos.','¿Quién es?','¿Cuántos años tienes?','Mi madre trabaja aquí.','Vivimos juntos.'],
  },
  {
    id:'home',title:'Casa y pertenencias',objective:'Nombrar objetos, expresar posesión y localizar cosas.',
    meanings:['casa','habitación','cocina','baño','mesa','silla','puerta','llave','Aquí está.','¿Dónde está?','Es mío.','No está aquí.','La llave está sobre la mesa.','Mi habitación es pequeña.','Hay dos sillas.','La puerta está abierta.'],
  },
  {
    id:'routine',title:'Rutina diaria',objective:'Hablar de acciones frecuentes, horarios y hábitos.',
    meanings:['despertarse','trabajar','estudiar','comer','beber','dormir','mañana','noche','todos los días','a las siete','después del trabajo','antes de dormir','Me levanto a las siete.','Estudio por la tarde.','Comemos juntos.','No trabajo el domingo.'],
  },
  {
    id:'food',title:'Comida y bebida',objective:'Pedir, aceptar, rechazar y expresar preferencias básicas.',
    meanings:['agua','pan','arroz','café','té','manzana','carne','verduras','Tengo hambre.','Tengo sed.','Quiero esto.','La cuenta, por favor.','Bebo té por la mañana.','Quiero un poco de arroz.','Esta manzana está deliciosa.','No como carne.'],
  },
  {
    id:'places',title:'Lugares y direcciones',objective:'Preguntar dónde está algo y comprender indicaciones sencillas.',
    meanings:['estación','banco','tienda','hospital','escuela','parque','izquierda','derecha','¿Dónde está la estación?','Está cerca.','Siga recto.','Disculpe.','La estación está a la izquierda.','Voy a la escuela.','El banco está cerca.','¿Cómo llego al parque?'],
  },
]);

export const A11_TARGETS=Object.freeze({
  English:{
    icons:['I','We','Home','Day','Food','Where'],
    identity:['hello','good morning','good evening','goodbye','name','country','language','person','My name is Ana.','Nice to meet you.','Thank you.','Please.','What is your name?','I am from Mexico.','I speak a little English.','I do not understand.'],
    people:['mother','father','sister','brother','friend','child','woman','man','This is my family.','He is my friend.','She is my sister.','I have two brothers.','Who is that?','How old are you?','My mother works here.','We live together.'],
    home:['house','room','kitchen','bathroom','table','chair','door','key','Here it is.','Where is it?','It is mine.','It is not here.','The key is on the table.','My room is small.','There are two chairs.','The door is open.'],
    routine:['wake up','work','study','eat','drink','sleep','morning','night','every day','at seven','after work','before sleeping','I get up at seven.','I study in the afternoon.','We eat together.','I do not work on Sunday.'],
    food:['water','bread','rice','coffee','tea','apple','meat','vegetables','I am hungry.','I am thirsty.','I want this.','The bill, please.','I drink tea in the morning.','I want some rice.','This apple is delicious.','I do not eat meat.'],
    places:['station','bank','shop','hospital','school','park','left','right','Where is the station?','It is nearby.','Go straight ahead.','Excuse me.','The station is on the left.','I go to school.','The bank is nearby.','How do I get to the park?'],
  },
  French:{
    icons:['Je','Nous','Chez','Jour','Bon','Où'],
    identity:['salut','bonjour','bonsoir','au revoir','nom','pays','langue','personne','Je m’appelle Ana.','Enchanté.','Merci.','S’il vous plaît.','Comment vous appelez-vous ?','Je viens du Mexique.','Je parle un peu français.','Je ne comprends pas.'],
    people:['mère','père','sœur','frère','ami','enfant','femme','homme','Voici ma famille.','Il est mon ami.','Elle est ma sœur.','J’ai deux frères.','Qui est-ce ?','Quel âge avez-vous ?','Ma mère travaille ici.','Nous habitons ensemble.'],
    home:['maison','chambre','cuisine','salle de bains','table','chaise','porte','clé','La voici.','Où est-elle ?','C’est à moi.','Ce n’est pas ici.','La clé est sur la table.','Ma chambre est petite.','Il y a deux chaises.','La porte est ouverte.'],
    routine:['se réveiller','travailler','étudier','manger','boire','dormir','matin','nuit','tous les jours','à sept heures','après le travail','avant de dormir','Je me lève à sept heures.','J’étudie l’après-midi.','Nous mangeons ensemble.','Je ne travaille pas le dimanche.'],
    food:['eau','pain','riz','café','thé','pomme','viande','légumes','J’ai faim.','J’ai soif.','Je veux ceci.','L’addition, s’il vous plaît.','Je bois du thé le matin.','Je voudrais du riz.','Cette pomme est délicieuse.','Je ne mange pas de viande.'],
    places:['gare','banque','magasin','hôpital','école','parc','gauche','droite','Où est la gare ?','C’est tout près.','Allez tout droit.','Excusez-moi.','La gare est à gauche.','Je vais à l’école.','La banque est tout près.','Comment aller au parc ?'],
  },
  German:{
    icons:['Ich','Wir','Haus','Tag','Essen','Wo'],
    identity:['Hallo','Guten Morgen','Guten Abend','Auf Wiedersehen','Name','Land','Sprache','Person','Ich heiße Ana.','Freut mich.','Danke.','Bitte.','Wie heißen Sie?','Ich komme aus Mexiko.','Ich spreche ein wenig Deutsch.','Ich verstehe nicht.'],
    people:['Mutter','Vater','Schwester','Bruder','Freund','Kind','Frau','Mann','Das ist meine Familie.','Er ist mein Freund.','Sie ist meine Schwester.','Ich habe zwei Brüder.','Wer ist das?','Wie alt sind Sie?','Meine Mutter arbeitet hier.','Wir wohnen zusammen.'],
    home:['Haus','Zimmer','Küche','Badezimmer','Tisch','Stuhl','Tür','Schlüssel','Hier ist es.','Wo ist es?','Es gehört mir.','Es ist nicht hier.','Der Schlüssel liegt auf dem Tisch.','Mein Zimmer ist klein.','Es gibt zwei Stühle.','Die Tür ist offen.'],
    routine:['aufwachen','arbeiten','lernen','essen','trinken','schlafen','Morgen','Nacht','jeden Tag','um sieben Uhr','nach der Arbeit','vor dem Schlafen','Ich stehe um sieben Uhr auf.','Ich lerne am Nachmittag.','Wir essen zusammen.','Ich arbeite sonntags nicht.'],
    food:['Wasser','Brot','Reis','Kaffee','Tee','Apfel','Fleisch','Gemüse','Ich habe Hunger.','Ich habe Durst.','Ich möchte das.','Die Rechnung, bitte.','Ich trinke morgens Tee.','Ich möchte etwas Reis.','Dieser Apfel ist lecker.','Ich esse kein Fleisch.'],
    places:['Bahnhof','Bank','Geschäft','Krankenhaus','Schule','Park','links','rechts','Wo ist der Bahnhof?','Es ist in der Nähe.','Gehen Sie geradeaus.','Entschuldigung.','Der Bahnhof ist links.','Ich gehe zur Schule.','Die Bank ist in der Nähe.','Wie komme ich zum Park?'],
  },
  Italian:{
    icons:['Io','Noi','Casa','Giorno','Cibo','Dove'],
    identity:['ciao','buongiorno','buonasera','arrivederci','nome','paese','lingua','persona','Mi chiamo Ana.','Piacere.','Grazie.','Per favore.','Come ti chiami?','Vengo dal Messico.','Parlo un po’ d’italiano.','Non capisco.'],
    people:['madre','padre','sorella','fratello','amico','bambino','donna','uomo','Questa è la mia famiglia.','Lui è il mio amico.','Lei è mia sorella.','Ho due fratelli.','Chi è?','Quanti anni hai?','Mia madre lavora qui.','Viviamo insieme.'],
    home:['casa','camera','cucina','bagno','tavolo','sedia','porta','chiave','Eccola qui.','Dov’è?','È mio.','Non è qui.','La chiave è sul tavolo.','La mia camera è piccola.','Ci sono due sedie.','La porta è aperta.'],
    routine:['svegliarsi','lavorare','studiare','mangiare','bere','dormire','mattina','notte','ogni giorno','alle sette','dopo il lavoro','prima di dormire','Mi alzo alle sette.','Studio nel pomeriggio.','Mangiamo insieme.','Non lavoro la domenica.'],
    food:['acqua','pane','riso','caffè','tè','mela','carne','verdure','Ho fame.','Ho sete.','Voglio questo.','Il conto, per favore.','Bevo tè al mattino.','Vorrei un po’ di riso.','Questa mela è deliziosa.','Non mangio carne.'],
    places:['stazione','banca','negozio','ospedale','scuola','parco','sinistra','destra','Dov’è la stazione?','È qui vicino.','Vada sempre dritto.','Mi scusi.','La stazione è a sinistra.','Vado a scuola.','La banca è qui vicino.','Come arrivo al parco?'],
  },
  Russian:{
    icons:['Я','Мы','Дом','День','Еда','Где'],
    identity:['здравствуйте','доброе утро','добрый вечер','до свидания','имя','страна','язык','человек','Меня зовут Анна.','Очень приятно.','Спасибо.','Пожалуйста.','Как вас зовут?','Я из Мексики.','Я немного говорю по-русски.','Я не понимаю.'],
    people:['мать','отец','сестра','брат','друг','ребёнок','женщина','мужчина','Это моя семья.','Он мой друг.','Она моя сестра.','У меня два брата.','Кто это?','Сколько вам лет?','Моя мама работает здесь.','Мы живём вместе.'],
    home:['дом','комната','кухня','ванная','стол','стул','дверь','ключ','Вот он.','Где он?','Это моё.','Его здесь нет.','Ключ лежит на столе.','Моя комната маленькая.','Здесь два стула.','Дверь открыта.'],
    routine:['просыпаться','работать','учиться','есть','пить','спать','утро','ночь','каждый день','в семь часов','после работы','перед сном','Я встаю в семь часов.','Я учусь днём.','Мы едим вместе.','Я не работаю в воскресенье.'],
    food:['вода','хлеб','рис','кофе','чай','яблоко','мясо','овощи','Я хочу есть.','Я хочу пить.','Я хочу это.','Счёт, пожалуйста.','Утром я пью чай.','Я хочу немного риса.','Это яблоко очень вкусное.','Я не ем мясо.'],
    places:['вокзал','банк','магазин','больница','школа','парк','налево','направо','Где вокзал?','Это рядом.','Идите прямо.','Извините.','Вокзал слева.','Я иду в школу.','Банк находится рядом.','Как пройти в парк?'],
  },
  Korean:{
    icons:['나','가족','집','하루','음식','어디'],
    identity:['안녕하세요','좋은 아침이에요','좋은 저녁이에요','안녕히 가세요','이름','나라','언어','사람','제 이름은 아나예요.','만나서 반가워요.','감사합니다.','부탁합니다.','이름이 뭐예요?','저는 멕시코에서 왔어요.','한국어를 조금 해요.','이해하지 못해요.'],
    people:['어머니','아버지','여동생','남동생','친구','아이','여자','남자','이 사람들은 제 가족이에요.','그는 제 친구예요.','그녀는 제 여동생이에요.','저는 남동생이 두 명 있어요.','누구예요?','몇 살이에요?','제 어머니는 여기에서 일해요.','우리는 함께 살아요.'],
    home:['집','방','부엌','화장실','탁자','의자','문','열쇠','여기 있어요.','어디에 있어요?','제 거예요.','여기에 없어요.','열쇠는 탁자 위에 있어요.','제 방은 작아요.','의자가 두 개 있어요.','문이 열려 있어요.'],
    routine:['일어나다','일하다','공부하다','먹다','마시다','자다','아침','밤','매일','일곱 시에','일한 후에','자기 전에','저는 일곱 시에 일어나요.','저는 오후에 공부해요.','우리는 함께 먹어요.','저는 일요일에 일하지 않아요.'],
    food:['물','빵','밥','커피','차','사과','고기','채소','배고파요.','목말라요.','이것을 원해요.','계산서 주세요.','저는 아침에 차를 마셔요.','밥을 조금 주세요.','이 사과는 맛있어요.','저는 고기를 먹지 않아요.'],
    places:['역','은행','가게','병원','학교','공원','왼쪽','오른쪽','역이 어디에 있어요?','가까이에 있어요.','곧장 가세요.','실례합니다.','역은 왼쪽에 있어요.','저는 학교에 가요.','은행은 가까이에 있어요.','공원에 어떻게 가요?'],
  },
  Japanese:{
    icons:['私','家族','家','日','食','どこ'],
    identity:['こんにちは','おはようございます','こんばんは','さようなら','名前','国','言葉','人','私の名前はアナです。','はじめまして。','ありがとうございます。','お願いします。','お名前は何ですか。','メキシコから来ました。','日本語を少し話します。','分かりません。'],
    people:['母','父','妹','弟','友達','子ども','女の人','男の人','これは私の家族です。','彼は私の友達です。','彼女は私の妹です。','弟が二人います。','だれですか。','何歳ですか。','母はここで働いています。','私たちは一緒に住んでいます。'],
    home:['家','部屋','台所','お手洗い','テーブル','いす','ドア','鍵','ここにあります。','どこにありますか。','私のです。','ここにはありません。','鍵はテーブルの上にあります。','私の部屋は小さいです。','いすが二つあります。','ドアが開いています。'],
    routine:['起きる','働く','勉強する','食べる','飲む','寝る','朝','夜','毎日','七時に','仕事のあとで','寝る前に','七時に起きます。','午後に勉強します。','一緒に食べます。','日曜日は働きません。'],
    food:['水','パン','ご飯','コーヒー','お茶','りんご','肉','野菜','おなかがすきました。','のどがかわきました。','これが欲しいです。','お会計をお願いします。','朝、お茶を飲みます。','ご飯を少しください。','このりんごはおいしいです。','肉を食べません。'],
    places:['駅','銀行','店','病院','学校','公園','左','右','駅はどこですか。','近くにあります。','まっすぐ行ってください。','すみません。','駅は左にあります。','学校へ行きます。','銀行は近くにあります。','公園へはどう行きますか。'],
  },
  Chinese:{
    icons:['我','人','家','日','食','哪'],
    identity:['你好','早上好','晚上好','再见','名字','国家','语言','人','我叫安娜。','很高兴认识你。','谢谢。','请。','你叫什么名字？','我来自墨西哥。','我会说一点汉语。','我不明白。'],
    people:['妈妈','爸爸','妹妹','弟弟','朋友','孩子','女人','男人','这是我的家人。','他是我的朋友。','她是我的妹妹。','我有两个弟弟。','他是谁？','你多大？','我妈妈在这里工作。','我们住在一起。'],
    home:['家','房间','厨房','洗手间','桌子','椅子','门','钥匙','在这里。','在哪里？','是我的。','不在这里。','钥匙在桌子上。','我的房间很小。','有两把椅子。','门开着。'],
    routine:['起床','工作','学习','吃','喝','睡觉','早上','晚上','每天','七点','下班以后','睡觉以前','我七点起床。','我下午学习。','我们一起吃饭。','我星期天不工作。'],
    food:['水','面包','米饭','咖啡','茶','苹果','肉','蔬菜','我饿了。','我渴了。','我要这个。','请结账。','我早上喝茶。','我要一点米饭。','这个苹果很好吃。','我不吃肉。'],
    places:['车站','银行','商店','医院','学校','公园','左边','右边','车站在哪里？','就在附近。','一直往前走。','不好意思。','车站在左边。','我去学校。','银行就在附近。','怎么去公园？'],
  },
  Portuguese:{
    icons:['Eu','Nós','Casa','Dia','Comida','Onde'],
    identity:['olá','bom dia','boa noite','adeus','nome','país','língua','pessoa','Chamo-me Ana.','Muito prazer.','Obrigado.','Por favor.','Como se chama?','Sou do México.','Falo um pouco de português.','Não compreendo.'],
    people:['mãe','pai','irmã','irmão','amigo','criança','mulher','homem','Esta é a minha família.','Ele é meu amigo.','Ela é minha irmã.','Tenho dois irmãos.','Quem é?','Quantos anos tem?','A minha mãe trabalha aqui.','Vivemos juntos.'],
    home:['casa','quarto','cozinha','casa de banho','mesa','cadeira','porta','chave','Está aqui.','Onde está?','É meu.','Não está aqui.','A chave está em cima da mesa.','O meu quarto é pequeno.','Há duas cadeiras.','A porta está aberta.'],
    routine:['acordar','trabalhar','estudar','comer','beber','dormir','manhã','noite','todos os dias','às sete','depois do trabalho','antes de dormir','Levanto-me às sete.','Estudo à tarde.','Comemos juntos.','Não trabalho ao domingo.'],
    food:['água','pão','arroz','café','chá','maçã','carne','legumes','Tenho fome.','Tenho sede.','Quero isto.','A conta, por favor.','Bebo chá de manhã.','Quero um pouco de arroz.','Esta maçã é deliciosa.','Não como carne.'],
    places:['estação','banco','loja','hospital','escola','parque','esquerda','direita','Onde fica a estação?','Fica perto.','Siga em frente.','Desculpe.','A estação fica à esquerda.','Vou para a escola.','O banco fica perto.','Como chego ao parque?'],
  },
  Arabic:{
    icons:['أنا','نحن','بيت','يوم','طعام','أين'],
    identity:['مرحبًا','صباح الخير','مساء الخير','إلى اللقاء','اسم','بلد','لغة','شخص','اسمي آنا.','تشرّفت بلقائك.','شكرًا.','من فضلك.','ما اسمك؟','أنا من المكسيك.','أتكلم العربية قليلًا.','لا أفهم.'],
    people:['أم','أب','أخت','أخ','صديق','طفل','امرأة','رجل','هذه عائلتي.','هو صديقي.','هي أختي.','لديّ أخوان.','من هذا؟','كم عمرك؟','أمي تعمل هنا.','نحن نعيش معًا.'],
    home:['بيت','غرفة','مطبخ','حمّام','طاولة','كرسي','باب','مفتاح','إنه هنا.','أين هو؟','إنه لي.','ليس هنا.','المفتاح على الطاولة.','غرفتي صغيرة.','هناك كرسيان.','الباب مفتوح.'],
    routine:['يستيقظ','يعمل','يدرس','يأكل','يشرب','ينام','صباح','ليل','كل يوم','في الساعة السابعة','بعد العمل','قبل النوم','أستيقظ في الساعة السابعة.','أدرس بعد الظهر.','نأكل معًا.','لا أعمل يوم الأحد.'],
    food:['ماء','خبز','أرز','قهوة','شاي','تفاحة','لحم','خضروات','أشعر بالجوع.','أشعر بالعطش.','أريد هذا.','الحساب من فضلك.','أشرب الشاي في الصباح.','أريد قليلًا من الأرز.','هذه التفاحة لذيذة.','لا آكل اللحم.'],
    places:['محطة','بنك','متجر','مستشفى','مدرسة','حديقة','يسار','يمين','أين المحطة؟','إنه قريب.','اذهب مستقيمًا.','عذرًا.','المحطة على اليسار.','أذهب إلى المدرسة.','البنك قريب.','كيف أذهب إلى الحديقة؟'],
  },
});

export function validateA11Content(){
  for(const[language,payload]of Object.entries(A11_TARGETS)){
    if(!Array.isArray(payload.icons)||payload.icons.length!==A11_THEMES.length)throw new Error(`${language}: iconos incompletos`);
    for(const theme of A11_THEMES){
      if(!Array.isArray(payload[theme.id])||payload[theme.id].length!==theme.meanings.length)throw new Error(`${language}/${theme.id}: se esperaban ${theme.meanings.length} contenidos`);
      if(payload[theme.id].some(value=>!String(value).trim()))throw new Error(`${language}/${theme.id}: texto vacío`);
    }
  }
  return true;
}
