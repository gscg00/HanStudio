from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from html import escape
from pathlib import Path


WEB = Path(__file__).resolve().parents[1]
CODE = "HF-44-S1"
BOOK = WEB / "library" / "books" / CODE


def P(fr: str, es: str, speaker: str = ""):
    return {"fr": fr, "es": es, "speaker": speaker}


def V(fr: str, es: str):
    return {"fr": fr, "es": es}


# Curated study selection from the French WEBTOON edition. The complete comic is
# intentionally not reproduced here; these are short, useful phrases per episode.
EPISODES = [
    {"title": "La dernière consigne", "summary": "Avant la sonnerie, la classe reçoit une mission qui exige méthode et prudence.", "p": [
        P("Laissez-moi récapituler une dernière fois avant que la cloche ne sonne.", "Déjenme resumirlo una última vez antes de que suene la campana."),
        P("Je vais juste revoir les points principaux vu qu'on n'a pas beaucoup de temps.", "Solo voy a repasar los puntos principales, porque no tenemos mucho tiempo."),
        P("Ne prenez aucun risque.", "No corran ningún riesgo."),
        P("Si quelque chose vous paraît louche, fuyez.", "Si algo les parece sospechoso, huyan."),
        P("On trouvera la solution ensemble après.", "Después encontraremos juntos la solución."),
    ], "v": [V("la cloche", "la campana"), V("récapituler", "resumir / repasar"), V("un risque", "un riesgo"), V("louche", "sospechoso") ]},
    {"title": "Le cercle noir", "summary": "Un cercle noir engloutit el instituto y los alumnos intentan entender qué ocurrió.", "p": [
        P("Hé, attention !", "¡Oye, cuidado!"), P("Au secours !", "¡Auxilio!"), P("Qu'est-ce qui se passe ?", "¿Qué está pasando?"), P("Tout le monde va bien ?", "¿Todos están bien?"), P("Personne n'est blessé ?", "¿Nadie está herido?"),
    ], "v": [V("un cercle noir", "un círculo negro"), V("engloutir", "engullir / tragarse"), V("être blessé", "estar herido"), V("un témoignage", "un testimonio") ]},
    {"title": "La porte arrière", "summary": "La clase descubre que el peligro es real y que la puerta trasera puede ser la única salida inmediata.", "p": [
        P("Ouvre la porte arrière !", "¡Abre la puerta trasera!"), P("Qu'est-ce qui se passe ?", "¿Qué está pasando?"), P("Le monstre nous a laissés dans la classe et a disparu silencieusement.", "El monstruo nos dejó en el aula y desapareció en silencio."), P("Notre professeur est mort.", "Nuestro profesor ha muerto."), P("Tout ce qu'on pouvait faire, c'était de pleurer derrière la porte close.", "Lo único que podíamos hacer era llorar detrás de la puerta cerrada."),
    ], "v": [V("la porte arrière", "la puerta trasera"), V("disparaître", "desaparecer"), V("silencieusement", "en silencio"), V("une porte close", "una puerta cerrada") ]},
    {"title": "La théorie des survivants", "summary": "Un alumno presenta una teoría sobre las personas que quizá regresaron de los círculos negros.", "p": [
        P("On peut survivre et revenir à l'extérieur ?", "¿Se puede sobrevivir y regresar al exterior?"), P("Personne n'est jamais ressorti des cercles noirs.", "Nadie ha vuelto a salir de los círculos negros."), P("Comment tu sais qu'on peut s'en sortir ?", "¿Cómo sabes que podemos salir de esta?"), P("Mon oncle est un survivant non officiel.", "Mi tío es un superviviente no oficial."), P("Tu appelles ça une hypothèse ?", "¿A eso le llamas una hipótesis?"),
    ], "v": [V("survivre", "sobrevivir"), V("ressortir", "volver a salir"), V("s'en sortir", "salir de esta / lograrlo"), V("une hypothèse", "una hipótesis") ]},
    {"title": "La carte", "summary": "El grupo decide cartografiar el laberinto y aprovechar cada pausa para avanzar.", "p": [
        P("C'est un véritable labyrinthe là-dehors.", "Ahí fuera hay un auténtico laberinto."), P("C'est pour ça qu'il faut procéder méthodiquement.", "Por eso hay que proceder metódicamente."), P("Il faut dessiner une carte.", "Hay que dibujar un mapa."), P("On sortira à chaque pause pour compléter notre carte.", "Saldremos en cada descanso para completar nuestro mapa."), P("On finira par avoir une carte pour sortir d'ici.", "Al final tendremos un mapa para salir de aquí."),
    ], "v": [V("un labyrinthe", "un laberinto"), V("procéder", "proceder"), V("méthodiquement", "metódicamente"), V("compléter", "completar") ]},
    {"title": "Les souvenirs d'avant", "summary": "Mientras buscan una salida, los estudiantes recuerdan la vida normal que tenían unas horas antes.", "p": [
        P("Comment on en est arrivés là ?", "¿Cómo llegamos a esto?"), P("Tout allait bien il y a quelques heures à peine...", "Todo iba bien hace apenas unas horas..."), P("Jeongwu a raison.", "Jeongwu tiene razón."), P("On doit se concentrer pour faire sortir tout le monde d'ici sains et saufs.", "Tenemos que concentrarnos para sacar a todos de aquí sanos y salvos."), P("Mes parents me manquent...", "Extraño a mis padres..."),
    ], "v": [V("à peine", "apenas"), V("avoir raison", "tener razón"), V("se concentrer", "concentrarse"), V("manquer à quelqu'un", "hacerle falta a alguien") ]},
    {"title": "Les couloirs dessinés", "summary": "Unos dibujos parecen indicar el camino hacia otros alumnos, pero seguirlos también implica peligro.", "p": [
        P("Ne pars pas, Doyun, tout seul comme ça.", "No te vayas solo así, Doyun."), P("J'espère que tu vas bien, Jiwoo.", "Espero que estés bien, Jiwoo."), P("On va où d'abord ?", "¿Adónde vamos primero?"), P("Mon instinct me disait qu'ils nous mèneraient à Jiwoo.", "Mi instinto me decía que nos llevarían hasta Jiwoo."), P("Je suis sûr qu'on va les trouver.", "Estoy seguro de que los encontraremos."),
    ], "v": [V("tout seul", "completamente solo"), V("un instinct", "un instinto"), V("mener à", "llevar a"), V("trouver", "encontrar") ]},
    {"title": "Le monstre des pauses", "summary": "El grupo descubre que las pausas no garantizan la seguridad y que el cronómetro es esencial.", "p": [
        P("J'arrive toujours pas à croire que c'est notre lycée.", "Todavía no puedo creer que este sea nuestro instituto."), P("Faites gaffe, vous pourriez vous tordre la cheville.", "Cuidado, podrían torcerse el tobillo."), P("T'en fais pas pour eux.", "No te preocupes por ellos."), P("Suffit de garder un œil sur le chrono.", "Solo hay que vigilar el cronómetro."), P("On peut toujours croiser des monstres pendant les pauses.", "Siempre podemos encontrarnos con monstruos durante los descansos."),
    ], "v": [V("faire gaffe", "tener cuidado"), V("se tordre la cheville", "torcerse el tobillo"), V("garder un œil sur", "vigilar"), V("croiser", "encontrarse con") ]},
    {"title": "La première expédition", "summary": "Tras una persecución, el grupo regresa con una pista sobre las debilidades de los monstruos.", "p": [
        P("Une fois la source du bruit éliminée, le monstre a arrêté de nous poursuivre.", "Una vez eliminada la fuente del ruido, el monstruo dejó de perseguirnos."), P("T'as envie de mourir ?", "¿Te quieres morir?"), P("Je... j'ai paniqué et mon esprit s'est vidé.", "Yo... entré en pánico y me quedé en blanco."), P("Quand j'ai repris mes esprits, j'étais tout seul...", "Cuando recuperé el sentido, estaba completamente solo..."), P("Bon. Allons retrouver les autres.", "Bien. Vamos a encontrar a los demás."),
    ], "v": [V("une source", "una fuente"), V("poursuivre", "perseguir"), V("paniquer", "entrar en pánico"), V("reprendre ses esprits", "recuperar el sentido") ]},
    {"title": "Yerim n'est pas revenue", "summary": "La desaparición de Yerim provoca tensión y acusaciones dentro del grupo.", "p": [
        P("Le groupe D a abandonné Yerim dans le couloir.", "El grupo D abandonó a Yerim en el pasillo."), P("Qu'est-ce qui s'est passé ? Pourquoi Yerim n'est pas revenue ?", "¿Qué pasó? ¿Por qué no volvió Yerim?"), P("Ah, vous êtes là. Dieu merci, vous allez bien.", "Ah, están aquí. Gracias a Dios, están bien."), P("Faut le virer !", "¡Hay que echarlo!"), P("Si Yerim revient pas, ça fait de toi un meurtrier.", "Si Yerim no vuelve, eso te convierte en un asesino."),
    ], "v": [V("abandonner", "abandonar"), V("un couloir", "un pasillo"), V("revenir", "volver"), V("virer quelqu'un", "echar a alguien") ]},
    {"title": "Ne laisse personne derrière", "summary": "El grupo intenta mantener la calma, comprobar las aulas y no dejar atrás a nadie.", "p": [
        P("On y est allés tous les quatre et on a bien vérifié partout.", "Fuimos los cuatro y revisamos bien todo."), P("Calmez-vous, ce n'est pas le moment de vous chamailler.", "Cálmense, no es momento de pelearse."), P("Lave-toi le visage et sors quand tu auras fini de pleurer.", "Lávate la cara y sal cuando termines de llorar."), P("On sera dans le couloir.", "Estaremos en el pasillo."), P("Ouais ! Je peux y arriver !", "¡Sí! ¡Puedo lograrlo!"),
    ], "v": [V("vérifier", "comprobar"), V("se chamailler", "pelearse"), V("se laver le visage", "lavarse la cara"), V("y arriver", "lograrlo") ]},
    {"title": "Le double", "summary": "Una voz y una figura duplicada hacen que el grupo replantee las reglas de los monstruos.", "p": [
        P("Pourquoi tu me regardes comme ça ?", "¿Por qué me miras así?"), P("Il n'y avait aucun moyen de la ramener.", "No había manera de traerla de vuelta."), P("Mon oncle n'est qu'un survivant, pas une encyclopédie des phénomènes surnaturels.", "Mi tío solo es un superviviente, no una enciclopedia de fenómenos sobrenaturales."), P("Après que Yerim soit sortie, on aurait dit que sa voix venait de l'intérieur des toilettes.", "Después de que Yerim saliera, parecía que su voz venía del interior de los baños."), P("C'est le mieux que tu peux faire ?", "¿Eso es lo mejor que puedes hacer?"),
    ], "v": [V("ramener", "traer de vuelta"), V("une encyclopédie", "una enciclopedia"), V("surnaturel", "sobrenatural"), V("à l'intérieur", "en el interior") ]},
    {"title": "La porte verrouillée", "summary": "El equipo busca a Yerim, discute sobre la ruta y recuerda que todos deben salir vivos.", "p": [
        P("La porte est verrouillée.", "La puerta está cerrada con llave."), P("Pourquoi elle est verrouillée ?", "¿Por qué está cerrada con llave?"), P("Ferme-la si tu sais pas de quoi tu parles.", "Cállate si no sabes de qué estás hablando."), P("On est venus ici pour se disputer ou pour retrouver Yerim ?", "¿Vinimos aquí a discutir o a encontrar a Yerim?"), P("Le plus important, c'est que tout le monde sorte d'ici vivant.", "Lo más importante es que todos salgan vivos de aquí."),
    ], "v": [V("verrouillé", "cerrado con llave"), V("se disputer", "discutir / pelearse"), V("retrouver", "reencontrar"), V("le plus important", "lo más importante") ]},
    {"title": "Les règles et les zones", "summary": "Una nueva hipótesis propone que cada regla solo funciona cerca del monstruo correspondiente.", "p": [
        P("Peut-être que les règles qu'on devait suivre partout dans l'école ne s'appliquent plus partout maintenant.", "Quizá las reglas que debíamos seguir por todo el instituto ya no se aplican en todas partes."), P("On pourrait peut-être explorer.", "Tal vez podríamos explorar."), P("Si on peut confirmer ça, ça nous enlèverait beaucoup de pression.", "Si podemos confirmar eso, nos quitaría mucha presión."), P("Ce dont on avait le plus besoin, c'était le courage de ressortir dehors.", "Lo que más necesitábamos era el valor para volver a salir."), P("Il faut qu'on fasse quelque chose si on veut s'échapper.", "Tenemos que hacer algo si queremos escapar."),
    ], "v": [V("s'appliquer", "aplicarse"), V("explorer", "explorar"), V("confirmer", "confirmar"), V("s'échapper", "escapar") ]},
    {"title": "La septième expédition", "summary": "La fatiga aumenta mientras el grupo sigue explorando y busca una ruta que no haya probado.", "p": [
        P("Je suis crevée...", "Estoy agotada..."), P("On va tous crever ici !", "¡Todos vamos a morir aquí!"), P("Arrête un peu.", "Ya basta."), P("On a déjà fait six expéditions et on ne l'a pas vu.", "Ya hicimos seis expediciones y no lo hemos visto."), P("Il est temps qu'on fasse demi-tour.", "Ya es hora de que demos la vuelta."),
    ], "v": [V("être crevé", "estar agotado"), V("arrêter", "parar"), V("une expédition", "una expedición"), V("faire demi-tour", "dar la vuelta") ]},
    {"title": "Le groupe C", "summary": "El silencio del pasillo y el cansancio obligan a decidir si seguir a otro grupo o regresar.", "p": [
        P("La visibilité était faible dans le couloir.", "La visibilidad era escasa en el pasillo."), P("On les suit.", "Los seguimos."), P("Je vais y retourner.", "Voy a volver allí."), P("Je la connais.", "La conozco."), P("C'est chiant. Reste pas plantée là.", "Qué fastidio. No te quedes ahí parada."),
    ], "v": [V("la visibilité", "la visibilidad"), V("faible", "escaso / débil"), V("suivre", "seguir"), V("rester planté", "quedarse parado") ]},
    {"title": "La règle oubliée", "summary": "Un recuerdo incompleto puede revelar qué regla activó al monstruo y qué camino queda abierto.", "p": [
        P("Miji, arrête de pleurer et essaie de te souvenir.", "Miji, deja de llorar e intenta recordar."), P("On va faire quoi ?", "¿Qué vamos a hacer?"), P("Je viens de réaliser que j'ai eu un blanc total quand c'est arrivé.", "Acabo de darme cuenta de que me quedé completamente en blanco cuando ocurrió."), P("On doit tous sortir d'ici.", "Todos tenemos que salir de aquí."), P("Tu devrais t'en sortir si tu marches.", "Deberías lograrlo si caminas."),
    ], "v": [V("se souvenir", "recordar"), V("un blanc", "un bloqueo mental"), V("réaliser", "darse cuenta"), V("marcher", "caminar") ]},
    {"title": "Attendre les autres", "summary": "La espera aumenta la tensión, pero el grupo intenta descansar y proteger a los que siguen fuera.", "p": [
        P("Qu'est-ce que tu fais ?", "¿Qué estás haciendo?"), P("Tu sais que c'est interdit de jeter des trucs par terre.", "Sabes que está prohibido tirar cosas al suelo."), P("Ne me parle plus jamais de mourir.", "No vuelvas a hablarme de morir."), P("Je ne veux pas entendre ces mots.", "No quiero oír esas palabras."), P("On se détend et on attend que les autres groupes arrivent.", "Nos calmamos y esperamos a que lleguen los otros grupos."),
    ], "v": [V("interdit", "prohibido"), V("jeter", "tirar"), V("se détendre", "relajarse"), V("arriver", "llegar") ]},
    {"title": "Sécurité d'abord", "summary": "El grupo establece reglas de seguridad y trata de interpretar nuevas deformaciones del edificio.", "p": [
        P("Tiens ! Merci !", "¡Toma! ¡Gracias!"), P("C'est pour ça que vous nous avez fait prendre un autre chemin.", "Por eso nos hicieron tomar otro camino."), P("Sécurité d'abord.", "La seguridad es lo primero."), P("On sait comment s'en occuper.", "Sabemos cómo encargarnos de eso."), P("Si vous croisez un monstre, restez calmes.", "Si se encuentran con un monstruo, mantengan la calma."),
    ], "v": [V("tenir", "sostener / tener"), V("prendre un chemin", "tomar un camino"), V("la sécurité", "la seguridad"), V("s'occuper de", "encargarse de") ]},
    {"title": "Les tapis de saut", "summary": "Un nuevo espacio parece conectado con dibujos y obliga al grupo a elegir entre quedarse o avanzar.", "p": [
        P("Cet endroit n'a pas l'air sûr.", "Este lugar no parece seguro."), P("Vous êtes sûrs que ces dessins viennent des élèves ?", "¿Están seguros de que estos dibujos son de los alumnos?"), P("Je vais t'aider.", "Voy a ayudarte."), P("On n'a plus beaucoup de temps.", "Ya no nos queda mucho tiempo."), P("La sonnerie risque de retentir avant qu'on revienne.", "La campana podría sonar antes de que volvamos."),
    ], "v": [V("avoir l'air", "parecer"), V("un dessin", "un dibujo"), V("aider", "ayudar"), V("retentir", "resonar / sonar") ]},
    {"title": "Le monstre immobile", "summary": "El grupo descubre que permanecer inmóvil no siempre protege y busca el punto débil del monstruo.", "p": [
        P("On sera en sécurité tant qu'on reste calmes.", "Estaremos a salvo mientras mantengamos la calma."), P("Si vous tombez sur un monstre, rappelez-vous une chose.", "Si se encuentran con un monstruo, recuerden una cosa."), P("Ce monstre attaque même quand on reste immobile.", "Este monstruo ataca incluso cuando nos quedamos inmóviles."), P("À quoi je sers, moi ?", "¿Para qué sirvo yo?"), P("Éloignons-nous d'abord.", "Alejémonos primero."),
    ], "v": [V("tant que", "mientras"), V("tomber sur", "encontrarse con"), V("immobile", "inmóvil"), V("s'éloigner", "alejarse") ]},
    {"title": "Le rôle du délégué", "summary": "Jeongwu duda de su liderazgo mientras el grupo se prepara para otra expedición.", "p": [
        P("Cherchez s'il y a des tenues de rechange !", "¡Busquen si hay uniformes de repuesto!"), P("Je suis délégué de classe. Le leader.", "Soy el delegado de la clase. El líder."), P("Mais c'est ma faute si quelqu'un n'est pas revenu.", "Pero es culpa mía si alguien no volvió."), P("On peut encore retrouver Yerim.", "Todavía podemos encontrar a Yerim."), P("Je vais les éviter. Toi, trouve comment nous sortir de là.", "Yo los esquivaré. Tú encuentra cómo sacarnos de aquí."),
    ], "v": [V("une tenue de rechange", "un uniforme de repuesto"), V("un délégué", "un delegado"), V("une faute", "una culpa"), V("éviter", "esquivar") ]},
    {"title": "La porte qu'il ne faut pas ouvrir", "summary": "Una puerta cerrada vuelve a despertar sospechas justo cuando termina el tiempo de la expedición.", "p": [
        P("Je te jure, j'ai entendu quelque chose là-dedans.", "Te juro que oí algo ahí dentro."), P("Pourquoi tu veux encore l'ouvrir ?", "¿Por qué quieres abrirla otra vez?"), P("On l'a verrouillée pour une bonne raison !", "¡La cerramos con llave por una buena razón!"), P("On est de retour.", "Hemos vuelto."), P("Bon retour, les gars.", "Bienvenidos de vuelta, chicos."),
    ], "v": [V("jurer", "jurar"), V("entendre", "oír"), V("verrouiller", "cerrar con llave"), V("bon retour", "bienvenidos de vuelta") ]},
    {"title": "Le laboratoire", "summary": "El grupo investiga una zona de ciencias y relaciona sus reglas con el monstruo que la protege.", "p": [
        P("Si seulement j'avais été un peu plus rapide...", "Si tan solo hubiera sido un poco más rápida..."), P("Pourquoi tu essaies d'aider si c'est pour te faire entraîner aussi ?", "¿Por qué intentas ayudar si también vas a quedar atrapada?"), P("J'avais une question sur les monstres...", "Tenía una pregunta sobre los monstruos..."), P("Est-ce que chaque monstre n'a qu'une seule règle qui s'applique ?", "¿Cada monstruo solo tiene una regla que se aplica?"), P("Regarde le monstre !", "¡Mira al monstruo!"),
    ], "v": [V("si seulement", "si tan solo"), V("essayer de", "intentar"), V("être entraîné", "quedar arrastrado / atrapado"), V("s'appliquer", "aplicarse") ]},
    {"title": "Les nouveaux survivants", "summary": "El grupo conoce a otros supervivientes y decide intercambiar información para aumentar sus posibilidades.", "p": [
        P("Tu as fait une bonne sieste ?", "¿Dormiste bien la siesta?"), P("Est-ce qu'on peut discuter ?", "¿Podemos hablar?"), P("Je sais que c'est vraiment dur pour vous en ce moment.", "Sé que ahora mismo esto es realmente difícil para ustedes."), P("Et si on faisait connaissance pour commencer ?", "¿Y si empezamos por conocernos?"), P("Maintenant qu'on est ensemble, autant être francs les uns envers les autres.", "Ahora que estamos juntos, más vale que seamos sinceros entre nosotros."),
    ], "v": [V("une sieste", "una siesta"), V("discuter", "hablar / conversar"), V("faire connaissance", "conocerse"), V("être franc", "ser sincero") ]},
    {"title": "La huitième expédition", "summary": "La octava expedición fija tres objetivos: encontrar una salida, buscar pistas y entender las deformaciones.", "p": [
        P("Vous comptez vraiment y aller ?", "¿De verdad piensan ir?"), P("On ne peut pas rester plantés là éternellement.", "No podemos quedarnos ahí parados eternamente."), P("On s'est fixé trois objectifs pour cette huitième expédition.", "Nos fijamos tres objetivos para esta octava expedición."), P("Chercher des indices sur nos camarades disparus.", "Buscar pistas sobre nuestros compañeros desaparecidos."), P("On devrait vérifier l'endroit où tu as trébuché.", "Deberíamos revisar el lugar donde tropezaste."),
    ], "v": [V("compter faire", "tener pensado hacer"), V("se fixer un objectif", "fijarse un objetivo"), V("un indice", "una pista"), V("trébucher", "tropezar") ]},
    {"title": "L'infirmerie", "summary": "La enfermería conserva partes intactas y ofrece pistas sobre cómo se deforman los espacios.", "p": [
        P("Joyeux anniversaire, maman.", "Feliz cumpleaños, mamá."), P("Le cadeau me touche, mais ce qui m'émeut encore plus, c'est que vous l'ayez préparé tous les deux.", "El regalo me conmueve, pero me emociona todavía más que lo hayan preparado los dos."), P("Alors, vous vous êtes enfin réconciliés ?", "Entonces, ¿por fin se reconciliaron?"), P("Quand quelque chose tombe dans un cercle noir, ce qui est proche des êtres vivants garde sa forme d'origine.", "Cuando algo cae en un círculo negro, lo que está cerca de los seres vivos conserva su forma original."), P("Mais ça devrait aller...", "Pero debería estar bien..."),
    ], "v": [V("toucher", "conmover / tocar"), V("s'émouvoir", "emocionarse"), V("se réconcilier", "reconciliarse"), V("garder sa forme", "conservar su forma") ]},
    {"title": "Le journal", "summary": "Una conversación sobre un diario coincide con una nueva pista en la enfermería.", "p": [
        P("Je me suis réconcilié avec Dohyeon.", "Me reconcilié con Dohyeon."), P("C'est malpoli de regarder le téléphone des gens sans demander.", "Es de mala educación mirar el teléfono de la gente sin pedir permiso."), P("Pourquoi t'as enregistré ?", "¿Por qué lo grabaste?"), P("C'est l'occasion parfaite pour t'y mettre aussi !", "¡Es la ocasión perfecta para que tú también empieces!"), P("L'odeur de désinfectant est vraiment forte par ici.", "El olor a desinfectante es muy fuerte por aquí."),
    ], "v": [V("malpoli", "maleducado"), V("enregistrer", "grabar"), V("s'y mettre", "ponerse a ello"), V("du désinfectant", "desinfectante") ]},
    {"title": "Les retrouvailles", "summary": "Dos estudiantes se reencuentran, pero todavía deben atravesar el laberinto para estar a salvo.", "p": [
        P("Qu'est-ce qui t'est arrivé jusqu'à maintenant ?", "¿Qué te ha pasado hasta ahora?"), P("Comment tu t'es retrouvée ici ?", "¿Cómo terminaste aquí?"), P("Les retrouvailles peuvent attendre qu'on sorte d'ici en un seul morceau.", "El reencuentro puede esperar hasta que salgamos enteros de aquí."), P("Je n'ai pas eu le temps de réfléchir.", "No tuve tiempo de pensar."), P("On doit juste passer ce monstre derrière le rideau, et on est libres.", "Solo tenemos que pasar este monstruo detrás de la cortina y seremos libres."),
    ], "v": [V("une retrouvaille", "un reencuentro"), V("jusqu'à maintenant", "hasta ahora"), V("en un seul morceau", "entero / sano y salvo"), V("un rideau", "una cortina") ]},
    {"title": "Le labyrinthe", "summary": "El grupo entiende que los pasillos pueden convertirse en muros y que la salida no es sencilla.", "p": [
        P("Voilà où on en est pour l'instant.", "Así estamos por ahora."), P("C'est plus simple de vous montrer.", "Es más fácil enseñárselo."), P("Nouveau Wongyun à la rescousse !", "¡El nuevo Wongyun al rescate!"), P("Une fois fermé, on ne peut plus l'ouvrir de l'intérieur !", "Una vez cerrada, ¡ya no se puede abrir desde dentro!"), P("C'est un foutu labyrinthe ! Pas question que j'entre !", "¡Es un maldito laberinto! ¡Ni hablar de que entre!"),
    ], "v": [V("pour l'instant", "por ahora"), V("à la rescousse", "al rescate"), V("de l'intérieur", "desde dentro"), V("pas question", "ni hablar / de ninguna manera") ]},
    {"title": "L'école qui se transforme", "summary": "Los edificios chocan y el instituto cambia de forma, bloqueando los caminos de regreso.", "p": [
        P("Voilà pourquoi rester dans la classe n'est pas la meilleure solution.", "Por eso quedarse en el aula no es la mejor solución."), P("On dirait que les escaliers ont gonflé.", "Parece que las escaleras se han hinchado."), P("L'école est en train de se transformer.", "El instituto se está transformando."), P("Reviens tout de suite.", "Vuelve ahora mismo."), P("Les autres vont s'inquiéter. Faut y aller.", "Los demás se van a preocupar. Tenemos que irnos."),
    ], "v": [V("rester", "quedarse"), V("un escalier", "una escalera"), V("gonfler", "hincharse"), V("s'inquiéter", "preocuparse") ]},
    {"title": "La corde", "summary": "Sin salida visible, los alumnos fabrican una cuerda con mantas para bajar por el edificio.", "p": [
        P("Fini ! Ça tremble.", "¡Basta! Está temblando."), P("Selon Dohyeon, le labyrinthe n'a pas de sortie.", "Según Dohyeon, el laberinto no tiene salida."), P("Il faut que je trouve une solution !", "¡Tengo que encontrar una solución!"), P("Une corde suffira pour nous en sortir !", "¡Una cuerda bastará para sacarnos de aquí!"), P("Les gars, rassemblez des couvertures et des oreillers. Vite !", "Chicos, junten mantas y almohadas. ¡Rápido!"),
    ], "v": [V("trembler", "temblar"), V("une sortie", "una salida"), V("suffire", "bastar"), V("rassembler", "reunir / juntar") ]},
    {"title": "L'infirmière-monstre", "summary": "La trampa de la enfermería se complica y el grupo intenta liberar a Seojeong antes de que termine el tiempo.", "p": [
        P("Seojeong, t'es où ?", "Seojeong, ¿dónde estás?"), P("Cinq minutes. Ça fait déjà...", "Cinco minutos. Ya han pasado..."), P("Cette infirmière-monstre est bien condamnée à rester dans le labyrinthe, n'est-ce pas ?", "Esta enfermera monstruo está condenada a quedarse en el laberinto, ¿verdad?"), P("Le seul moyen qu'elle sorte, c'est qu'on soit malades.", "La única forma de que salga es que estemos enfermos."), P("Les murs alentour commençaient à gonfler et à fondre.", "Las paredes de alrededor empezaban a hincharse y derretirse."),
    ], "v": [V("une infirmière", "una enfermera"), V("être condamné à", "estar condenado a"), V("alentour", "de alrededor"), V("fondre", "derretirse") ]},
    {"title": "Un nouveau cercle noir", "summary": "La temporada termina con los supervivientes frente a una nueva aparición que podría cambiarlo todo.", "p": [
        P("Wongyun, dis quelque chose...", "Wongyun, di algo..."), P("Je t'en supplie, dis quelque chose !", "¡Te lo ruego, di algo!"), P("On n'entend plus rien... Ça doit être fini...", "Ya no se oye nada... Debe de haber terminado..."), P("On fait quoi maintenant ?", "¿Qué hacemos ahora?"), P("C'est quoi ce bordel ? Un cercle noir ?", "¿Qué demonios es esto? ¿Un círculo negro?"),
    ], "v": [V("je t'en supplie", "te lo ruego"), V("ne plus rien entendre", "ya no oír nada"), V("être fini", "haber terminado"), V("ce bordel", "este desastre / qué demonios") ]},
]


def make_tracks():
    tracks = []
    lessons = []
    for lesson, episode in enumerate(EPISODES, 1):
        ids = []
        for sequence, item in enumerate(episode["p"], 1):
            track_id = f"HF44S1{lesson:02d}{sequence:02d}"
            ids.append(track_id)
            tracks.append({
                "id": track_id, "lesson": lesson, "sequence": sequence,
                "speaker": item["speaker"], "text": item["fr"], "translation": item["es"],
                "tts_fallback": True, "section": "scene", "type": "phrase", "language": "French",
                "difficulty": "A2", "source_episode": lesson,
            })
        for offset, item in enumerate(episode["v"], len(episode["p"]) + 1):
            track_id = f"HF44S1W{(lesson - 1) * 4 + offset - len(episode['p']):03d}"
            ids.append(track_id)
            tracks.append({
                "id": track_id, "lesson": lesson, "sequence": offset,
                "speaker": "", "text": item["fr"], "translation": item["es"],
                "tts_fallback": True, "section": "vocabulary", "type": "word", "language": "French",
                "difficulty": "A2", "source_episode": lesson,
            })
        lessons.append({"number": lesson, "title": f"Lección {lesson:02d} — {episode['title']}", "track_ids": ids})
    return tracks, lessons


def write_csv(tracks):
    with (BOOK / "Audio_Master.csv").open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(["id", "type", "speaker_or_blank", "text", "translation_or_blank"])
        for track in tracks:
            writer.writerow([track["id"], track["type"], track["speaker"], track["text"], track["translation"]])


def write_technical(tracks):
    lines = [
        "# HanStory HF-44-S1 — especificación técnica de audio",
        "",
        "Este paquete se publica con tts_fallback=true: la app utiliza la voz francesa del navegador.",
        "No se incluyen MP3 grabados; Audio_Master.csv conserva el orden y el texto para una futura generación de audio.",
        "",
    ]
    for lesson, episode in enumerate(EPISODES, 1):
        lines.append(f"### Lección {lesson:02d} — {episode['title']}")
        lines.append(f"Frases: {len(episode['p'])} · Vocabulario: {len(episode['v'])}")
        lines.append("Perfil recomendado: francés estándar de Francia; ritmo conversacional claro.")
        lines.append("")
    (BOOK / "Audios_Tecnico.txt").write_text("\n".join(lines), encoding="utf-8")


def write_explanations(tracks):
    items = {}
    for track in tracks:
        if track["type"] == "phrase":
            items[track["id"]] = {
                "natural_meaning_es": track["translation"],
                "explanation_es": "Frase seleccionada de la edición francesa del episodio para practicar comprensión y producción oral.",
                "usage_notes_es": ["Escúchala como un bloque completo y repítela manteniendo el ritmo de la escena."],
                "breakdown": [], "grammar_notes": [], "listening_tip_es": "Fíjate en las contracciones y en la entonación de la pregunta o la advertencia.",
            }
    out = BOOK / "explanations" / "track_explanations.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"schema_version": 1, "items": items}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_html(tracks):
    parts = ["<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>44th Period — Français · Saison 1</title><style>",
             "body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;line-height:1.65;margin:0;background:#fbfaf7;color:#222}main{max-width:900px;margin:auto;padding:38px 24px}h1,h2,h3{line-height:1.25}h1{font-size:2.1em;border-bottom:2px solid #ddd;padding-bottom:.4em}.lesson{page-break-before:always;margin-top:56px}.box{background:#fff;border:1px solid #e4dfd5;border-radius:14px;padding:18px 22px;margin:18px 0}.fr{font-size:1.12em}.es{color:#444}.speaker{font-weight:700}.id{font-size:.78em;color:#777}.hero{background:#173f35;color:#fffaf2;border-radius:18px;padding:24px}.vocab{display:grid;grid-template-columns:1fr 1fr;gap:8px}.vocab div{background:#f3eee6;border-radius:10px;padding:8px 10px}@media(max-width:600px){.vocab{grid-template-columns:1fr}}</style></head><body><main>",
             "<div class=\"hero\"><h1>44th Period: Survival Class<br>Français · Saison 1</h1><p>Edición pedagógica de 34 episodios de la temporada 1 en la traducción francesa de WEBTOON.</p><p>Selección de frases útiles, traducción natural al español y vocabulario en contexto. No es una transcripción íntegra del webtoon.</p></div>"]
    for lesson, episode in enumerate(EPISODES, 1):
        phrase_tracks = [t for t in tracks if t["lesson"] == lesson and t["type"] == "phrase"]
        word_tracks = [t for t in tracks if t["lesson"] == lesson and t["type"] == "word"]
        parts.append(f"<section class=\"lesson\"><h2>Lección {lesson:02d} — {escape(episode['title'])}</h2><div class=\"box\"><p>{escape(episode['summary'])}</p><p><strong>Objetivo:</strong> Comprender frases naturales de la escena y reutilizarlas en una conversación.</p><p class=\"id\">Fuente: temporada 1, episodio {lesson}. Las frases son una selección breve para estudio.</p></div><div class=\"box\"><h3>Frases seleccionadas</h3>")
        for track in phrase_tracks:
            parts.append(f"<p><span class=\"fr\" lang=\"fr\">{escape(track['text'])}</span><br><span class=\"es\">{escape(track['translation'])}</span><br><span class=\"id\">{track['id']} · TTS del navegador</span></p>")
        parts.append("</div><div class=\"box\"><h3>Vocabulario</h3><div class=\"vocab\">")
        for track in word_tracks:
            parts.append(f"<div><strong lang=\"fr\">{escape(track['text'])}</strong><br><span class=\"es\">{escape(track['translation'])}</span><br><span class=\"id\">{track['id']}</span></div>")
        parts.append("</div></div><div class=\"box\"><h3>Mini práctica</h3><ul><li>Escucha las frases sin mirar el español.</li><li>Repite dos frases y cambia un detalle de la situación.</li><li>Explica en español qué problema aparece en este episodio.</li></ul></div></section>")
    parts.append("</main></body></html>")
    (BOOK / "book.html").write_text("".join(parts), encoding="utf-8")


def update_library():
    path = WEB / "library" / "library.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    data["books"] = [book for book in data["books"] if book.get("code") != CODE]
    data["books"].append({
        "code": CODE, "title": "44th Period: Survival Class — Français · Saison 1", "display_order": 0,
        "type": "Libro", "series": "HanStory", "target_language": "French", "explanation_language": "Spanish",
        "visibility": "public", "version": "1.0.0", "cover": "", "manifest": f"books/{CODE}/hanstory_manifest.json",
        "updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    })
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    BOOK.mkdir(parents=True, exist_ok=True)
    tracks, lessons = make_tracks()
    write_csv(tracks)
    write_technical(tracks)
    write_explanations(tracks)
    write_html(tracks)
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    manifest = {
        "schema_version": 1, "project_code": CODE, "title": "44th Period: Survival Class — Français · Saison 1",
        "subtitle": "Thriller scolaire · 34 épisodes", "description": "Sélection pédagogique de phrases françaises de la saison 1, avec traductions espagnoles.",
        "version": "1.0.0", "source_language": "French", "target_language": "French", "explanation_language": "Spanish",
        "audio_mode": "browser-tts", "total_lessons": len(EPISODES), "total_tracks": len(tracks), "cover": "",
        "available_playback_modes": ["Frases"], "lessons": lessons, "tracks": tracks,
        "technical_order_source": "Audio_Master.csv + Audios_Tecnico.txt", "published_at": now, "updated_at": now,
        "source_title": "44th Period: Survival Class", "source_url": "https://www.webtoons.com/fr/thriller/44th-period-survival-class/list?title_no=8344",
        "source_scope": "Saison 1, épisodes 1–34; sélection courte de phrases, non-transcription intégrale.",
    }
    (BOOK / "hanstory_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (BOOK / "PUBLISH_REPORT.txt").write_text(
        f"HanStory Web — PAQUETE CREADO\nCódigo: {CODE}\nTítulo: {manifest['title']}\n\n"
        f"Lecciones: {len(EPISODES)}\nPistas: {len(tracks)} ({len(EPISODES)*5} frases + {len(EPISODES)*4} entradas de vocabulario)\n"
        "Audio: no se incluyen MP3; todas las pistas usan tts_fallback=true y voz francesa del navegador.\n"
        "Fuente: WEBTOON, edición francesa, temporada 1, episodios 1–34.\n"
        "Edición: selección breve para estudio; no reproduce la transcripción completa.\n\n"
        "QA de contenido:\n"
        "- El OCR se utilizó únicamente como borrador de localización.\n"
        "- Se hizo lectura visual manual de viñetas y corrección de frases seleccionadas.\n"
        "- Muestras visuales revisadas: episodios 1, 5, 10, 14, 20, 27 y 34; se corrigieron cortes, signos y palabras unidas.\n"
        "- La navegación del visor confirmó 34 episodios de la S1.\n\n"
        "Para generar audio grabado más adelante, usar Audio_Master.csv respetando los IDs del manifest.\n",
        encoding="utf-8",
    )
    (BOOK / "Web_Explanations_Report.txt").write_text(
        f"{len([t for t in tracks if t['type']=='phrase'])} explicaciones de frase generadas.\n"
        "Cada explicación indica traducción natural, práctica de repetición y pista de escucha.\n"
        "Las entradas están enlazadas por ID al manifest.\n", encoding="utf-8")
    update_library()
    print(json.dumps({"code": CODE, "book": str(BOOK), "lessons": len(EPISODES), "tracks": len(tracks)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
