"""Word-level teaching data for the French 44th Period study package.

This is deliberately a small pedagogical lexicon, not a machine translation
engine.  The phrase list is curated and this module explains the exact forms
that appear in that list, including common spoken contractions.
"""

from __future__ import annotations

import re
import unicodedata


TOKEN_RE = re.compile(r"[A-Za-zÀ-ÿŒœÆæ]+(?:[’'][A-Za-zÀ-ÿŒœÆæ]+)*")


def _n(value: str) -> str:
    value = value.lower().replace("’", "'")
    return "".join(c for c in unicodedata.normalize("NFD", value) if unicodedata.category(c) != "Mn")


# Surface forms are used so that the learner sees what is actually heard.
# Each value is (Spanish meaning, grammatical/use note).
LEXICON = {
    # Pronouns, articles, determiners and connectors
    "je": ("yo", "pronombre sujeto"), "j'ai": ("yo he / tengo", "je + ai; elisión"),
    "j'arrive": ("llego / consigo", "je + arrive; elisión"), "j'espère": ("espero", "je + espère; elisión"),
    "j'étais": ("yo estaba", "je + étais; elisión"), "j'avais": ("yo tenía / había", "je + avais; elisión"),
    "j'avais": ("yo tenía / había", "je + avais; elisión"), "j'ai": ("yo he / tengo", "je + ai; elisión"),
    "j'étais": ("yo estaba", "je + étais; elisión"), "j'entre": ("entro", "je + entre; elisión"),
    "j'": ("yo", "forma elidida de je"), "tu": ("tú", "pronombre sujeto"),
    "t'as": ("tú has / tienes", "tu + as; forma hablada"), "t'en": ("te ... de eso", "tu + en; forma hablada"),
    "t'es": ("tú eres / estás", "tu + es; forma hablada"), "t'y": ("te ... allí / en ello", "tu + y; elisión"),
    "toi": ("tú / a ti", "pronombre tónico"), "il": ("él", "pronombre sujeto"),
    "elle": ("ella", "pronombre sujeto"), "on": ("uno / nosotros", "pronombre sujeto; muy común para nosotros"),
    "nous": ("nosotros", "pronombre sujeto"), "vous": ("ustedes / usted", "pronombre sujeto"),
    "ils": ("ellos", "pronombre sujeto"), "les": ("los / las", "artículo o pronombre"),
    "lui": ("él / a él", "pronombre"), "la": ("la", "artículo o pronombre"), "le": ("el / lo", "artículo o pronombre"),
    "un": ("un", "artículo indefinido"), "une": ("una", "artículo indefinido"), "des": ("unos / unas", "artículo indefinido plural"),
    "du": ("del / algo de", "de + le; artículo partitivo"), "au": ("al", "à + le"), "aux": ("a los / a las", "à + les"),
    "ce": ("este / eso", "demostrativo"), "cette": ("esta", "demostrativo"), "ces": ("estos / estas", "demostrativo plural"),
    "ça": ("eso", "pronombre demostrativo hablado"), "c'est": ("es / esto es", "ce + est; presentación"),
    "c'était": ("era / fue", "ce + était; imperfecto"), "c'est": ("es / esto es", "ce + est; elisión gráfica"),
    "qu'est-ce": ("qué es lo que", "expresión interrogativa"), "qu'on": ("que nosotros / que uno", "que + on; elisión"),
    "qu'il": ("que él / que ...", "que + il; elisión"), "qu'elle": ("que ella", "que + elle; elisión"),
    "qu'ils": ("que ellos", "que + ils; elisión"), "qu'une": ("que una", "que + une; elisión"),
    "qu'on": ("que nosotros / que uno", "que + on; elisión"), "n'est": ("no es / no está", "ne + est; negación"),
    "n'a": ("no tiene / no ha", "ne + a; negación"), "n'ont": ("no tienen / no han", "ne + ont; negación"),
    "n'y": ("no hay / no ... allí", "ne + y; negación"), "ne": ("no", "primer elemento de la negación"),
    "pas": ("no", "segundo elemento de la negación"), "plus": ("más / ya no", "adverbio; con ne = ya no"),
    "aucun": ("ningún", "determinante negativo"), "personne": ("nadie / persona", "pronombre o sustantivo"),
    "tout": ("todo", "determinante o pronombre"), "tous": ("todos", "pronombre/determinante plural"),
    "toutes": ("todas", "determinante plural femenino"), "quelque": ("algún / algo de", "determinante"),
    "quelque": ("algún / algo de", "determinante"), "chose": ("cosa", "sustantivo femenino"),
    "qui": ("que / quién", "pronombre relativo o interrogativo"), "que": ("que", "conjunción o pronombre"),
    "quoi": ("qué", "pronombre interrogativo"), "où": ("dónde / donde", "adverbio relativo"),
    "comment": ("cómo", "adverbio interrogativo"), "pourquoi": ("por qué", "adverbio interrogativo"),
    "à": ("a / en", "preposición"), "de": ("de", "preposición"), "d'abord": ("primero", "de + abord; expresión"),
    "dans": ("en / dentro de", "preposición"), "sur": ("sobre / en", "preposición"), "sous": ("debajo de", "preposición"),
    "pour": ("para", "preposición"), "par": ("por", "preposición"), "avec": ("con", "preposición"),
    "sans": ("sin", "preposición"), "avant": ("antes de", "preposición/adverbio"), "après": ("después de", "preposición/adverbio"),
    "en": ("en / de ello", "preposición o pronombre"), "y": ("allí / a ello", "pronombre adverbial"),
    "comme": ("como", "comparación o manera"), "si": ("si", "conjunción condicional"), "ou": ("o", "conjunción"),
    "et": ("y", "conjunción"), "mais": ("pero", "conjunción"), "alors": ("entonces", "conector"),
    "donc": ("por lo tanto", "conector"), "pourtant": ("sin embargo", "conector"), "parce": ("porque", "parte de parce que"),
    "vu": ("dado que / visto", "participio usado como conector"), "que": ("que", "conjunción"),
    "pendant": ("durante", "preposición"), "jusqu'à": ("hasta", "jusque + à; expresión"), "selon": ("según", "preposición"),
    "tant": ("mientras / tanto", "parte de tant que"), "pourquoi": ("por qué", "interrogativo"),
    # Frequent verbs and forms in the selected dialogue
    "laissez-moi": ("déjenme", "imperativo de laisser + pronombre moi"), "récapituler": ("resumir / recapitular", "infinitivo"),
    "sonne": ("suene", "sonner, presente de subjuntivo"), "vais": ("voy", "aller, presente"),
    "revoir": ("repasar / volver a ver", "infinitivo"), "n'a": ("no tiene / no ha", "negación"),
    "prenez": ("tomen", "prendre, imperativo formal/plural"), "fuyez": ("huyan", "fuir, imperativo formal/plural"),
    "paraît": ("parece", "paraître, presente"), "trouvera": ("encontrará", "futur de trouver"),
    "trouver": ("encontrar", "infinitivo"), "trouveras": ("encontrarás", "futur de trouver"), "trouveront": ("encontrarán", "futur de trouver"),
    "va": ("va", "aller, presente"), "vont": ("van", "aller, presente"), "allez": ("vayan / van", "aller; imperativo o presente"),
    "allons": ("vamos", "aller, imperativo de nous"), "allés": ("ido(s)", "participio de aller"), "aller": ("ir", "infinitivo"),
    "ouvre": ("abre", "ouvrir, imperativo"), "a": ("ha / tiene", "avoir, presente"), "a": ("ha / tiene", "avoir, presente"),
    "laissés": ("dejado(s)", "laisser, participio pasado"), "disparu": ("desaparecido", "disparaître, participio pasado"),
    "est": ("es / está", "être, presente"), "mort": ("muerto", "morir/être mort"), "pouvait": ("podía", "pouvoir, imperfecto"),
    "faire": ("hacer", "infinitivo"), "c'était": ("era / fue", "demostrativo + imperfecto"), "pleurer": ("llorar", "infinitivo"),
    "peut": ("puede", "pouvoir, presente"), "survivre": ("sobrevivir", "infinitivo"), "revenir": ("volver", "infinitivo"),
    "ressorti": ("salido de nuevo", "ressortir, participio pasado"), "sais": ("sabes", "savoir, presente"), "s'en": ("salir de ello", "se + en; parte de s'en sortir"),
    "sortir": ("salir", "infinitivo"), "appelles": ("llamas", "appeler, presente"), "procéder": ("proceder", "infinitivo"),
    "faut": ("hace falta / hay que", "falloir, expresión impersonal"), "dessiner": ("dibujar", "infinitivo"),
    "sortira": ("saldrá / saldremos", "futur de sortir"), "compléter": ("completar", "infinitivo"), "finira": ("terminará", "futur de finir"),
    "avoir": ("tener / haber", "infinitivo"), "en": ("en / de ello", "preposición o pronombre"), "arrivés": ("llegado(s)", "arriver, participio pasado"),
    "allait": ("iba / estaba yendo", "aller, imperfecto"), "concentrer": ("concentrar", "infinitivo"), "faire": ("hacer", "infinitivo"),
    "manquent": ("hacen falta / extrañan", "manquer, presente"), "pars": ("te vayas / partes", "partir, imperativo"),
    "j'espère": ("espero", "esperer, presente con elisión"), "vas": ("vas", "aller, presente"), "disait": ("decía", "dire, imperfecto"),
    "mèneraient": ("llevarían", "mener, condicional"), "suis": ("soy / estoy", "être, presente"), "trouver": ("encontrar", "infinitivo"),
    "j'arrive": ("llego / consigo", "arriver, presente con elisión"), "croire": ("creer", "infinitivo"), "faites": ("hagan / hacen", "faire, imperativo o presente"),
    "pourriez": ("podrían", "pouvoir, condicional"), "tordre": ("torcer", "infinitivo"), "fais": ("haces", "faire, presente"),
    "suffit": ("basta", "suffire, presente"), "garder": ("guardar / mantener", "infinitivo"), "croiser": ("cruzarse con", "infinitivo"),
    "éliminée": ("eliminada", "participio pasado femenino"), "a": ("ha / tiene", "avoir, presente"), "arrêté": ("parado / dejado de", "participio de arrêter"),
    "poursuivre": ("perseguir", "infinitivo"), "as": ("has / tienes", "avoir, presente"), "envie": ("ganas", "sustantivo en avoir envie"),
    "paniqué": ("entrado en pánico", "participio pasado"), "s'est": ("se ha / se ...", "se + est; verbo pronominal"), "vidé": ("vaciado", "participio pasado"),
    "repris": ("recuperado / retomado", "reprendre, participio pasado"), "étais": ("estaba / era", "être, imperfecto"), "retrouver": ("reencontrar", "infinitivo"),
    "abandonné": ("abandonado", "participio pasado"), "s'est": ("se ha / se ...", "forma pronominal"), "passé": ("pasado / ocurrido", "passer, participio"),
    "revenue": ("regresado", "revenir, participio femenino"), "êtes": ("son / están", "être, presente"), "virer": ("echar / despedir", "infinitivo coloquial"),
    "revient": ("vuelve", "revenir, presente"), "fait": ("hace / convierte", "faire, presente"), "de": ("de", "preposición"),
    "y": ("allí / a ello", "pronombre adverbial"), "sommes": ("somos / estamos", "être, presente"), "vérifié": ("revisado / comprobado", "participio pasado"),
    "calmez-vous": ("cálmense", "imperativo pronominal"), "chamailler": ("pelearse / discutir", "infinitivo"), "lave-toi": ("lávate", "imperativo pronominal"),
    "sors": ("sal / sales", "sortir, imperativo o presente"), "auras": ("habrás / tendrás", "avoir, futuro"), "fini": ("terminado", "participio pasado"),
    "sera": ("será / estará", "être, futuro"), "peux": ("puedo / puedes", "pouvoir, presente"), "arriver": ("lograr / llegar", "infinitivo"),
    "regardes": ("miras", "regarder, presente"), "avait": ("había / tenía", "avoir, imperfecto"), "ramener": ("traer de vuelta", "infinitivo"),
    "soit": ("sea / esté", "être, subjuntivo"), "aurait": ("habría / tendría", "avoir, condicional"), "dit": ("dicho", "dire, participio"),
    "venait": ("venía", "venir, imperfecto"), "connais": ("conozco", "connaître, presente"), "reste": ("quédate / queda", "rester, imperativo o presente"),
    "arrête": ("para / detén", "arrêter, imperativo"), "essaie": ("intenta", "essayer, presente/imperativo"), "souvenir": ("recordar", "infinitivo pronominal"),
    "viens": ("vengo / ven", "venir, presente o imperativo"), "réaliser": ("darse cuenta", "infinitivo"), "eu": ("tenido", "avoir, participio"),
    "arrivé": ("ocurrido / llegado", "participio pasado"), "devrais": ("deberías", "devoir, condicional"), "marches": ("caminas / camines", "marcher, presente o subjuntivo"),
    "sais": ("sabes", "savoir, presente"), "interdit": ("prohibido", "participio usado como adjetivo"), "jeter": ("tirar", "infinitivo"),
    "parle": ("habla", "parler, imperativo o presente"), "veux": ("quieres", "vouloir, presente"), "entendre": ("oír", "infinitivo"),
    "détend": ("relaja", "détendre, presente"), "attend": ("espera", "attendre, imperativo o presente"), "arrivent": ("llegan", "arriver, presente"),
    "tiens": ("toma / mira", "tenir, imperativo"), "avez": ("han / tienen", "avoir, presente"), "fait": ("hecho", "faire, participio o presente"),
    "prendre": ("tomar", "infinitivo"), "sait": ("sabe", "savoir, presente"), "occuper": ("ocuparse de", "infinitivo"), "croisez": ("se crucen con", "croiser, subjuntivo/imperativo"),
    "restez": ("quédense / permanezcan", "rester, imperativo"), "a": ("ha / tiene", "avoir, presente"), "l'air": ("parecer / tener aspecto", "expresión avoir l'air"),
    "viennent": ("vienen / proceden", "venir, presente"), "aider": ("ayudar", "infinitivo"), "n'a": ("no tiene / no ha", "negación"),
    "risque": ("corre el riesgo / riesgo", "risquer, presente o sustantivo"), "retentir": ("resonar", "infinitivo"), "revienne": ("volvamos / regresemos", "revenir, subjuntivo"),
    "reste": ("permanezca", "rester, presente"), "tombez": ("caigan", "tomber, subjuntivo/imperativo"), "rappelez-vous": ("recuerden", "imperativo pronominal"),
    "attaque": ("ataca", "attaquer, presente"), "sers": ("sirvo", "servir, presente"), "éloignons-nous": ("alejémonos", "imperativo pronominal"),
    "cherchez": ("busquen", "chercher, imperativo"), "y": ("allí / a ello", "pronombre adverbial"), "comptez": ("cuentan / tienen pensado", "compter, presente"),
    "rester": ("quedarse", "infinitivo"), "s'est": ("se ha / se ...", "forma pronominal"), "fixé": ("fijado", "participio pasado"),
    "chercher": ("buscar", "infinitivo"), "devrait": ("debería", "devoir, condicional"), "vérifier": ("revisar / comprobar", "infinitivo"),
    "trébuché": ("tropezado", "participio pasado"), "touche": ("conmueve / toca", "toucher, presente"), "émeut": ("emociona", "émouvoir, presente"),
    "ayez": ("hayan / tengan", "avoir, subjuntivo"), "préparé": ("preparado", "participio pasado"), "vous êtes": ("se han / están", "être pronominal"),
    "réconciliés": ("reconciliado(s)", "participio pasado pronominal"), "tombe": ("cae", "tomber, presente"), "garde": ("conserva / guarda", "garder, presente"),
    "t'y": ("te pongas a ello", "te + y; expresión s'y mettre"), "mettre": ("poner", "infinitivo"), "enregistrer": ("grabar", "infinitivo"),
    "peut": ("puede", "pouvoir, presente"), "discuter": ("conversar", "infinitivo"), "faisait": ("hacía", "faire, imperfecto"), "fasse": ("hagamos / haga", "faire, subjuntivo"),
    "commencer": ("empezar", "infinitivo"), "être": ("ser / estar", "infinitivo"), "comptez": ("piensan / cuentan", "compter, presente"),
    "plantés": ("plantados / parados", "participio usado como adjetivo"), "fixé": ("fijado", "participio pasado"), "disparus": ("desaparecidos", "participio/adjetivo"),
    "devrait": ("debería", "devoir, condicional"), "réfléchir": ("reflexionar / pensar", "infinitivo"), "passer": ("pasar", "infinitivo"),
    "est": ("es / está", "être, presente"), "en": ("en", "preposición"), "train": ("proceso", "parte de être en train de"), "transformer": ("transformar", "infinitivo"),
    "reviens": ("vuelve", "revenir, imperativo"), "s'inquiéter": ("preocuparse", "infinitivo pronominal"), "faut": ("hay que", "falloir, forma impersonal"),
    "tremble": ("tiembla", "trembler, presente"), "suffira": ("bastará", "suffire, futuro"), "rassemblez": ("reúnan / junten", "rassembler, imperativo"),
    "faites": ("hagan", "faire, imperativo"), "t'es": ("estás", "tu + es; forma hablada"), "est": ("está", "être, presente"),
    "condamnée": ("condenada", "participio pasado femenino"), "sorte": ("salga", "sortir, subjuntivo"), "soit": ("sea / esté", "subjuntivo"),
    "soyons": ("seamos / estemos", "être, subjuntivo o imperativo"), "commençaient": ("comenzaban", "commencer, imperfecto"), "gonfler": ("hincharse", "infinitivo"),
    "fondre": ("derretirse", "infinitivo"), "dis": ("di / dices", "dire, imperativo o presente"), "supplie": ("ruego / suplico", "supplier, presente"),
    "entend": ("oye / se oye", "entendre, presente"), "doit": ("debe", "devoir, presente"), "être": ("ser / estar", "infinitivo"),
    "fini": ("terminado", "participio pasado"), "fait": ("hacemos / hace", "faire, presente"), "bordel": ("desastre / lío", "sustantivo vulgar"),
    # Useful nouns, adjectives and adverbs
    "dernière": ("última", "adjetivo femenino"), "fois": ("vez", "sustantivo femenino"), "cloche": ("campana", "sustantivo femenino"),
    "points": ("puntos", "sustantivo plural"), "principaux": ("principales", "adjetivo plural"), "beaucoup": ("mucho", "adverbio de cantidad"), "temps": ("tiempo", "sustantivo"),
    "aucun": ("ningún", "determinante"), "risque": ("riesgo", "sustantivo"), "louche": ("sospechoso", "adjetivo coloquial"), "solution": ("solución", "sustantivo femenino"),
    "ensemble": ("juntos", "adverbio"), "après": ("después", "adverbio"), "attention": ("cuidado / atención", "interjección/sustantivo"), "secours": ("auxilio", "expresión au secours"),
    "monde": ("mundo / gente", "sustantivo"), "bien": ("bien", "adverbio"), "blessé": ("herido", "adjetivo/participio"), "porte": ("puerta", "sustantivo femenino"),
    "arrière": ("trasera / atrás", "adjetivo/adverbio"), "monstre": ("monstruo", "sustantivo"), "classe": ("clase / aula", "sustantivo"), "silencieusement": ("silenciosamente", "adverbio"),
    "notre": ("nuestro/a", "determinante posesivo"), "professeur": ("profesor", "sustantivo"), "tout": ("todo", "determinante"), "derrière": ("detrás de", "preposición/adverbio"), "close": ("cerrada", "adjetivo femenino"),
    "extérieur": ("exterior", "sustantivo/adjetivo"), "cercles": ("círculos", "sustantivo plural"), "noirs": ("negros", "adjetivo plural"), "oncle": ("tío", "sustantivo"), "survivant": ("superviviente", "sustantivo"),
    "officiel": ("oficial", "adjetivo"), "hypothèse": ("hipótesis", "sustantivo femenino"), "véritable": ("auténtico", "adjetivo"), "labyrinthe": ("laberinto", "sustantivo"), "là-dehors": ("ahí fuera", "adverbio compuesto"),
    "méthodiquement": ("metódicamente", "adverbio"), "carte": ("mapa", "sustantivo femenino"), "pause": ("descanso", "sustantivo femenino"), "heures": ("horas", "sustantivo plural"), "peine": ("apenas", "en à peine"),
    "raison": ("razón", "sustantivo"), "sains": ("sanos", "adjetivo plural"), "saufs": ("salvos / a salvo", "adjetivo plural"), "parents": ("padres", "sustantivo plural"),
    "seul": ("solo", "adjetivo"), "seule": ("sola", "adjetivo"), "instinct": ("instinto", "sustantivo"), "sûr": ("seguro", "adjetivo"), "lycée": ("instituto / preparatoria", "sustantivo"),
    "garde": ("vigila / guarda", "verbo o sustantivo"), "œil": ("ojo", "sustantivo"), "chrono": ("cronómetro", "sustantivo coloquial"), "monstres": ("monstruos", "sustantivo plural"), "source": ("fuente", "sustantivo"),
    "bruit": ("ruido", "sustantivo"), "envie": ("ganas", "sustantivo"), "esprit": ("mente / sentido", "sustantivo"), "groupe": ("grupo", "sustantivo"), "couloir": ("pasillo", "sustantivo"),
    "Dieu": ("Dios", "nombre propio"), "merci": ("gracias", "interjección"), "meurtrier": ("asesino", "sustantivo"), "quatre": ("cuatro", "número"), "moment": ("momento", "sustantivo"),
    "visage": ("rostro / cara", "sustantivo"), "mieux": ("mejor", "adverbio"), "moyen": ("medio / manera", "sustantivo"), "encyclopédie": ("enciclopedia", "sustantivo"), "phénomènes": ("fenómenos", "sustantivo plural"),
    "surnaturels": ("sobrenaturales", "adjetivo plural"), "voix": ("voz", "sustantivo"), "intérieur": ("interior / dentro", "sustantivo/adjetivo"), "toilettes": ("baños / aseo", "sustantivo plural"),
    "porte": ("puerta", "sustantivo"), "important": ("importante", "adjetivo"), "règles": ("reglas", "sustantivo plural"), "école": ("escuela", "sustantivo"), "pression": ("presión", "sustantivo"),
    "courage": ("valor", "sustantivo"), "chose": ("cosa", "sustantivo"), "expéditions": ("expediciones", "sustantivo plural"), "visibilité": ("visibilidad", "sustantivo"), "faible": ("baja / débil", "adjetivo"),
    "chiant": ("molesto / fastidioso", "adjetivo coloquial"), "blanc": ("blanco / vacío mental", "sustantivo/adjetivo"), "mots": ("palabras", "sustantivo plural"), "sécurité": ("seguridad", "sustantivo"),
    "endroit": ("lugar", "sustantivo"), "dessins": ("dibujos", "sustantivo plural"), "élèves": ("alumnos", "sustantivo plural"), "sonnerie": ("timbre / campana", "sustantivo"), "sécurité": ("seguridad", "sustantivo"),
    "chose": ("cosa", "sustantivo"), "immobile": ("inmóvil", "adjetivo"), "tenues": ("prendas / uniformes", "sustantivo plural"), "rechange": ("repuesto / cambio", "sustantivo"),
    "délégué": ("delegado", "sustantivo"), "leader": ("líder", "sustantivo"), "faute": ("culpa / error", "sustantivo"), "bonne": ("buena", "adjetivo"), "raison": ("razón", "sustantivo"),
    "question": ("pregunta", "sustantivo"), "règle": ("regla", "sustantivo"), "sieste": ("siesta", "sustantivo"), "dur": ("difícil / duro", "adjetivo"), "moment": ("momento", "sustantivo"),
    "francs": ("sinceros / francos", "adjetivo plural"), "objectifs": ("objetivos", "sustantivo plural"), "indices": ("pistas", "sustantivo plural"), "camarades": ("compañeros", "sustantivo plural"),
    "huitième": ("octava", "número ordinal"), "endroit": ("lugar", "sustantivo"), "anniversaire": ("cumpleaños", "sustantivo"), "maman": ("mamá", "sustantivo afectivo"),
    "cadeau": ("regalo", "sustantivo"), "téléphone": ("teléfono", "sustantivo"), "gens": ("gente", "sustantivo plural"), "occasion": ("ocasión", "sustantivo"), "parfait": ("perfecta", "adjetivo"),
    "odeur": ("olor", "sustantivo"), "désinfectant": ("desinfectante", "sustantivo"), "retrouvailles": ("reencuentro", "sustantivo plural"), "morceau": ("pedazo / trozo", "sustantivo"), "rideau": ("cortina", "sustantivo"),
    "simple": ("sencillo", "adjetivo"), "nouveau": ("nuevo", "adjetivo"), "rescousse": ("rescate / auxilio", "en à la rescousse"), "foutu": ("maldito", "adjetivo coloquial"),
    "meilleure": ("mejor", "adjetivo femenino"), "solution": ("solución", "sustantivo"), "escaliers": ("escaleras", "sustantivo plural"), "école": ("escuela", "sustantivo"),
    "suite": ("seguida / enseguida", "en tout de suite"), "autres": ("otros", "adjetivo/pronombre"), "corde": ("cuerda", "sustantivo"), "couvertures": ("mantas", "sustantivo plural"), "oreillers": ("almohadas", "sustantivo plural"),
    "minutes": ("minutos", "sustantivo plural"), "infirmière": ("enfermera", "sustantivo"), "murs": ("muros / paredes", "sustantivo plural"), "alentour": ("alrededor", "adverbio"), "cercle": ("círculo", "sustantivo"),
    "rien": ("nada", "pronombre indefinido"), "bordel": ("desastre / lío", "sustantivo vulgar"), "maintenant": ("ahora", "adverbio"), "gars": ("chicos", "sustantivo coloquial"),
    # Small but important adverbs/adjectives
    "juste": ("solo / justo", "adverbio o adjetivo"), "principal": ("principal", "adjetivo"), "là": ("ahí", "adverbio"), "vraiment": ("realmente", "adverbio"), "toujours": ("siempre", "adverbio"),
    "jamais": ("nunca", "adverbio negativo"), "non": ("no", "adverbio"), "officiel": ("oficial", "adjetivo"), "encore": ("todavía / otra vez", "adverbio"), "plus": ("más / ya no", "adverbio"),
    "peut-être": ("quizá", "adverbio"), "beaucoup": ("mucho", "adverbio"), "après": ("después", "adverbio"), "d'abord": ("primero", "locución"), "assez": ("bastante", "adverbio"),
    "vrai": ("verdadero", "adjetivo"), "bonne": ("buena", "adjetivo"), "bien": ("bien", "adverbio"), "enfin": ("por fin", "adverbio"), "franchement": ("francamente", "adverbio"),
    "éternellement": ("eternamente", "adverbio"), "seulement": ("solamente", "adverbio"), "déjà": ("ya", "adverbio"), "total": ("total", "adjetivo"), "autre": ("otro", "adjetivo"),
    "premier": ("primero", "adjetivo"), "tous": ("todos", "pronombre"), "quatre": ("cuatro", "número"), "six": ("seis", "número"), "trois": ("tres", "número"), "cinq": ("cinco", "número"),
    "huitième": ("octava", "ordinal"), "même": ("incluso / mismo", "adverbio o adjetivo"), "seul": ("solo", "adjetivo"), "tous": ("todos", "pronombre"), "envers": ("hacia / con respecto a", "preposición"),
}


SPECIAL = {
    "hÉ": ("oye", "interjección"), "hé": ("oye", "interjección"), "ouais": ("sí", "forma coloquial de oui"), "bon": ("bien / bueno", "interjección"),
    "au": ("al", "à + le"), "aux": ("a los / a las", "à + les"), "là-dehors": ("ahí fuera", "locución adverbial"),
}


def _lookup(token: str) -> tuple[str, str] | None:
    key = token.lower().replace("’", "'")
    if key in SPECIAL:
        return SPECIAL[key]
    if key in LEXICON:
        return LEXICON[key]
    normalized = _n(key)
    for candidate, value in {**LEXICON, **SPECIAL}.items():
        if _n(candidate) == normalized:
            return value
    # A few transparent French/Spanish cognates occurring in the dialogue.
    cognate = {
        "principaux": "principales", "solution": "solución", "classe": "clase", "professeur": "profesor",
        "survivant": "superviviente", "hypothese": "hipótesis", "labyrinthe": "laberinto", "carte": "mapa",
        "pause": "pausa", "parents": "padres", "instinct": "instinto", "monstres": "monstruos", "source": "fuente",
        "groupe": "grupo", "important": "importante", "pression": "presión", "courage": "coraje", "expeditions": "expediciones",
        "visibilite": "visibilidad", "securite": "seguridad", "dessins": "dibujos", "eleves": "alumnos", "sonnerie": "timbre",
        "leader": "líder", "question": "pregunta", "sieste": "siesta", "objectifs": "objetivos", "indices": "índices / pistas",
        "camarades": "camaradas / compañeros", "anniversaire": "aniversario", "telephone": "teléfono", "occasion": "ocasión",
        "parfait": "perfecto", "desinfectant": "desinfectante", "simple": "simple", "solution": "solución", "corde": "cuerda",
        "minutes": "minutos", "infirmiere": "enfermera", "murs": "muros", "cercle": "círculo", "maintenant": "ahora",
    }
    if normalized in cognate:
        return cognate[normalized], "palabra de vocabulario"
    return None


def breakdown_for(text: str) -> list[dict[str, str]]:
    result = []
    for token in TOKEN_RE.findall(text):
        found = _lookup(token)
        if found:
            meaning, function = found
        else:
            # Keep the surface form visible and make omissions explicit during
            # QA; the enrichment script refuses to publish unresolved forms.
            meaning, function = "REVISAR: significado pendiente", "forma no catalogada"
        result.append({"text": token, "meaning_es": meaning, "function_es": function})
    return result


def grammar_for(text: str) -> list[dict[str, str]]:
    notes = []
    if "ne " in text or "n'" in text or "n’" in text:
        notes.append({"pattern": "ne ... pas / ne ... plus / ne ... jamais", "explanation_es": "La negación normalmente rodea al verbo; en el habla informal, ne puede omitirse."})
    if "qu'est-ce" in text or "Pourquoi" in text or "Comment" in text or "À quoi" in text or text.endswith("?"):
        notes.append({"pattern": "Pregunta coloquial", "explanation_es": "La entonación ascendente ayuda a reconocer la pregunta; varias frases usan el orden hablado en lugar de una inversión formal."})
    if "il faut" in text or "Faut " in text or "Il faut" in text:
        notes.append({"pattern": "il faut + infinitivo", "explanation_es": "Expresa obligación impersonal: «hay que ...». En el habla, il puede desaparecer y quedar «faut»."})
    if "on " in text or "On " in text:
        notes.append({"pattern": "on", "explanation_es": "On puede significar «uno», pero en conversación suele equivaler a «nosotros»."})
    if "si " in text or "Si " in text:
        notes.append({"pattern": "si + presente", "explanation_es": "Introduce una condición: «si ...». El resultado puede aparecer en imperativo, futuro o presente."})
    if "pour que" in text or "pour compléter" in text or "pour sortir" in text or "pour faire" in text:
        notes.append({"pattern": "pour + infinitivo", "explanation_es": "Indica finalidad: «para ...»."})
    if "en train de" in text:
        notes.append({"pattern": "être en train de + infinitivo", "explanation_es": "Indica una acción en curso: «estar ...-ndo»."})
    if "une fois" in text or "Après que" in text or "Quand " in text or "quand " in text:
        notes.append({"pattern": "Conector temporal", "explanation_es": "Une fois, après que y quand sitúan una acción respecto de otra: «una vez», «después de que» y «cuando»."})
    if "si seulement" in text:
        notes.append({"pattern": "si seulement + plus-que-parfait", "explanation_es": "Expresa un lamento o deseo sobre el pasado: «si tan solo hubiera ...»."})
    if "c'est" in text or "C'est" in text or "Voilà" in text:
        notes.append({"pattern": "c'est / voilà", "explanation_es": "C'est presenta o identifica algo; voilà señala o resume: «aquí está», «así es»."})
    if "pourrait" in text or "pourriez" in text or "devrait" in text or "aurait" in text or "serait" in text:
        notes.append({"pattern": "Condicional", "explanation_es": "El condicional suaviza una propuesta o expresa posibilidad: «podría», «debería» o «sería»."})
    return notes


def unresolved_tokens(texts: list[str]) -> list[str]:
    missing = []
    for text in texts:
        for row in breakdown_for(text):
            if row["meaning_es"].startswith("REVISAR:") and row["text"] not in missing:
                missing.append(row["text"])
    return missing
