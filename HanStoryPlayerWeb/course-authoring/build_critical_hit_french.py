from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from html import escape
from pathlib import Path


WEB = Path(__file__).resolve().parents[1]
CODE = "HF-CRITICAL-S1"
BOOK = WEB / "library" / "books" / CODE


def P(fr: str, es: str):
    return {"fr": fr, "es": es}


def V(fr: str, es: str):
    return {"fr": fr, "es": es}


def E(title, summary, phrases, vocabulary):
    return {"title": title, "summary": summary, "p": phrases, "v": vocabulary}


# Short, manually corrected study selections from the French WEBTOON edition.
# The complete comic is intentionally not reproduced in the HanStory package.
EPISODES = [
    E("Le corps humain", "Le corps humain devient le premier sujet d'observation et de frustration.", [
        P("Le corps humain est vraiment difficile à satisfaire.", "El cuerpo humano es realmente difícil de satisfacer."),
        P("Comme si on était destiné à une forme ou une autre de gêne moche.", "Como si estuviéramos destinados a alguna forma de incomodidad horrible."),
        P("Je ne ressens absolument rien.", "No siento absolutamente nada."),
        P("Maintenant il ne reste plus que moi et le vide de mon existence.", "Ahora solo quedamos yo y el vacío de mi existencia."),
    ], [V("le corps humain", "el cuerpo humano"), V("satisfaire", "satisfacer"), V("le vide", "el vacío")]),
    E("Encore une livraison", "Una entrega fallida vuelve a arruinar una jornada aparentemente normal.", [
        P("Malheureusement, votre colis n'a pas pu être livré.", "Desafortunadamente, su paquete no pudo ser entregado."),
        P("Veuillez vous rendre en relais colis ou faites-vous livrer un autre jour.", "Diríjase a un punto de entrega o haga que se lo entreguen otro día."),
        P("Non, j'y crois pas, pas encore !", "¡No, no me lo puedo creer, otra vez no!"),
        P("Cette fois-ci, je ne me ferai pas avoir.", "Esta vez no dejaré que me engañen."),
    ], [V("un colis", "un paquete"), V("livrer", "entregar"), V("se faire avoir", "dejarse engañar")]),
    E("Le sommeil", "El protagonista intenta organizar su rutina alrededor de su amor por dormir.", [
        P("J'ai une relation particulière avec le sommeil.", "Tengo una relación particular con el sueño."),
        P("C'est une pure addiction, j'en ai jamais assez.", "Es una pura adicción; nunca tengo suficiente."),
        P("Cet homme commence le travail à 4 h 00.", "Este hombre empieza a trabajar a las cuatro de la mañana."),
        P("Je peux me préparer en quinze minutes.", "Puedo prepararme en quince minutos."),
    ], [V("le sommeil", "el sueño"), V("une addiction", "una adicción"), V("se préparer", "prepararse")]),
    E("L'ascenseur en panne", "Subir hasta el último piso transforma una avería en ejercicio diario.", [
        P("Depuis quelques jours, mon ascenseur est en panne.", "Desde hace unos días, mi ascensor está averiado."),
        P("Je vis au dernier étage d'un vieil immeuble et les réparations sont compliquées.", "Vivo en el último piso de un edificio viejo y las reparaciones son complicadas."),
        P("La montée est à des années-lumière de la descente.", "Subir está a años luz de bajar."),
        P("J'ai fait la rencontre de mes voisins.", "Conocí a mis vecinos."),
    ], [V("un ascenseur", "un ascensor"), V("être en panne", "estar averiado"), V("un étage", "un piso")]),
    E("Le confort du chat", "Un animal parece haber encontrado una vida mucho más cómoda que la de su dueño.", [
        P("Canapé super confortable.", "Sofá supercómodo."), P("Lit douillet avec couette.", "Cama acogedora con edredón."),
        P("Son spot préféré.", "Su lugar favorito."), P("Tous les jouets du monde.", "Todos los juguetes del mundo."),
    ], [V("confortable", "cómodo"), V("douillet", "acogedor / mullido"), V("un jouet", "un juguete")]),
    E("Concentration intense", "Una sesión de dibujo se convierte en una batalla de concentración y frustración.", [
        P("Concentration intense !", "¡Concentración intensa!"), P("Scratch, scratch.", "Ras, ras."),
        P("Wouah !", "¡Guau!"), P("Tu l'auras voulu...", "Te lo has buscado..."),
    ], [V("la concentration", "la concentración"), V("intense", "intenso"), V("vouloir", "querer")]),
    E("La recherche d'appartement", "Buscar vivienda revela que un anuncio bonito no siempre cuenta toda la historia.", [
        P("En recherche d'appartement.", "Buscando departamento."), P("Comme vous le voyez, ici il n'y a pas d'ascenseur.", "Como pueden ver, aquí no hay ascensor."),
        P("Vous venez, monsieur ?", "¿Viene, señor?"), P("Appartement petit mais complètement remis à neuf : confortable, lumineux, propre.", "Departamento pequeño pero completamente renovado: cómodo, luminoso y limpio."),
    ], [V("un appartement", "un departamento"), V("remis à neuf", "renovado"), V("lumineux", "luminoso")]),
    E("Le cafard", "Una visita de departamento se detiene ante un inesperado duelo de miradas.", [
        P("Durant une visite d'appartement...", "Durante una visita de departamento..."), P("Pendant ce temps-là...", "Mientras tanto..."),
        P("Pour une raison inconnue, le cafard était resté parfaitement immobile.", "Por una razón desconocida, la cucaracha se había quedado perfectamente inmóvil."),
        P("On fait une bataille de regards !", "¡Hacemos una batalla de miradas!"),
    ], [V("un cafard", "una cucaracha"), V("immobile", "inmóvil"), V("un regard", "una mirada")]),
    E("Les révélations d'un manga", "Una crítica de manga se pierde entre revelaciones cada vez más absurdas.", [
        P("Je me souviens de ce manga qui m'a déçu sur la fin.", "Recuerdo ese manga que me decepcionó al final."),
        P("Comme si l'auteur n'arrivait pas à se décider sur une conclusion.", "Como si el autor no lograra decidirse por una conclusión."),
        P("C'est moi, Obito ! L'ami d'enfance de ton sensei !", "¡Soy yo, Obito! ¡El amigo de infancia de tu sensei!"),
        P("Non, c'est moi, Kaguya !", "¡No, soy yo, Kaguya!"),
    ], [V("se souvenir de", "acordarse de"), V("décevoir", "decepcionar"), V("une conclusion", "una conclusión")]),
    E("Un ami de longue date", "Un encuentro casual en el parque reúne a viejos conocidos.", [
        P("Retrouver un ami de longue date.", "Volver a encontrar a un amigo de hace mucho tiempo."), P("Discuter au parc.", "Conversar en el parque."),
        P("Croiser par hasard.", "Encontrarse por casualidad."), P("Cet ami habite à côté.", "Ese amigo vive al lado."),
    ], [V("de longue date", "de hace mucho tiempo"), V("croiser", "cruzarse con"), V("par hasard", "por casualidad")]),
    E("L'accoutumance", "El cerebro se acostumbra poco a poco a lo que antes parecía extraordinario.", [
        P("Quand on donne de petites quantités de poison...", "Cuando damos pequeñas cantidades de veneno..."), P("Puis de plus en plus grandes...", "Después, cada vez más grandes..."),
        P("Il commence à pleuvoir ?", "¿Empieza a llover?"), P("Et finit par se lasser de tout.", "Y termina cansándose de todo."),
    ], [V("une quantité", "una cantidad"), V("le poison", "el veneno"), V("se lasser de", "cansarse de")]),
    E("Les canards", "Un paseo tranquilo se convierte en una lección sobre las apariencias y el hambre.", [
        P("Un jour ensoleillé.", "Un día soleado."), P("J'ai voulu jouer à l'adulte sain et responsable.", "Quise jugar a ser un adulto sano y responsable."),
        P("On dirait un petit couple.", "Parecen una parejita."), P("J'ai pensé à de la méchanceté gratuite.", "Pensé en una maldad gratuita."),
    ], [V("ensoleillé", "soleado"), V("un canard", "un pato"), V("une méchanceté", "una maldad")]),
    E("La soirée parfaite", "Después del trabajo, elegir qué ver o jugar se vuelve imposible.", [
        P("Ah, j'ai enfin fini le boulot !", "¡Ah, por fin terminé el trabajo!"), P("Maintenant, je dois profiter un maximum de ma soirée !", "¡Ahora debo aprovechar al máximo mi noche!"),
        P("Je pourrais finir ce jeu.", "Podría terminar este juego."), P("Un film, c'est trop long, et si je n'aime pas ?", "Una película es demasiado larga, ¿y si no me gusta?"),
    ], [V("finir", "terminar"), V("profiter de", "disfrutar / aprovechar"), V("une soirée", "una noche")]),
    E("Le microbiote", "El cuerpo alberga pequeños seres que pueden cambiar con la alimentación.", [
        P("Il existe des petits êtres qui coexistent dans notre corps.", "Existen pequeños seres que coexisten en nuestro cuerpo."), P("C'est ce qu'on appelle le microbiote.", "A eso se le llama el microbiota."),
        P("Parfois, les mauvaises bactéries se multiplient.", "A veces las bacterias malas se multiplican."), P("Le plus souvent à cause d'un déséquilibre alimentaire.", "La mayoría de las veces por un desequilibrio alimentario."),
    ], [V("coexister", "coexistir"), V("se multiplier", "multiplicarse"), V("un déséquilibre", "un desequilibrio")]),
    E("Les probiotiques", "Una solución casera intenta recuperar el equilibrio de las bacterias buenas.", [
        P("J'ai tout essayé...", "Lo he probado todo..."), P("T'as déjà essayé les probiotiques ?", "¿Ya probaste los probióticos?"),
        P("C'est quoi ?", "¿Qué es eso?"), P("Il faut aussi repeupler avec de bonnes bactéries !", "¡También hay que repoblar con bacterias buenas!"),
    ], [V("essayer", "probar / intentar"), V("les probiotiques", "los probióticos"), V("repeupler", "repoblar")]),
    E("L'énergie occulte", "Una lección de poderes sobrenaturales mezcla entrenamiento y promesas imposibles.", [
        P("Alors écoute bien, aujourd'hui on va apprendre à se servir de l'énergie occulte.", "Entonces escucha bien: hoy aprenderemos a utilizar la energía maldita."), P("Oui, senseï !", "¡Sí, sensei!"),
        P("Regarde, si tu la maîtrises aussi bien que moi...", "Mira, si la dominas tan bien como yo..."), P("On peut se téléporter.", "Podemos teletransportarnos."),
    ], [V("occulte", "oculto / maldito"), V("maîtriser", "dominar"), V("se téléporter", "teletransportarse")]),
    E("Les gobelins", "Un cruce de calle termina con un encuentro fantástico y una amenaza inesperada.", [
        P("Paviane s'est réveillée, maman !", "¡Paviane se despertó, mamá!"), P("Va me chercher la massue de papa.", "Ve a buscar el garrote de papá."),
        P("Wouah !", "¡Guau!"), P("Splash !", "¡Splash! / ¡chapuzón!"),
    ], [V("se réveiller", "despertarse"), V("une massue", "un garrote"), V("un gobelin", "un duende")]),
    E("Entre humains", "La comunicación entre especies no resulta tan sencilla como parecía.", [
        P("Oh, merci ! Merci !", "¡Oh, gracias! ¡Gracias!"), P("Mais entre humains, on devrait se comprendre.", "Pero entre humanos deberíamos entendernos."),
        P("Tu comprends ce qu'il dit ?", "¿Entiendes lo que dice?"), P("Heureusement, en vendant cet objet, on peut payer le loyer.", "Por suerte, vendiendo este objeto podemos pagar el alquiler."),
    ], [V("se comprendre", "entenderse"), V("heureusement", "por suerte"), V("le loyer", "el alquiler")]),
    E("Le film au cinéma", "Una película esperada compite contra la urgencia de no perder la función.", [
        P("Mince, j'ai envie de pisser, mais je peux pas.", "Rayos, tengo ganas de hacer pipí, pero no puedo."), P("Je vais rater le film.", "Voy a perderme la película."),
        P("Alors, qu'est-ce que t'as pensé du film ?", "Entonces, ¿qué te pareció la película?"), P("La prochaine fois, je le regarderai en streaming.", "La próxima vez la veré en streaming."),
    ], [V("avoir envie de", "tener ganas de"), V("rater", "perderse / fallar"), V("la prochaine fois", "la próxima vez")]),
    E("La séance de cinéma", "Entrar al cine implica pagar, esperar la publicidad y aceptar reglas absurdas.", [
        P("Désolé, vous ne pouvez pas rentrer avec votre bouteille d'eau.", "Lo siento, no puede entrar con su botella de agua."), P("Ça fera cinq euros.", "Serán cinco euros."),
        P("Tu savais qu'il existe une taxe sur chaque billet de cinéma ?", "¿Sabías que existe un impuesto en cada boleto de cine?"), P("Ne vous inquiétez pas, moi aussi j'aime le cinéma.", "No se preocupe, a mí también me gusta el cine."),
    ], [V("rentrer", "entrar / regresar"), V("une taxe", "un impuesto"), V("un billet", "un boleto")]),
    E("Le travail du chat", "Una tarea sencilla termina convirtiéndose en una cadena de exigencias laborales.", [
        P("Et voilà, un travail bien fait.", "Y listo, un trabajo bien hecho."), P("Je suis choqué, tu fais ton poids en caca tous les jours.", "Estoy en shock: haces tu peso en caca todos los días."),
        P("Rajoute aussi de ces petits grains de sable, s'il te plaît.", "Añade también esos granitos de arena, por favor."), P("Hey, tu vas où comme ça ?", "Oye, ¿adónde vas así?"),
    ], [V("rajouter", "añadir"), V("un grain de sable", "un grano de arena"), V("bien fait", "bien hecho")]),
    E("Un nouvel ennemi", "El verano trae fiestas, calor y un enemigo nuevo para el sueño.", [
        P("L'été, c'est aussi la période des grosses fêtes et soirées.", "El verano también es la época de las grandes fiestas y noches."), P("Mais dernièrement, il s'est passé quelque chose de nouveau.", "Pero últimamente pasó algo nuevo."),
        P("Un nouvel ennemi à mon sommeil...", "Un nuevo enemigo de mi sueño..."), P("C'étaient forcément des voisins !", "¡Por fuerza eran vecinos!"),
    ], [V("dernièrement", "últimamente"), V("un ennemi", "un enemigo"), V("forcément", "necesariamente / por fuerza")]),
    E("Le héros", "Una oferta de poder parece prometedora hasta que aparecen los límites físicos.", [
        P("Tu peux devenir un héros.", "Puedes convertirte en un héroe."), P("Mes os se brisent à chaque fois que j'utilise mes pouvoirs.", "Mis huesos se rompen cada vez que uso mis poderes."),
        P("Ne t'inquiète pas, ça n'a pas pris vingt longues années pour arriver.", "No te preocupes, no tardó veinte largos años en ocurrir."), P("Bienvenue au club.", "Bienvenido al club."),
    ], [V("se briser", "romperse"), V("un pouvoir", "un poder"), V("devenir", "convertirse en")]),
    E("La canicule", "Una familia espera sombra durante una ola de calor interminable.", [
        P("Ça fait des heures qu'on attend un peu d'ombre pour traverser la rue.", "Llevamos horas esperando un poco de sombra para cruzar la calle."), P("Ne t'inquiète pas, ma chérie.", "No te preocupes, cariño."),
        P("Maintenant, j'ai faim et soif.", "Ahora tengo hambre y sed."), P("Ne te retourne pas et n'oublie pas...", "No te des la vuelta y no olvides..."),
    ], [V("la canicule", "la ola de calor"), V("l'ombre", "la sombra"), V("avoir soif", "tener sed")]),
    E("Les coups de bol", "Una serie de desgracias acaba demostrando que la mala suerte también puede ayudar.", [
        P("Il y a des malchances qui s'avèrent plus tard être de gros coups de bol.", "Hay desgracias que después resultan ser grandes golpes de suerte."), P("Un exemple parlant serait de manquer son avion.", "Un ejemplo claro sería perder el avión."),
        P("La relation de cause à effet est évidente.", "La relación de causa y efecto es evidente."), P("Je suis sûr que vous aussi, vous pouvez conclure que c'était pour le mieux.", "Estoy seguro de que ustedes también pueden concluir que fue para mejor."),
    ], [V("un coup de bol", "un golpe de suerte"), V("s'avérer", "resultar"), V("la cause", "la causa")]),
    E("Le concours de cuisine", "Un concurso de cocina para solteros se toma las pastas muy en serio.", [
        P("Tu fais des super pâtes au saumon, tu devrais participer !", "¡Haces una pasta con salmón increíble; deberías participar!"), P("Bienvenue dans ce concours de cuisine des célibataires de moins de trente ans !", "¡Bienvenidos a este concurso de cocina para solteros menores de treinta años!"),
        P("Vous demandez sûrement pourquoi ce concours est aussi spécifique ?", "Seguramente se preguntan por qué este concurso es tan específico."), P("Je jure que si le prochain nous apporte aussi des pâtes, je l'étripe sur place.", "Juro que si el siguiente también trae pasta, lo destripo ahí mismo."),
    ], [V("un concours", "un concurso"), V("un célibataire", "un soltero"), V("étriper", "destripar")]),
    E("Les cernes", "El aburrimiento deja una marca visible debajo de los ojos.", [
        P("J'ai une particularité physique.", "Tengo una particularidad física."), P("Concernant les cernes sous mes yeux.", "En cuanto a las ojeras debajo de mis ojos."),
        P("Plus je m'ennuie et plus elles se creusent.", "Cuanto más me aburro, más se hunden."), P("Ne faites pas votre rat.", "No sean tacaños."),
    ], [V("une particularité", "una particularidad"), V("les cernes", "las ojeras"), V("s'ennuyer", "aburrirse")]),
    E("Le grand journalisme", "Un reportaje sobre el calor lleva una noticia sensacional a las calles.", [
        P("Chaque été, nous retrouvons notre envoyé spécial.", "Cada verano volvemos a encontrarnos con nuestro enviado especial."), P("Il fait très chaud.", "Hace mucho calor."),
        P("Ça, c'est du grand journalisme.", "Eso sí que es gran periodismo."), P("Une source de confiance m'indique que le président s'apprête à truquer les prochaines élections.", "Una fuente confiable me indica que el presidente se dispone a manipular las próximas elecciones."),
    ], [V("un envoyé spécial", "un enviado especial"), V("une source de confiance", "una fuente confiable"), V("truquer", "manipular / amañar")]),
    E("Les touristes", "Un paseo por París revela que dos fotógrafos no estaban mirando la arquitectura.", [
        P("Je me suis promené aux Invalides, à Paris.", "Paseé por Los Inválidos, en París."), P("Pour prendre un peu le soleil et finir mon bouquin.", "Para tomar un poco el sol y terminar mi libro."),
        P("Ils avaient l'air très investis !", "¡Parecían muy entregados!"), P("Résultat : c'était juste des gros pervers.", "Resultado: solo eran unos pervertidos."),
    ], [V("se promener", "pasear"), V("un bouquin", "un libro, coloquial"), V("un pervers", "un pervertido")]),
    E("La vie sociale", "La vida adulta y el teletrabajo hacen que reencontrarse requiera planificación.", [
        P("Quand on est en télétravail, on n'a pas souvent l'occasion de voir du monde.", "Cuando trabajamos desde casa, no solemos tener ocasión de ver gente."), P("Avec l'âge adulte, chacun mène sa petite aventure de son côté.", "Con la edad adulta, cada quien lleva su pequeña aventura por su lado."),
        P("On doit parfois s'y prendre des semaines à l'avance pour revoir ses amis.", "A veces hay que organizarse con semanas de anticipación para volver a ver a los amigos."), P("C'est validé, on se voit dans trois semaines !", "¡Está confirmado, nos vemos en tres semanas!"),
    ], [V("le télétravail", "el trabajo remoto"), V("s'y prendre", "organizarse / proceder"), V("à l'avance", "con anticipación")]),
    E("La même direction", "Un paseo cotidiano se llena de malentendidos y estrategias para no incomodar.", [
        P("On va dans la même direction...", "Vamos en la misma dirección..."), P("Elle pense que je la suis.", "Ella piensa que la sigo."), P("Je vais accélérer pour la dépasser.", "Voy a acelerar para adelantarla."), P("Ça devrait la rassurer si je marche devant.", "Eso debería tranquilizarla si camino delante."),
    ], [V("la direction", "la dirección"), V("dépasser", "adelantar / rebasar"), V("rassurer", "tranquilizar")]),
    E("La morning routine", "Una rutina productiva sobre el papel no se parece a la mañana real.", [
        P("En France, quand on est auteur, on est aussi entrepreneur.", "En Francia, cuando eres autor también eres empresario."), P("C'est pourquoi je dois respecter une morning routine très stricte !", "¡Por eso debo respetar una rutina matutina muy estricta!"),
        P("Le réveil sonne à 4 h 00.", "La alarma suena a las cuatro."), P("Pas de travail avant un grand café bien sucré.", "Nada de trabajo antes de un gran café bien azucarado."),
    ], [V("un entrepreneur", "un empresario"), V("le réveil", "la alarma"), V("strict", "estricto")]),
    E("Le coup de soleil", "El calor del verano deja una marca que termina pareciendo un superpoder.", [
        P("En été, mon appart se transforme en four.", "En verano, mi departamento se transforma en horno."), P("Alors je vais dehors pour essayer d'avoir un peu moins chaud.", "Entonces salgo para intentar tener un poco menos de calor."),
        P("Chaque année, c'est comme survivre à une épreuve biblique.", "Cada año es como sobrevivir a una prueba bíblica."), P("J'ai chopé le coup de soleil du siècle !", "¡Me agarré la quemadura solar del siglo!"),
    ], [V("se transformer", "transformarse"), V("un coup de soleil", "una quemadura solar"), V("choper", "agarrar / contraer, coloquial")]),
    E("Le retard", "Una cita al mediodía se complica por líneas cerradas, taxis y distracciones.", [
        P("On ferait pas mieux de partir maintenant ?", "¿No sería mejor irnos ahora?"), P("Elle me préviendra si elle pense arriver à l'heure.", "Ella me avisará si cree que llegará a tiempo."),
        P("La ligne 14 est fermée aujourd'hui ?!", "¿La línea 14 está cerrada hoy?!"), P("Oups, je viens de louper la sortie.", "Ups, acabo de perderme la salida."),
    ], [V("à l'heure", "a tiempo"), V("une ligne", "una línea"), V("louper", "perderse / fallar, coloquial")]),
    E("Le désordre", "Deshacerse de objetos no impide que aparezcan más cosas por todos lados.", [
        P("Mais j'ai du mal à jeter quelque chose qui pourrait encore servir.", "Pero me cuesta tirar algo que todavía podría servir."), P("J'en vois pas le bout !", "¡No le veo el final!"),
        P("J'ai déjà vendu une centaine de jeux.", "Ya he vendido un centenar de juegos."), P("Je me tourne vers le numérique pour éviter d'en rajouter.", "Me paso a lo digital para evitar añadir más."),
    ], [V("avoir du mal à", "tener dificultad para"), V("jeter", "tirar"), V("le désordre", "el desorden")]),
    E("La dépendance aux commentaires", "Para un autor de webtoons, los comentarios se convierten en una droga cotidiana.", [
        P("On a chacun notre drogue.", "Cada quien tiene su droga."), P("Pour les auteurs de webtoons, ce sont les commentaires.", "Para los autores de webtoons, son los comentarios."),
        P("Les lecteurs ont arrêté de commenter.", "Los lectores dejaron de comentar."), P("Il me faut un sevrage.", "Necesito una desintoxicación."),
    ], [V("un commentaire", "un comentario"), V("un lecteur", "un lector"), V("un sevrage", "una desintoxicación")]),
    E("Le duel de cartes", "Una partida de cartas coleccionables se convierte en una batalla llena de reglas.", [
        P("Je pose une dernière carte face cachée et je passe la main.", "Coloco una última carta boca abajo y paso el turno."), P("Quand bien même, je lui réserve un dernier piège !", "Aun así, le tengo preparada una última trampa."),
        P("Kaiba, ta stratégie avait une faille.", "Kaiba, tu estrategia tenía una falla."), P("Tous tes monstres sont détruits et tu perds dix millions de points de vie !", "¡Todos tus monstruos son destruidos y pierdes diez millones de puntos de vida!"),
    ], [V("face cachée", "boca abajo"), V("une faille", "una falla"), V("un piège", "una trampa")]),
    E("Le jeu de farm", "Una historia de videojuego resulta incomprensible para quien no conoce sus estadísticas.", [
        P("La meilleure histoire que j'ai faite de toute ma vie...", "La mejor historia que he hecho en toda mi vida..."), P("C'est compliqué à expliquer.", "Es complicado de explicar."),
        P("Je comprends pas... c'est un jeu de farm ?", "No entiendo... ¿es un juego de farmeo?"), P("T'es juste en train de monter des stats.", "Solo estás subiendo estadísticas."),
    ], [V("compliqué", "complicado"), V("monter", "subir"), V("une statistique", "una estadística")]),
    E("Le cadeau", "Un objeto guardado durante años puede ser útil, delicioso o completamente innecesario.", [
        P("Tu l'as encore sur toi ?", "¿Todavía lo llevas contigo?"), P("Tu sais que c'est fait pour être mangé ?", "¿Sabes que está hecho para comerse?"),
        P("Mais j'en aurais peut-être besoin un jour...", "Pero quizá algún día lo necesite..."), P("Profite de la vie un peu !", "¡Disfruta un poco de la vida!"),
    ], [V("avoir sur soi", "llevar consigo"), V("être fait pour", "estar hecho para"), V("profiter de", "disfrutar de")]),
    E("Le panthéon des comics", "Una visita a un museo imaginario celebra a héroes y leyendas muy particulares.", [
        P("Bienvenue au panthéon des comics.", "Bienvenidos al panteón de los cómics."), P("En tout cas, c'est vraiment un honneur de visiter ces lieux.", "En cualquier caso, es un verdadero honor visitar estos lugares."),
        P("Et c'est qui là-bas ?", "¿Y quién es ese de ahí?"), P("C'est l'homme, que dis-je... la légende !", "¡Es el hombre, qué digo... la leyenda!"),
    ], [V("un panthéon", "un panteón"), V("un honneur", "un honor"), V("que dis-je", "qué digo")]),
    E("Le calme", "El silencio absoluto resulta sospechoso incluso con las ventanas abiertas.", [
        P("C'est bien calme...", "Está muy tranquilo..."), P("Il n'y a pas une mouche, même avec les fenêtres ouvertes.", "No hay ni una mosca, incluso con las ventanas abiertas."),
        P("Mission accomplie.", "Misión cumplida."), P("Plus un seul être qui respire à l'horizon.", "Ni un solo ser que respire en el horizonte."),
    ], [V("calme", "tranquilo"), V("une mouche", "una mosca"), V("à l'horizon", "en el horizonte")]),
    E("Le masque", "Las celebridades ocultan parte de su rostro por razones muy distintas.", [
        P("J'ai réalisé que beaucoup de célébrités cachaient une partie de leur visage.", "Me di cuenta de que muchas celebridades ocultaban parte de su rostro."), P("C'est quelque chose qui participe à leur légende.", "Es algo que contribuye a su leyenda."),
        P("Dans les animés, c'est souvent pour révéler un détail super classe.", "En los animes suele ser para revelar un detalle supergenial."), P("Ils cherchent plutôt à masquer un complexe.", "Más bien intentan ocultar un complejo."),
    ], [V("une célébrité", "una celebridad"), V("masquer", "ocultar"), V("un complexe", "un complejo")]),
    E("La volonté", "Un experimento con galletas muestra cuánto cuesta resistirse a una tentación.", [
        P("On a mis des gens devant des cookies en leur interdisant de les manger.", "Pusimos a personas frente a galletas y les prohibimos comerlas."), P("Puis on leur a demandé de résoudre un puzzle.", "Después les pedimos que resolvieran un rompecabezas."),
        P("Cette étude démontre que notre énergie mentale est limitée.", "Este estudio demuestra que nuestra energía mental es limitada."), P("Faire face à des tentations épuise cette énergie.", "Enfrentarse a tentaciones agota esa energía."),
    ], [V("interdire", "prohibir"), V("résoudre", "resolver"), V("une tentation", "una tentación")]),
    E("Le café", "Una cita en un café parisino se adapta a una relación relajada con la puntualidad.", [
        P("C'est pour boire ou manger ?", "¿Es para beber o comer?"), P("C'est pour deux personnes.", "Es para dos personas."),
        P("Installez-vous.", "Tomen asiento / pónganse cómodos."), P("C'est la mode à Paris d'arriver en retard.", "En París está de moda llegar tarde."),
    ], [V("s'installer", "instalarse / sentarse"), V("arriver en retard", "llegar tarde"), V("une personne", "una persona")]),
    E("Les compléments", "Una lista de suplementos pretende convertir al autor en un atleta de la creatividad.", [
        P("Le café et les boissons énergisantes ne suffisent pas à un auteur de compétition comme moi.", "El café y las bebidas energéticas no bastan para un autor competitivo como yo."), P("Mon corps a besoin d'une combinaison de super compléments.", "Mi cuerpo necesita una combinación de super suplementos."),
        P("Pour éveiller les chakras !", "¡Para despertar los chakras!"), P("Ils me permettent d'atteindre ma forme ultime.", "Me permiten alcanzar mi forma definitiva."),
    ], [V("suffire", "bastar"), V("un complément", "un suplemento"), V("atteindre", "alcanzar")]),
    E("La nouvelle importante", "Una espera misteriosa deja a todos atentos a una noticia que no llega.", [
        P("Je prends à gauche !", "¡Tomo a la izquierda!"), P("Ouf, j'ai eu chaud...", "Uf, me salvé por poco..."),
        P("Mais tu fiches quoi depuis tout à l'heure ?!", "¡Pero qué haces desde hace rato?!"), P("J'attends une nouvelle importante.", "Estoy esperando una noticia importante."),
    ], [V("avoir chaud", "tener calor / pasar un susto"), V("depuis tout à l'heure", "desde hace rato"), V("une nouvelle", "una noticia")]),
    E("Les poissons d'argent", "Un pequeño insecto parece inofensivo hasta que encuentra una fuente de alimento.", [
        P("Tiens, où est-ce qu'ils sont passés, les petits bonshommes ?", "Oigan, ¿adónde se fueron los hombrecitos?"), P("Par petit bonhomme, je fais référence à cet insecte.", "Con hombrecito me refiero a este insecto."),
        P("Apparemment, ils peuvent se nourrir de tout ce qui traîne.", "Al parecer pueden alimentarse de todo lo que queda tirado."), P("Et même de cheveux !", "¡E incluso de cabello!"),
    ], [V("un poisson d'argent", "un pececillo de plata"), V("se nourrir de", "alimentarse de"), V("traîner", "estar tirado")]),
    E("La boîte de chocolats", "Una caja de chocolates sirve como metáfora de las promesas y decepciones de la vida.", [
        P("La vie, c'est des chocolats.", "La vida son chocolates."), P("On ne sait jamais sur quoi on va tomber.", "Nunca se sabe con qué se va a encontrar uno."),
        P("L'emballage est joli et on a d'abord hâte de goûter à chaque petit chocolat.", "El envoltorio es bonito y al principio tenemos ganas de probar cada chocolate."), P("À la fin, on a mal au ventre et on jette la boîte plein de regrets.", "Al final nos duele el estómago y tiramos la caja llenos de arrepentimientos."),
    ], [V("l'emballage", "el envoltorio"), V("avoir hâte de", "tener ganas de"), V("un regret", "un arrepentimiento")]),
    E("Le deck", "Un jugador construye un mazo poderoso antes de descubrir su precio real.", [
        P("Avec ça, j'ai de quoi me faire un deck !", "¡Con esto tengo con qué hacerme un mazo!"), P("Je vais chercher des conseils de bons joueurs sur YouTube.", "Buscaré consejos de buenos jugadores en YouTube."),
        P("Cette carte est beaucoup trop forte dans ma stratégie !", "¡Esta carta es demasiado fuerte en mi estrategia!"), P("Mais il m'en faut trois, plus les frais de livraison !", "¡Pero necesito tres, más los gastos de envío!"),
    ], [V("un deck", "un mazo"), V("une stratégie", "una estrategia"), V("les frais de livraison", "los gastos de envío")]),
    E("Les moustiques", "Los mosquitos evolucionan hasta convertirse en la especie dominante.", [
        P("Les moustiques au début des années 2000 étaient extrêmement faciles à tuer.", "Los mosquitos a principios de los años 2000 eran extremadamente fáciles de matar."), P("Certains plus intelligents se posaient au plafond.", "Algunos más inteligentes se posaban en el techo."),
        P("Je sais que vous êtes là, putains de moustiques ! Montrez-vous !", "¡Sé que están ahí, malditos mosquitos! ¡Muéstrense!"), P("L'homme n'était plus l'espèce dominante sur la planète.", "El ser humano ya no era la especie dominante del planeta."),
    ], [V("un moustique", "un mosquito"), V("pondre des œufs", "poner huevos"), V("l'espèce dominante", "la especie dominante")]),
]


def make_tracks():
    tracks, lessons = [], []
    for lesson, episode in enumerate(EPISODES, 1):
        ids = []
        for sequence, item in enumerate(episode["p"], 1):
            tid = f"HFCritS1{lesson:02d}{sequence:02d}"; ids.append(tid)
            tracks.append({"id": tid, "lesson": lesson, "sequence": sequence, "speaker": "", "text": item["fr"], "translation": item["es"], "tts_fallback": True, "section": "scene", "type": "phrase", "language": "French", "difficulty": "A2", "source_episode": lesson})
        for sequence, item in enumerate(episode["v"], len(episode["p"]) + 1):
            tid = f"HFCritS1W{(lesson - 1) * 3 + sequence - len(episode['p']):03d}"; ids.append(tid)
            tracks.append({"id": tid, "lesson": lesson, "sequence": sequence, "speaker": "", "text": item["fr"], "translation": item["es"], "tts_fallback": True, "section": "vocabulary", "type": "word", "language": "French", "difficulty": "A2", "source_episode": lesson})
        lessons.append({"number": lesson, "title": f"Lección {lesson:02d} — {episode['title']}", "track_ids": ids})
    return tracks, lessons


def write_support_files(tracks):
    BOOK.mkdir(parents=True, exist_ok=True)
    with (BOOK / "Audio_Master.csv").open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.writer(fh); writer.writerow(["id", "type", "speaker_or_blank", "text", "translation_or_blank"])
        for t in tracks: writer.writerow([t["id"], t["type"], t["speaker"], t["text"], t["translation"]])
    (BOOK / "Audios_Tecnico.txt").write_text("# HanStory HF-CRITICAL-S1 — especificación de audio\n\nVoz francesa Audrey (Premium), con respaldo TTS del navegador.\n", encoding="utf-8")
    parts=["<!doctype html><html lang='es'><head><meta charset='utf-8'><title>Critical Hit — Français</title><style>body{font-family:system-ui;line-height:1.6;max-width:900px;margin:auto;padding:30px;background:#fffaf7}.box{padding:16px;margin:18px 0;border:1px solid #eadfd6;border-radius:12px}.fr{font-size:1.1em}.es{color:#555}</style></head><body>", "<h1>Critical Hit — Français · Épisodes 1–50</h1><p>Sélection pédagogique de phrases de la version française. Les crédits de l'épisode 51 ne sont pas inclus comme leçon.</p>"]
    for n,e in enumerate(EPISODES,1):
        parts.append(f"<section class='box'><h2>Lección {n:02d} — {escape(e['title'])}</h2><p>{escape(e['summary'])}</p><h3>Frases</h3>")
        for p in e['p']: parts.append(f"<p><span class='fr' lang='fr'>{escape(p['fr'])}</span><br><span class='es'>{escape(p['es'])}</span></p>")
        parts.append("<h3>Vocabulario</h3>")
        for v in e['v']: parts.append(f"<p><b lang='fr'>{escape(v['fr'])}</b><br><span class='es'>{escape(v['es'])}</span></p>")
        parts.append("</section>")
    (BOOK/'book.html').write_text(''.join(parts)+"</body></html>",encoding='utf-8')


def update_library():
    path=WEB/'library'/'library.json'; data=json.loads(path.read_text(encoding='utf-8'))
    data['books']=[b for b in data['books'] if b.get('code')!=CODE]
    data['books'].append({"code":CODE,"title":"Critical Hit — Français · Épisodes 1–50","display_order":0,"type":"Libro","series":"HanStory","target_language":"French","explanation_language":"Spanish","visibility":"public","version":"1.0.0","cover":"","manifest":f"books/{CODE}/hanstory_manifest.json","updated_at":datetime.now(timezone.utc).isoformat().replace('+00:00','Z')})
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding='utf-8')


def main():
    tracks, lessons=make_tracks(); write_support_files(tracks)
    now=datetime.now(timezone.utc).isoformat().replace('+00:00','Z')
    manifest={"schema_version":1,"project_code":CODE,"title":"Critical Hit — Français · Épisodes 1–50","subtitle":"Comédie · série complète","description":"Sélection pédagogique de phrases françaises des épisodes 1 à 50, avec traducciones españolas y vocabulario en contexto.","version":"1.0.0","source_language":"French","target_language":"French","explanation_language":"Spanish","audio_mode":"browser-tts","total_lessons":len(EPISODES),"total_tracks":len(tracks),"cover":"","available_playback_modes":["Frases"],"lessons":lessons,"tracks":tracks,"technical_order_source":"Audio_Master.csv + Audios_Tecnico.txt","published_at":now,"updated_at":now,"source_title":"Critical Hit","source_url":"https://www.webtoons.com/fr/comedy/critical-hit/list?title_no=9104","source_scope":"Episodios 1–50; selección breve para estudio. El episodio 51 es una página de créditos y se excluye como lección."}
    (BOOK/'hanstory_manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding='utf-8')
    (BOOK/'PUBLISH_REPORT.txt').write_text(f"HanStory Web — PAQUETE CREADO\nCódigo: {CODE}\nTítulo: {manifest['title']}\n\nLecciones: {len(EPISODES)}\nPistas: {len(tracks)} (200 frases + 150 entradas de vocabulario)\nFuente: WEBTOON, edición francesa, episodios 1–50.\nEdición: selección breve para estudio; no reproduce la transcripción completa.\n\nQA de contenido:\n- El OCR se utilizó únicamente como borrador.\n- Se hizo revisión visual manual de muestras y corrección de frases seleccionadas.\n- El episodio 51 de créditos se excluyó como lección.\n",encoding='utf-8')
    (BOOK/'Web_Explanations_Report.txt').write_text("Pendiente de completar antes de publicar: desglose palabra por palabra y notas gramaticales.\n",encoding='utf-8')
    update_library(); print(json.dumps({"code":CODE,"lessons":len(EPISODES),"tracks":len(tracks),"book":str(BOOK)},ensure_ascii=False))


if __name__=='__main__': main()
