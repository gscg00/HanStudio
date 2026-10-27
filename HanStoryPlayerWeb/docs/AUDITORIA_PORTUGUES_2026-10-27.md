# Auditoría del curso de portugués (HanStoryPlayerWeb): alumno hispanohablante desde cero

Fecha: 2026-10-27 · Alcance: `library/courses/Portuguese` (course.json y 45 unidades activas; antes de la reparación: 6.030 actividades) · Variedad objetivo: portugués europeo (pt-PT), que es la voz del audio (`variantPolicy.wordTtsLanguage = pt-PT`).

**Método.**
- Recorrí todas las actividades con scripts `python3 -I`. Comprobé estructura, opciones, respuestas, audio, solapamiento entre unidades, posición de la respuesta y formas de Brasil.
- Leí completos los fundamentos (A0) y A1-1/A1-2. Muestreé A2-1 a B1-2 leyendo todas sus tarjetas, traducciones y la producción de cada unidad.

**Nota sobre la severidad.** Como en coreano, los repasos y las pruebas son copias literales de los ítems de lección: corregir un ítem obliga a corregir también sus copias. El script de reparación reemplaza siempre en toda la unidad.

---

## 0. Resumen en cifras

| Métrica | Valor (antes) |
|---|---|
| Unidades en `levels` / archivos en `units/` | 45 / 51 (6 huérfanos) |
| Actividades | 6.030 (1.039 teach_concept, 2.164 select_translation, 2.192 listening_choice) |
| Contenido distinto en *survival*, *time*, *reading-bridge* y *story-bridge* | **10 ítems en total**: las cuatro unidades eran la misma copia (pronombres + ser/estar/ter) |
| *questions* | 7 ítems, todos repetidos de `essentials-04/05` |
| Conjugación enseñada en A0 | **Ninguna** (solo infinitivos: ser, estar, ter, ir, vir, querer, poder, fazer) |
| Números enseñados en A0 | 1–10 (dentro de *vocabulary*); nada de 11–20, la hora ni los euros |
| Registro (tu / o senhor / você) | Sin explicar; `vocabulary` afirmaba «Este curso usa portugués brasileño» |
| Formas de Brasil sin etiquetar en A0 | suco, equipe, bebê, tela, aplicativo, xícara, marrom, cinza, sacola, metrô, ruim, por que, «está chovendo», «Meu/Minha» sin artículo, «Tem» = hay |
| Claves de audio ausentes del manifiesto | 0 |
| Posición de la respuesta (3 opciones) | 1.ª 37 %, 2.ª 33 %, 3.ª 29 % |

---

## 1. CRÍTICO

### C1. Cuatro unidades de fundamentos son la misma copia, y *questions* duplica *essentials*
- `survival` («Saludos, cortesía y expresiones»), `time` («Números, días, horas»), `reading-bridge` («Oraciones graduadas») y `story-bridge` contienen **exactamente** los mismos 10 ítems (eu, tu / você, ele, ela, nós, vocês, eles / elas, ser, estar, ter), en el mismo orden, con las mismas opciones. Son además los ítems de `essentials-01/02`.
- `questions` (o que, quem, onde, quando, como, por que, não) repite `essentials-04/05`.
- Resultado: el alumno termina A0 sin saludos (salvo en A1), sin números del 11 al 20, sin la hora, sin euros, sin frases para pedir ayuda y sin ninguna frase completa en las unidades «de lectura guiada».
- **Corrección:**
  - *survival*: saludos según la hora; obrigado/obrigada; desculpe, com licença; tu / o senhor / a senhora / você; pedir que repitan o hablen despacio; casa de banho.
  - *time*: 0–20 (um/uma, dois/duas; catorze; dezasseis/dezassete/dezanove con nota de Brasil), la hora (é uma / são duas), días de la semana (segunda-feira = «2.º día»), euros y cêntimos.
  - *questions*: preguntas completas (O que é isto? Onde fica…? Porquê? Porque é que…?) y sí/no/negación (Falas português? — Falo. Não falo inglês. Também não.).
  - *reading-bridge*: frases graduadas con los verbos conjugados y **estar a + infinitivo** (forma de Portugal).
  - *story-bridge*: artículos y contracciones (do, da, no, na, ao, à, num, numa) y posesivo con artículo (o meu livro), imprescindibles para leer las historias.

### C2. *reading* enseña sonidos erróneos y omite las reglas que más necesita un hispanohablante
- `portuguese-reading-02-2-*` (G): «ye». G es [g] (gato) y ante e/i [ʒ]; nunca «ye».
- `portuguese-reading-01-3-*` (C): «se» (solo vale ante e/i). `-04-2-*` (Q): «ke».
- `-06-1-*` (Z): «ze». Un mexicano lo leerá «se»; la z portuguesa es sonora.
- `-04-4-*` (S): «ese», sin decir que entre vocales suena z y al final sh (Portugal).
- `-03-5-*` (O): el distractor «u» es justamente como suena la o átona en Portugal.
- No hay ninguna práctica de: reducción de vocales átonas en pt-PT (pequeno [p(e)ˈkenu]), diptongos nasales ão/ãe/õe, -em/-im/-um finales, lh/nh/ch/ç/qu, s final [ʃ], s intervocálica [z], r/rr, z sonora, g/j [ʒ]. `reading-foundations` solo las menciona como reglas abstractas («depende de la variedad»).
- `reading-foundations / 00-11-b` pone como ejemplo «xícara» (forma de Brasil; en Portugal «chávena»).
- **Corrección:** respuestas correctas para C, G, J, Q, S, Z, E, O sin ejemplos que delaten la letra; lecciones nuevas `portuguese-reading-07` a `-10` (vocales átonas, nasales, dígrafos, sonidos según la posición) con transcripciones en el mismo formato en las tres opciones; 8 preguntas nuevas en la prueba.

### C3. A0 no enseña a conjugar
- `essentials` enseña verbos en infinitivo («ser = ser», «fazer = hacer»). En A1 aparecen sin explicación falo, sou, tenho, estou, vou, levanto-me, comemos, vivemos…
- **Corrección:** `portuguese-essentials-07` (presente regular -ar/-er/-ir: falo, falas, fala, falamos, falam; bebo; abrimos; vocês = ustedes, «vós» casi no se usa) y `-08` (sou, estou, tenho, vou, quero, posso, faço, con la tabla completa en los puntos), más una actividad de bloques («Eu não bebo café.») y una de escritura (falamos).

### C4. Variedad incoherente: A0 en portugués de Brasil, A1–B1 en portugués de Portugal
- `vocabulary-01-2` (você): «Este curso usa portugués brasileño: você es la forma común…». También en el huérfano `a2-2-description-and-comparison`. `vocabulary_seed.json` declara «portugués brasileño actual».
- A1–B1 usan Portugal (chamo-me, autocarro, comboio, casa de banho, telemóvel, estar a…), y el audio es pt-PT.
- Formas de Brasil sin etiqueta en `vocabulary`: suco, equipe, bebê, tela, aplicativo, xícara, marrom, cinza, sacola, metrô, ruim; ejemplos «está chovendo», «Ela levanta cedo», «Meu nome…», «Tem muita gente» (= hay). «por que» en `essentials-05-1`, `questions-02-1` y `vocabulary-32` (en Portugal: «Porquê?» / «Porque é que…?»).
- La glosa «tu / você = tú / usted» presenta você como el «usted» general. En Portugal el usted cortés es **o senhor / a senhora**; você puede sonar distante o brusco.
- **Corrección:** base pt-PT y Brasil etiquetado (como pide `variantPolicy`): sumo, equipa, bebé, ecrã, aplicação, chávena, castanho, cinzento, saco, metro, mau, cabide (en lugar del inexistente «porta-roupa»), con nota de la forma brasileña; ônibus, trem, banheiro y celular se mantienen porque ya estaban etiquetados (el test `portuguese_variants` los exige); porquê; posesivo con artículo; há; estar a chover; levanta-se.

### C5. Ejemplos agramaticales o incoherentes en *vocabulary*
| Ubicación | Actual | Corrección |
|---|---|---|
| `vocabulary-04-5` (nariz) | «Minha nariz está fria.» (nariz es masculino) | «O meu nariz está frio.» |
| `vocabulary-26-9` (internet) | «O internet está lento.» | «A internet está lenta.» |
| `vocabulary-01-9` (idade) | «Minha idade é dez anos.» (calco) | «Que idade tens?» |
| `vocabulary-28-5` (levantar) | «Ela levanta cedo.» | «Ela levanta-se cedo.» |
| `vocabulary-22-5/10` | «Janeiro é quente», «Junho é frio» (clima del hemisferio sur) | «Janeiro é frio», «Junho é quente» |
| `vocabulary-05-2` (dedo) | «machucado» (Brasil) | «magoado» |
| `vocabulary-12-3` | «porta-roupa = perchero» (no es de uso corriente) | «cabide = percha / perchero» |

---

## 2. IMPORTANTE

### I1. Traducciones erróneas o con registro mezclado
| Ubicación | Actual | Corrección |
|---|---|---|
| `a1-1-identity-04-15` | «Falo um pouco de português.» = «Hablo un poco de este idioma.» | «Hablo un poco de portugués.» |
| `a1-1-people-03-14` | «Quantos anos tem?» = «¿Cuántos años tienes?» (tem = usted/você; «tú» es tens) | «¿Cuántos años tiene?»; aceptar «Quantos anos tens?» |
| `a1-1-people-03-06` | criança = «niño» | «niño / niña», con nota: siempre femenino |
| `a1-2-weather-02-12` | «Leve um guarda-chuva.» = «Lleva un paraguas.» | «Lleve un paraguas.» |
| `a2-1-ability` | «Tem de mostrar o passaporte.» = «Debes mostrar tu pasaporte.» | «Tiene que mostrar el pasaporte.» |
| `a2-1-ability` | «Aqui pode tirar fotografias.» = «Aquí se puede tomar fotos.» | «Aquí puede tomar fotos.» |
| `a2-1-ability`, `a2-2-workStudy` | saber fazer = «saber» | «saber (hacer algo)» |
| `a2-1-services`, `a2-2-technology`, `a2-2-problemSolving` | conta = «factura»; «A conta não está certa» = «La factura no es correcta» (contradice «A conta, por favor» = la cuenta) | «cuenta (lo que hay que pagar)»; «La cuenta no está bien.» |
| `b1-2-nuance` | «No geral…» = «Hasta cierto punto…»; «Esta informação é fiável?» = «¿Qué tan segura…?»; «As expressões diferem ligeiramente» = «Hay una diferencia sutil…»; «Compreendo o teu ponto, mas discordo» = «…aunque lo veo de otra manera» | Traducciones literales: «En general…», «¿Esta información es fiable?», «Las expresiones difieren ligeramente», «…pero no estoy de acuerdo» |
| `b1-2-projects` | «O que vem primeiro?» = «Tenemos que decidir qué es prioritario.» | «¿Qué va primero?» |
| `b1-2-negotiation` | «Aceitaria se mudássemos…» = «…si cambiamos»; «Então, concordamos?» = «¿quedamos de acuerdo en este plan?» | «…si cambiáramos»; «Entonces, ¿estamos de acuerdo?» |
| `b1-2-conditions` | «Se tivesse tempo» = «Si tuviera **más** tiempo»; «Se precisares…» = «En caso de que…» | Sin añadidos |

### I2. Falsos amigos sin aviso
- `escritório = oficina`: no avisa que **oficina** en portugués es «taller».
- `copo = vaso`, `acordar = despertarse` (no «acordar» ni «recordar»), `tirar` (= quitar/sacar), `largo` (= ancho), `tarde` (= tarde / la tarde).
- No aparecen y conviene introducirlos en A1–A2 con nota: polvo (pulpo), esquisito (raro), apelido (apellido), propina (tasa universitaria), borracha (goma de borrar), embaraçada (avergonzada), ementa (menú), talher (cubierto).
- **Corrección:** `usage_note` de falso amigo en escritório, copo, acordar, rio/largo, tarde, aula/turma y en las frases con tirar.

### I3. Producción: variantes correctas rechazadas y diálogos sin margen
- Todas las producciones de A1 tienen una sola respuesta aceptada. Se rechazan, por ejemplo: «Como te chamas?», «Sou mexicano.», «Quantos anos tens?», «A chave está na mesa.», «Levanto-me às 7.», «Vou à escola.», «Aceitam cartão?», «Chego às 8.», «Sou alérgico à penicilina.».
- Las misiones `stage_scenario` de 3 turnos exigen 3/3.
- `a1-2-health`: el alumno debe decir «Tome isto duas vezes por dia» (frase del médico) en `speak` y en el diálogo.
- **Corrección:** `accepted_answers` ampliados en A1 (lista en el script); `minimum_correct = n-1` en las misiones de 3 turnos; la frase del alumno pasa a ser «Dói-me a cabeça.» (el dictado del médico se mantiene, porque escucharlo sí tiene sentido).

### I4. A2–B1: la mitad de cada unidad es heredada
- Igual que en coreano (C8): cada unidad de 16 ítems hereda 8 de otra y los presenta como nuevos con teach_concept. Cadenas detectadas:
  - past → experiences → b1-1-narrative → b1-2-perspectives
  - services → technology / problemSolving → b1-1-register → b1-2-negotiation
  - comparison → culture → b1-1-media / b1-1-society
  - conversation → opinions → b1-1-emotions → b1-2-conversation
- `b1-1-society` enseña como B1 mais, menos, igual, diferente, melhor, pior, alto y rápido. `b1-1-emotions` repite los conectores a sério, talvez, então…
- **Pendiente:** convertir los heredados en repaso y añadir 8 ítems nuevos por unidad.

### I5. `b1-1-register` no enseña registro
- No hay tarjetas sobre tu / o senhor / você ni sobre el condicional de cortesía. La regla básica se añade ahora en `survival-03`. **Pendiente:** pares mínimos en B1 (Podes…? / Pode…? / Podia…? / Importa-se de…?).

### I6. Diálogos guiados vacíos
- En las 36 unidades A1–B1 los turnos «model» dicen solo «Situación N», sin ninguna intervención del interlocutor en portugués (como en coreano I9). **Pendiente.**

### I7. Distractores que se adivinan sin saber portugués
- Por la cercanía con el español, «¿Qué significa «país»?», «hospital», «carne», «Por favor.», «Vivemos juntos.» se resuelven leyendo, sin aprender nada. Los distractores mezclan palabras sueltas con frases (`a1-*`) o salen de categorías ajenas (`vocabulary`: «suco» frente a «persona» / «hombre»).
- **Pendiente:** cambiar los cognados transparentes por escucha («elige lo que oyes») o por distractores fonéticamente próximos (avô/avó, caro/carro, pão/pau, mau/mão).

---

## 3. MENOR
- `a1-1-identity-02-11` (Obrigado): sin nota de obrigada. Corregido con `usage_note`.
- `a1-1-people`: «Ele é meu amigo.», «Ela é minha irmã.» sin artículo (en Portugal: o meu, a minha), mientras la misma unidad dice «A minha mãe».
- `a1-2-time`: «O compromisso é na próxima semana» (compromisso como «cita» es más brasileño; en Portugal: a marcação / a consulta).
- `a2-2-problemSolving`, `b1-1-register`: «Qual opção te parece melhor?»; en Portugal es más natural «Que opção…?».
- `vocabulary-31…33`: repiten los pronombres, verbos e interrogativos de *essentials*, sin explicación ni ejemplo.
- `vocabulary` no distingue glosas: meu / minha = «mi»; amanhã / manhã = «mañana»; aula / turma = «clase» (corregido este último con nota).
- `questions` usaba 2 y 4 opciones. Las unidades rehechas usan 3.
- *Stage scenarios* con un tercer turno de una sola palabra («esquerda», «fim de semana», «por isso»).
- Posición de la respuesta: leve sesgo a la primera opción (37 %).

---

## 4. Audio
- Antes de la reparación, todas las claves `audio`/`slow_audio` existían en el manifiesto.
- **Contenido nuevo: 106 claves sin grabación (unos 1.100 caracteres).** Hay que generarlas con la voz de macOS (pt-PT). Hasta entonces `tests/guided_content_audit.test.mjs` falla por `missing_audio_manifest_entry`. Se reutilizaron las claves que ya existían: olá, bom dia, boa noite, adeus, Obrigado., Não compreendo., Que horas são?, Por favor., etc.
- Las claves de las formas de Brasil sustituidas (suco, bebê, xícara…) quedan sin uso en el manifiesto.

## 5. Unidades huérfanas
- `units/` contiene 6 archivos que `course.json` no referencia: `a1-1-introductions`, `a1-2-daily-life`, `a2-1-plans-and-time`, `a2-2-description-and-comparison` (este repite «Este curso usa portugués brasileño»), `b1-1-narration-and-reasons` y `b1-2-independent-reading`.
- **Pendiente:** archivarlos fuera de `units/` (no se borraron).
- `vocabulary_seed.json` sigue declarando «portugués brasileño actual»: si se regenera *vocabulary* desde él, volverán las formas de Brasil. **Pendiente:** actualizar la semilla.

## 6. Recomendaciones para el perfil del alumno (Assimil + Rosetta, ~40 min/día)
1. Abrir cada unidad A1+ con un diálogo modelo de 6–10 líneas en pt-PT con audio, y cerrar con un diálogo guiado real (I6).
2. Usar imágenes para los sustantivos concretos. En portugués es más importante que en otras lenguas, porque la traducción escrita se adivina (I7).
3. Practicar a diario la escucha de la reducción vocálica: es la principal barrera de comprensión del portugués europeo para un hispanohablante.
4. Una tarjeta fija de falsos amigos por unidad.

---

## Estado de las correcciones (27 de octubre de 2026)

Aplicadas con `node scripts/repair_portuguese_audit_2026_10.mjs`. El script es idempotente: la segunda ejecución da `changed: []` y, aplicado sobre los archivos de HEAD, produce los mismos archivos. Las protege `tests/portuguese_audit_repairs.test.mjs`.

| Punto | Estado | Qué se hizo |
|---|---|---|
| C1 | Corregido | *survival* (4 lecciones), *time* (7), *questions* (2), *reading-bridge* (3) y *story-bridge* (2) reescritas con contenido propio, repasos y prueba. |
| C2 | Corregido | Sonidos de C, G, J, Q, S, Z, E y O corregidos; `reading` 07–10 sobre vocales átonas, nasales, dígrafos y posición; 8 preguntas nuevas en la prueba. `reading-foundations` no se tocó (lo protegen otros tests); su ejemplo «xícara» sigue pendiente. |
| C3 | Corregido | `essentials` 07–08: presente regular e irregulares, con bloques y escritura; 6 preguntas nuevas en la prueba. |
| C4 | Corregido | Base pt-PT en *vocabulary* con notas de Brasil, «porquê», nota de registro en tu / você y en `variantPolicy.note`. La semilla está pendiente. |
| C5 | Corregido | Ejemplos de *vocabulary* corregidos (nariz, internet, idade, levanta-se, meses, magoado, cabide, concordancias). |
| I1 | Corregido | Traducciones de A1–B1 de la tabla. |
| I2 | Parcial | Notas de falso amigo en el vocabulario existente; faltan ítems nuevos (polvo, esquisito, apelido…). |
| I3 | Corregido | Variantes de A1 aceptadas; misiones de 3 turnos con un error de margen; frase del paciente en salud. |
| I4 | Pendiente | Reescritura de los ítems heredados de A2–B1. |
| I5 | Parcial | Registro básico en `survival-03`; falta la lección de B1. |
| I6, I7 | Pendiente | Diálogos reales y distractores no adivinables. |
| Huérfanos | Pendiente | Sin mover. |

**Impacto en historias:** `stories/survival.json` apunta a `portuguese-survival-01` y `-02`. Esas lecciones siguen existiendo, pero ahora enseñan saludos y cortesía, no pronombres ni ser. Los pronombres y ser/estar/ter se enseñan en `essentials-01/02`, que va después de *survival*. Han cambiado de id las pruebas `portuguese-survival-test-03` → `-test-05`, `portuguese-time-test-03` → `-test-10` y `portuguese-reading-bridge-test-03` → `-test-04`.
