import type { DocSection } from '../../types';

export const nutrition: DocSection[] = [
  {
    id: 'macros',
    category: 'nutrition',
    title: 'Cómo contar macros',
    tags: ['macros', 'proteína', 'carbohidratos', 'grasa', 'nutrición', 'masa magra'],
    body: `Los macros — proteína, carbohidratos y grasa — son de donde salen tus calorías
diarias. Acierta el reparto y la composición corporal mejora; obsesiónate con
qué comes ignorando los totales y darás vueltas sin avanzar.

Cada gramo lleva una cantidad fija de energía — **4 kcal** la proteína, **4**
los carbohidratos, **9** la grasa — así que si llegas a tus gramos de macros
llegas a tus calorías por definición.

## Empieza por las calorías

Tu plan de macros se apoya en un objetivo calórico. Estima mantenimiento con la
[calculadora de TDEE](/es/herramientas/calculadora-tdee) y luego ajusta:

- **Definición:** ~10–20% por debajo de mantenimiento
- **Mantenimiento:** en mantenimiento
- **Volumen limpio:** ~10% por encima de mantenimiento

## Fija la proteína primero

La proteína es el macro prioritario — conserva músculo en déficit y lo construye
en superávit. Puedes dimensionarla de dos formas.

**Por kilo de peso corporal** — sencillo y suficiente si tu % de grasa es
normal:

| Meta          | Proteína           |
| ------------- | ------------------ |
| Definición    | 2.2 g / kg de peso |
| Mantenimiento | 2.0 g / kg         |
| Volumen       | 1.8 g / kg         |

**Por kilo de masa magra** — mejor si cargas bastante grasa, porque el tejido
graso no necesita proteína para mantenerse. Usa **1.8–2.5 g por kg de masa
magra**, con 2.2 como valor por defecto. Ejemplo: 100 kg con 20% de grasa
cargan 20 kg de grasa, así que la masa magra es de 80 kg y 80 × 2.2 =
**176 g** al día.

\`\`\`
kg_magros = peso_kg × (1 − grasa_corporal)
proteína_g = kg_magros × 2.2
\`\`\`

> **Consejo:** 176 g de proteína no son 176 g de pollo — la carne y el pescado aportan unos 20–25 g por cada 100 g. La [calculadora de proteína](/es/herramientas/calculadora-proteina) convierte tus datos en un objetivo diario.

## Luego la grasa

La grasa sostiene las hormonas y la absorción de vitaminas. Fíjala en g/kg, no en porcentaje:

| Grasa      | Cuándo                                        |
| ---------- | --------------------------------------------- |
| 0.5 g/kg   | Suelo — nunca menos, ni en definición         |
| 0.8 g/kg   | Lo habitual, en definición o volumen          |
| 1.2–1.5    | Hard-gainers a los que les cuesta comer tanto |
| 1.5–2      | Dietas bajas en carbohidratos                 |
| 0.3 g/kg   | Solo preparación de competición, y poco tiempo |

## Después los carbohidratos rellenan

Lo que sobra tras proteína y grasa son carbohidratos. En definición mantén la
grasa en el extremo bajo para que el presupuesto caiga aquí — los carbohidratos
alimentan las sesiones duras.

| Carbohidratos (g / kg) | Perfil                        |
| ---------------------- | ----------------------------- |
| ≤ 2                    | Cetogénica / low-carb         |
| 2–3                    | Bajo                          |
| 3–5                    | Moderado — la mayoría de quienes entrenan fuerza |
| 5–8                    | Alto — resistencia intensa    |
| 8–10                   | Pruebas de ultrarresistencia  |

## Ejemplo completo: 2.500 kcal

100 kg, 20% de grasa (80 kg magros), definición a 2.500 kcal, grasa a 0.7 g por
kilo magro:

\`\`\`
proteína = 80 × 2.2 = 176 g → 704 kcal
grasa = 80 × 0.7 = 56 g → 504 kcal
carbos = (2500 − 704 − 504) ÷ 4 = 323 g
\`\`\`

> **Consejo:** La [calculadora de macros](/es/herramientas/calculadora-macros) hace la aritmética — introduce calorías, peso y meta y te devuelve gramos por macro.

> **Nota:** La constancia gana a la precisión. Si te quedas a ~5–10 g de proteína y mantienes las calorías en rango la mayoría de los días, progresarás; cuenta unas semanas para crear intuición, no para siempre.

## Relacionado

- [TMB y TDEE explicados](/docs/tdee) — de dónde sale el objetivo calórico.
- [Personaliza tu dieta](/docs/personalizing-your-diet) — cómo ajustar cuando el plan ya está en marcha.
- [Registrar la comida](/docs/tracking-food) — pesar y anotar para que los gramos signifiquen algo.`,
  },
  {
    id: 'tdee',
    category: 'nutrition',
    title: 'TMB y TDEE explicados',
    tags: ['tdee', 'tmb', 'calorías', 'metabolismo', 'harris-benedict', 'mantenimiento'],
    body: `Tu **TMB** (tasa metabólica basal) es la energía que tu cuerpo quema en reposo
absoluto. Tu **TDEE** (gasto energético diario total) es la TMB más todo lo demás
— moverte, digerir, entrenar. El TDEE son tus calorías de mantenimiento.

## Estimar la TMB

Metri admite tres fórmulas establecidas:

- **Harris–Benedict** — la clásica por defecto.
- **Mifflin–St Jeor** — a menudo más precisa para poblaciones actuales.
- **Katch–McArdle** — usa la masa magra, ideal si conoces tu % de grasa.

Por ejemplo, Mifflin–St Jeor:

\`\`\`
TMB = 10 × kg + 6.25 × cm − 5 × edad + s
s = +5 (hombre) o −161 (mujer)
\`\`\`

## De la TMB al TDEE

Multiplica la TMB por un factor de actividad:

| Actividad  | Multiplicador |
| ---------- | ------------- |
| Sedentario | 1.2           |
| Ligero     | 1.375         |
| Moderado   | 1.55          |
| Activo     | 1.725         |
| Muy activo | 1.9           |

Entre tres y cinco sesiones de fuerza a la semana, un par de días de cardio y
7.000–10.000 pasos diarios suelen caer entre "moderado" y "activo". Si dudas,
empieza en moderado y deja que la báscula te corrija.

## Comprobación rápida: peso × 22

Si quieres una verificación sin fórmula, multiplica tu peso en kilos por 22 y
después por el mismo factor de actividad. Para 92 kg con actividad moderada:

\`\`\`
92 × 22 = 2.024 kcal
2.024 × 1.55 = 3.137 kcal
\`\`\`

Si el resultado queda cerca del de la fórmula, tienes un punto de partida
sólido. Si no, quédate con el número más bajo — es más fácil añadir comida
después que deshacer dos semanas de subida no buscada.

## Corrige si tu % de grasa es alto

El tejido graso quema mucha menos energía que el músculo, así que cualquier
fórmula basada en el peso sobreestima cuando el % de grasa es alto. Calcula
sobre un peso de referencia más magro: alguien de 100 kg con 30% de grasa haría
los números sobre unos **80 kg** — más o menos lo que pesaría cerca del 10%. No
tiene que ser exacto. Katch–McArdle lo hace de forma implícita porque parte de
la masa magra; si conoces tu % de grasa, prefiérela.

## Usar el número

- Come en tu TDEE para mantener.
- Resta ~10% (unas 300–500 kcal) para perder grasa.
- Suma ~10% (unas 200–300 kcal) para ganar masa magra.

Después pasa tu objetivo a la
[calculadora de macros](/es/herramientas/calculadora-macros) para repartirlo en
proteína, carbohidratos y grasa.

## Ajusta tras 1–2 semanas

La fórmula es el punto de partida; la media semanal en ayunas es la verdad.
Pésate en ayunas, promedia la semana y compara al cabo de una o dos semanas:

| La media semanal muestra…               | Acción                    |
| --------------------------------------- | ------------------------- |
| El peso se mantiene pero quieres bajar  | Recorta calorías ~10%     |
| El peso sube y no lo buscabas           | Recorta 15–20%            |
| Se mueve en la dirección prevista       | No cambies nada           |

Cualquier recorte sale de carbohidratos o grasa, nunca de la proteína.

> **Nota:** Son estimaciones construidas sobre promedios poblacionales. Toma el resultado como hipótesis y deja que tres o cuatro semanas de datos reales de peso lo confirmen o lo corrijan.

> **Consejo:** Calcula tus números en la [calculadora de TDEE](/es/herramientas/calculadora-tdee).

## Relacionado

- [Cómo contar macros](/docs/macros) — repartir el objetivo en gramos.
- [¿Definir, volumen o mantener?](/docs/choosing-your-phase) — en qué dirección mover el número.
- [Salir de un estancamiento](/docs/breaking-a-plateau) — cuando la báscula deja de moverse.`,
  },
  {
    id: 'hydration',
    category: 'nutrition',
    title: 'Hidratación y pasos',
    tags: ['agua', 'hidratación', 'pasos', 'neat', 'salud'],
    body: `El agua y el movimiento diario son los dos hábitos que no cuestan nada, están
debajo de todas las demás reglas de nutrición y son los primeros en fallar sin
que te des cuenta. Ninguno necesita una app — solo un par de comprobaciones que
puedes hacer sin pensar.

## Agua

Apunta a **2–5 L al día**, escalando con tu tamaño, el clima y cuánto sudas al
entrenar. Una deshidratación leve ya te baja la energía del día y de la sesión,
lo que se traduce en menos calorías quemadas y peores levantamientos.

| Comprobación                   | Qué te dice                                             |
| ------------------------------ | ------------------------------------------------------- |
| Orina tras la primera del día  | Debe ser clara o transparente el resto de la jornada    |
| Un vaso al despertar           | Cubre lo perdido durante la noche antes del desayuno    |
| Un vaso antes de cada comida   | Reparte la ingesta en el día y frena el hambre          |
| Entrenos largos o con calor    | Súmalo a la base — el extremo alto del rango existe para esto |

> **Consejo:** Obtén un objetivo de agua personalizado con la [calculadora de agua](/es/herramientas/calculadora-agua).

## Pasos

Los pasos diarios son el grueso de tu actividad fuera del entrenamiento y la
forma más barata de subir el gasto energético. Caminar no acumula fatiga como
el cardio, así que es difícil pasarse y fácil mantenerlo constante semana a
semana.

| Meta                         | Pasos diarios                        |
| ---------------------------- | ------------------------------------ |
| Volumen                      | 7.000–8.000                          |
| Definición o recomposición   | 8.000–10.000                         |
| Definición estancada         | Sube poco a poco, hasta ~13.000      |

Superar los 7.500 pasos diarios se asocia con ~32% menos mortalidad por todas
las causas — el retorno en salud llega bastante antes que el de la pérdida de
grasa.

## Relacionado

- [Salir de un estancamiento](/docs/breaking-a-plateau) — los pasos son la primera palanca, no la comida.
- [TMB y TDEE explicados](/docs/tdee) — la actividad ya va dentro de tu número de mantenimiento.
- [Cardio, pasos y NEAT](/docs/cardio-and-neat) — cuánto caminar y cuánto cardio pide cada fase.
- [Mitos de la pérdida de grasa](/docs/fat-loss-myths) — por qué la falta de agua es uno de los seis factores reales.`,
  },
  {
    id: 'personalizing-your-diet',
    category: 'nutrition',
    title: 'Personaliza tu dieta',
    tags: ['calorías', 'objetivos', 'definir', 'volumen', 'ajustar', 'hambre'],
    body: `Una dieta calculada es una hipótesis sobre tu cuerpo, no un veredicto. Las dos
palancas que importan son las **calorías totales** y la **proteína total**;
todo lo demás — horarios, elección de alimentos, suplementos — es secundario.
Personalizar consiste en hacer un experimento pequeño, leer el resultado y
corregir un poco.

## El bucle de ajuste

1. Parte de tu mantenimiento (la
   [calculadora de TDEE](/es/herramientas/calculadora-tdee)) y muévelo ~10%
   en la dirección de tu meta.
2. Mantén esa ingesta **2 semanas**. Pésate en ayunas y usa la media semanal
   — los días sueltos son ruido.
3. ¿Hay resultados? No toques nada. ¿No los hay? Muévete otro **5–10%** en la
   misma dirección y espera otras 2 semanas.

| Meta            | Ajuste inicial | Qué deberían mostrar 2 semanas   |
| --------------- | -------------- | -------------------------------- |
| Definición      | −10%           | Media bajando ~0.3–0.5 kg/semana |
| Mantenimiento   | 0%             | Media plana                      |
| Volumen limpio  | +10%           | Media subiendo ~0.25 kg/semana   |

Tu cuerpo no es un reloj suizo. Redondea los números, respeta el bucle y deja
que decidan dos semanas — nunca dos días.

## Escala el plan entero, no un alimento

Si comes según un plan fijo, aplica el porcentaje a todas las cantidades en
lugar de quitar un solo alimento. Así proteína, fibra y micronutrientes se
mantienen en la misma proporción. Los planes de referencia suelen situarse en
**2.100 kcal** para hombres y **1.700 kcal** para mujeres, lo que hace fácil
la cuenta:

| Caso                                  | Objetivo                | Cambio sobre el plan          |
| ------------------------------------- | ----------------------- | ----------------------------- |
| Hombre, mantenimiento 2.300, definiendo | 2.300 − 10% ≈ 2.100   | Usa el plan de 2.100 tal cual |
| Hombre, mantenimiento 2.000, definiendo | 2.000 − 10% = 1.800   | Baja todas las porciones ~15% |
| Mujer, mantenimiento 1.700, definiendo | 1.700 − 10% ≈ 1.500    | Baja todas las porciones ~10% |
| Hombre, volumen a 2.500               | 2.500                   | Sube todas las porciones ~20% |

## El suelo de 1.800 kcal

No persigas la pérdida de grasa por debajo de unas **1.800 kcal**. Ahí abajo
cuesta cubrir proteína, fibra y micronutrientes, y te falta combustible para
entrenar lo bastante fuerte como para conservar músculo. Si un plan de 1.800
kcal ha dejado de funcionar, añade un día de entrenamiento, más pasos o una
sesión de cardio — gasta más en lugar de comer menos.

## El hambre es una señal, no una prueba de carácter

Si tienes hambre todo el tiempo, el enfoque está mal. Un déficit sostenible te
deja rendir en el gimnasio, dormir bien y no pensar en comida a todas horas.
El hambre persistente suele significar que el déficit es demasiado agresivo,
la proteína demasiado baja o el plato tiene poco volumen (verdura, fruta,
legumbres). Arregla el planteamiento en vez de aguantar a base de voluntad —
un cuerpo que pasa hambre retiene grasa y suelta músculo.

> **Consejo:** ¿En volumen y tras 2 semanas no pasa nada? Suma ~10% a todas las porciones y vuelve a esperar. Repite hasta que la media semanal suba despacio, y quédate ahí.

## Mientras haya resultados, no cambies nada

El error más común es ajustar encima de algo que ya funciona. Una definición
que baja 0.4 kg por semana no necesita ir más rápido; un volumen que sube 250 g
por semana con la cintura estable no necesita más comida. Toca el plan solo
cuando dos semanas limpias no muestren movimiento.

## Relacionado

- [¿Definir, volumen o mantener?](/docs/choosing-your-phase) — en qué dirección mover el número.
- [Salir de un estancamiento](/docs/breaking-a-plateau) — las palancas antes de comer menos.
- [Cómo contar macros](/docs/macros) — convertir el objetivo calórico en gramos.`,
  },
  {
    id: 'choosing-your-phase',
    category: 'nutrition',
    title: '¿Definir, volumen o mantener?',
    tags: ['definición', 'volumen', 'mantenimiento', 'grasa corporal', 'recomposición', 'fase'],
    body: `Que debas comer por encima, por debajo o en mantenimiento lo decide tu
porcentaje de grasa corporal, no el calendario ni el ánimo. La grasa corporal
determina si un superávit se convierte en músculo o en más grasa, y si un
déficit te cuesta fuerza. Acierta la fase y la dieta casi se escribe sola.

## Hombres

| % de grasa | Fase                                                          |
| ---------- | ------------------------------------------------------------- |
| 6–12%      | Superávit — tienes margen para subir                          |
| 12–15%     | Banda óptima: mantener, o un déficit ligero hacia el 12%      |
| 15–20%     | Déficit; aún puedes ganar músculo y fuerza mientras defines   |
| 20%+       | Déficit, sin discusión, hasta volver a la banda               |

El ritmo a largo plazo es subir hasta ~15%, bajar hasta ~12% y repetir.
**Nunca hagas volumen por encima del 18–20%** — a partir de ahí el superávit
va sobre todo a grasa.

## Mujeres

| % de grasa | Fase                                              |
| ---------- | ------------------------------------------------- |
| 10–12%     | Superávit hasta ~20%, después mantenimiento       |
| 20–22%     | Mantener y recomponer                             |
| ~25%       | Déficit, ~400 g por semana                        |
| 30%+       | Déficit, hasta 500 g por semana                   |

**Nunca hagas volumen por encima del 28–30%.** Una mujer en ~20% que quiera
bajar más define despacio, ~300 g por semana.

## A qué velocidad subir

Más comida no es más músculo. La velocidad la limita cuánta grasa estás
dispuesto a ganar, y ese límite baja conforme ganas experiencia.

| Nivel        | Subida al mes       | Con 80 kg    |
| ------------ | ------------------- | ------------ |
| Principiante | 1–1.5% del peso     | 0.8–1.2 kg   |
| Intermedio   | 0.5–1%              | 0.4–0.8 kg   |
| Avanzado     | 0.25–0.5%           | 0.2–0.4 kg   |

Si la cintura crece y las marcas no, estás por encima de tu techo — sube más
despacio o pasa a mantenimiento.

## A qué velocidad bajar

| % de grasa       | Pérdida al mes       | Por semana        |
| ---------------- | -------------------- | ----------------- |
| Más de 25%       | 3–4% del peso        | hasta ~500 g      |
| 13–19%           | 1–2%                 | ~300–400 g        |

Cuanto más magro estés, más despacio debes bajar — el riesgo de perder músculo
crece conforme cae la grasa. Unos **400 g por semana** funcionan para la
mayoría. Bajar más rápido trae más hambre, peores sesiones y peor sueño, y un
coste hormonal; tampoco garantiza perder más grasa, porque buena parte de una
caída rápida es glucógeno y agua.

## Recomposición en mantenimiento

Dentro de la banda óptima no hace falta elegir dirección. Comer en
mantenimiento entrenando duro cambia grasa por músculo poco a poco con el
mismo peso: un hombre de 75 kg al 15% puede estar en 75 kg al 13% seis meses
después; una mujer puede pasar del 22% al 19% del mismo modo. Si no pasas
hambre, te recuperas, duermes bien y las marcas siguen subiendo, no hay motivo
para subir calorías.

> **Consejo:** Estima dónde estás con la [calculadora de grasa corporal](/es/herramientas/calculadora-grasa-corporal) y lee tu número en la [guía de grasa corporal](/docs/body-fat-guide).

## Relacionado

- [TMB y TDEE explicados](/docs/tdee) — el número de mantenimiento del que parte toda fase.
- [Personaliza tu dieta](/docs/personalizing-your-diet) — el bucle de ±10% una vez sabes la dirección.
- [Controla tu peso](/docs/weight-tracking) — el calendario de peso objetivo para la fase que elegiste.
- [Calidad de la dieta](/docs/diet-quality) — por qué un volumen sucio te lleva más rápido por encima del techo.`,
  },
  {
    id: 'breaking-a-plateau',
    category: 'nutrition',
    title: 'Salir de un estancamiento',
    tags: ['estancamiento', 'meseta', 'neat', 'pasos', 'cardio', 'pérdida de grasa', 'pesarse'],
    body: `Los estancamientos son normales. A medida que bajas de peso tu cuerpo gasta
menos, y el déficit que funcionaba la primera semana se va cerrando en
silencio. El reflejo es volver a comer menos — pero la comida es la última
palanca, porque cada recorte también quita el combustible para entrenar y la
proteína que protege el músculo. Primero gasta más.

## Las cinco palancas, en orden

| Palanca                   | Primer movimiento                                       |
| ------------------------- | ------------------------------------------------------- |
| 1. NEAT (pasos diarios)   | Cuéntalos y añade un poco                               |
| 2. Cardio                 | Suma una sesión, o empieza con 2 × 40 min por semana    |
| 3. Progresar en las pesas | Mejor técnica → más carga → más energía gastada         |
| 4. Dormir 7–9 h           | Profundo y continuo; despertarse 3–4 veces no cuenta    |
| 5. Estrés                 | El estrés crónico frena la pérdida de grasa y el sueño  |

El **NEAT** es todo lo que te mueves fuera del entrenamiento. Tu teléfono ya
cuenta los pasos; cuando te estanques sabrás exactamente dónde estás y podrás
subir un poco el número. Una progresión típica: 7.000–8.000 pasos y dos
sesiones de cardio, después 10.000 pasos a las 3–4 semanas, luego una tercera
sesión, luego ~13.000 pasos.

El **cardio** debe ser la misma cantidad cada semana. Si tus calorías son
constantes, tu movimiento también tiene que serlo — si no, cambias dos
variables a la vez.

Las **pesas** importan más de lo que parece: un cuerpo que sigue haciéndose
más fuerte mantiene un gasto más alto y mejor sensibilidad a la insulina, así
que el músculo absorbe los nutrientes en lugar de la grasa.

**Sueño y estrés** son metabólicos, no solo de ánimo. Dormir mal sube la
resistencia a la insulina y el hambre; el estrés crónico hace que pierdas
menos grasa y más músculo.

Solo cuando ya vas por 10.000–12.000 pasos y haces 1.5–2 horas de cardio suave
a la semana recortas la ingesta — un poco — o entrenas más duro.

## Los saltos de un día a otro son agua, no grasa

Un kilo de grasa corporal almacena unas **7.000 kcal**. Si tu mantenimiento
son 2.000 kcal, ganar un kilo real de grasa en un día exigiría ~9.000 kcal — y
tu intestino ni siquiera podría absorberlas. Una oscilación de ±1–2 kg tras
una comida grande, una cena salada o un fin de semana fuera es agua, glucógeno
y contenido intestinal, y se va por donde vino.

\`\`\`
1 kg de grasa ≈ 7.000 kcal
2.000 de mantenimiento + 7.000 = 9.000 kcal en un día
\`\`\`

## Pésate como un estadístico

Pésate cada mañana, en ayunas, y promedia los siete días. Compara medias
semana contra semana, no un lunes contra el siguiente.

\`\`\`
media_semanal = (d1 + d2 + d3 + d4 + d5 + d6 + d7) ÷ 7
\`\`\`

Acompaña la báscula con la medida de cintura, fotos y cómo te queda la ropa —
en una recomposición la báscula puede quedarse quieta mientras todo lo demás
cambia.

> **Consejo:** Pesarte a diario te da siete oportunidades por semana de leer la tendencia; pesarte una vez te da una, y puede caer en un día de retención.

## Relacionado

- [Hidratación y pasos](/docs/hydration) — los objetivos de pasos por fase.
- [Sueño](/docs/sleep) — por qué la cuarta palanca no es opcional.
- [Cardio, pasos y NEAT](/docs/cardio-and-neat) — las palancas uno y dos en detalle.
- [Controla tu peso](/docs/weight-tracking) — leer la media semanal antes de tocar nada.
- [Medir el progreso](/docs/measuring-progress) — cinta, fotos y la rutina en ayunas.
- [Personaliza tu dieta](/docs/personalizing-your-diet) — cuando por fin la palanca es la comida.`,
  },
  {
    id: 'tracking-food',
    category: 'nutrition',
    title: 'Registrar la comida',
    tags: ['registro', 'pesar', 'crudo', 'cocido', 'etiquetas', 'proteína', 'seguimiento'],
    body: `Registrar la comida es una herramienta de medición, no un estilo de vida. Su
trabajo es enseñarte cuánto pesa de verdad una porción y cuánto cuesta, para
que cuando te estanques sepas qué estás comiendo y puedas moverlo. Unas pocas
reglas hacen que los números signifiquen algo.

## Crudo o cocido

El agua no tiene calorías pero sí mucho peso, así que el mismo alimento se
registra muy distinto según cuándo lo peses.

| Alimento                      | Crudo / seco            | Cocido                         |
| ----------------------------- | ----------------------- | ------------------------------ |
| Arroz, pasta, cereales secos  | ~350 kcal por 100 g     | 100 g secos → ~300 g cocidos   |
| Arroz cocido                  | —                       | ~130 kcal por 100 g            |
| Carne, pescado                | Registra este peso      | Pierde ~20% de su peso         |

Los cereales absorben agua y se vuelven más ligeros por gramo; la carne suelta
agua y se vuelve más densa por gramo. **Pesa en crudo y registra en crudo** —
la única excepción común son las legumbres, que la mayoría de planes pesan ya
cocidas. Elijas lo que elijas, hazlo siempre igual.

## Iguala por etiqueta, no por marca

La mayoría de alimentos en una app de registro vienen por 100 g. Si tu marca
exacta no aparece, elige una entrada comparable y ajusta la cantidad hasta que
las calorías coincidan con la etiqueta del paquete — los macros quedarán lo
bastante cerca. Ejemplo: papas congeladas a 150 kcal por 100 g, comes 300 g,
así que registras la cantidad de "papas" que dé 450 kcal.

Los cereales de desayuno lo ilustran bien: casi todas las cajas caen cerca de
las mismas calorías, y lo que varía es la fibra o un poco de grasa de los
frutos secos.

## Qué dice una etiqueta

- Los valores van por 100 g, no por ración, salvo que se indique.
- El azúcar ya está dentro de los carbohidratos; la grasa saturada ya está
  dentro de la grasa.
- Proteína × 4 + carbohidratos × 4 + grasa × 9 debe dar aproximadamente las
  calorías indicadas.
- Cuantos menos ingredientes, mejor.

## Proteína por cada 100 g

La carne y el pescado son sobre todo agua. Sea cual sea el corte, cuenta con
unos **20–25 g de proteína por cada 100 g**; el resto es agua y algo de grasa.

| Alimento                     | Proteína                  |
| ---------------------------- | ------------------------- |
| Pechuga de pollo, 100 g      | ~22 g (70 g ≈ 100 kcal)   |
| Lomo de cerdo magro, 300 g   | ~63 g, ~365 kcal          |
| Un huevo                     | ~6 g                      |
| Avena, 100 g secos           | ~12–14 g                  |
| Pasta, 100 g secos           | ~13 g                     |
| Arroz, 100 g secos           | ~8 g                      |

La proteína de los cereales también cuenta — a lo largo del día suma una parte
nada despreciable.

## La constancia gana a la precisión

Un plicómetro puede decir 12% de grasa y un escáner 15%; ninguno está "mal"
mientras sigas usando el mismo, porque actúas sobre la tendencia. Con la
comida pasa igual: una entrada que siempre se desvía un 10% sigue siendo
perfectamente útil.

> **Consejo:** Registra unos meses, no para siempre. Después estimarás un plato a ojo — en restaurantes y de vacaciones — y el registro se convierte en algo que reabres solo cuando el progreso se para.

## Relacionado

- [Cómo contar macros](/docs/macros) — los objetivos contra los que se mide el registro.
- [Intercambios de alimentos](/docs/food-swaps) — cambiar alimentos sin volver a pesarlo todo.
- [Personaliza tu dieta](/docs/personalizing-your-diet) — qué hacer con lo que muestra el registro.`,
  },
  {
    id: 'food-swaps',
    category: 'nutrition',
    title: 'Intercambios de alimentos',
    tags: ['intercambios', 'equivalencias', 'plan de comidas', 'sustituciones', 'variedad'],
    body: `Un plan que puedes variar es un plan que mantienes. La mayoría de alimentos
vienen en familias que comparten el mismo perfil de macros, así que puedes
cambiar dentro de una familia a igualdad de gramos. Entre familias cambia el
contenido de agua, y ahí es donde hace falta un multiplicador.

## Multiplicadores entre familias

| Cambio                                          | Multiplica los gramos por     |
| ----------------------------------------------- | ----------------------------- |
| Cereales (arroz, pasta, avena, quinoa) → pan    | ×2 (50 g de arroz = 100 g de pan) |
| Cereales → papa o camote                        | ×4                            |
| Cereales → legumbres                            | ×3                            |
| Frutos secos → aguacate                         | ×3                            |
| Pescado blanco → blanco, azul → azul            | ×1                            |

En sentido contrario, divide: 200 g de papa sustituyen a 50 g de arroz seco.

\`\`\`
pan_g = cereal_g × 2
papa_g = cereal_g × 4
legumbres_g = cereal_g × 3
aguacate_g = frutos_secos_g × 3
\`\`\`

Los multiplicadores existen porque los cereales se registran en seco mientras
que la papa, las legumbres y el aguacate llevan agua; las calorías por 100 g
son menores, así que necesitas más gramos para la misma energía.

## Grupos intercambiables (a igualdad de gramos)

| Grupo                  | Miembros                                                      |
| ---------------------- | ------------------------------------------------------------- |
| Pan                    | Tostadas, pan de barra, tortillas de maíz o harina, arepas    |
| Cereales               | Arroz basmati, jazmín o integral, pasta integral, quinoa, avena, pan integral |
| Carne blanca           | Pechuga de pollo, pechuga de pavo, lomo de cerdo limpio, conejo |
| Carne roja magra       | Res y otros cortes magros, sin grasa visible ni hueso         |
| Pescado blanco         | Bacalao, merluza, lenguado, dorada, lubina, rape, sepia, camarón |
| Pescado azul           | Salmón, atún, sardina, caballa, trucha, boquerón              |
| Fruta                  | Manzana, pera, naranja, plátano, kiwi, durazno, frutos rojos, melón, uva |
| Verduras               | Hojas verdes, brócoli, coliflor, calabacín, pimiento, tomate, cebolla, zanahoria, ejotes |
| Frutos secos y semillas | Almendras, nueces, anacardos, avellanas, pistaches, cacahuates, pepitas de calabaza |
| Lácteos bajos en grasa | Queso fresco o cottage 0%, yogur griego 0%, requesón 0%, yogur alto en proteína 0% |
| Lácteos con más grasa  | Yogur griego, mozzarella, burrata, queso curado, brie, leche entera |

Mantén el pescado dentro de su propia columna: cambiar azul por blanco altera
la cuenta de grasa, no solo el sabor. La carne roja se cambia por roja y la
blanca por blanca por el mismo motivo.

## Reglas que mantienen el plan flexible

- Las horas no importan — importa lo que has comido al terminar el día.
- Las comidas de calorías parecidas se pueden barajar: la opción de merienda
  en el desayuno, la de comida en la cena.
- Si no te cabe una comida, únela a la anterior o a la siguiente.
- Una pieza de fruta o una ración de verdura extra siempre está permitida.
- Frutos secos naturales o tostados, no fritos.

> **Consejo:** Varía la preparación antes que los ingredientes: huevo cocido, escalfado o revuelto; papa al horno, hervida o en puré; arroz al vapor o en ensalada. Mismos macros, menos aburrimiento.

## Relacionado

- [Registrar la comida](/docs/tracking-food) — por qué los cereales se registran en seco y qué dice una etiqueta.
- [Calidad de la dieta](/docs/diet-quality) — cómo elegir dentro de un grupo.
- [Cómo contar macros](/docs/macros) — los objetivos que los intercambios deben respetar.`,
  },
  {
    id: 'diet-quality',
    category: 'nutrition',
    title: 'Calidad de la dieta',
    tags: ['calidad', 'fibra', 'procesados', 'vegano', 'ayuno', 'timing', 'volumen sucio'],
    body: `Las calorías deciden si tu peso se mueve. La calidad decide cómo te sientes
mientras se mueve — energía, saciedad, recuperación, digestión — y por tanto
si el plan sobrevive más allá de la tercera semana. No eres lo que comes; eres
lo que absorbes.

## Densidad nutricional y procesamiento

Prefiere alimentos que aporten más nutrientes por caloría: 100 kcal de papa
cocida traen más que 100 kcal de arroz blanco, aunque ambos sean carbohidratos
válidos. Los ultraprocesados son lo contrario — densos en calorías, pobres en
nutrientes y a menudo menos saciantes, así que te dejan con más hambre tras
más calorías. Cocina al vapor, al horno, a la plancha o salteado con poco
aceite, y cocina de una vez para varios días.

| Prefiere                                        | Limita                                    |
| ----------------------------------------------- | ----------------------------------------- |
| Cereales integrales, papa, fruta, legumbres     | Harinas refinadas, azúcar añadido         |
| Carne magra, pescado, huevo, legumbres, tofu    | Cortes grasos, embutidos                  |
| Frutos secos, semillas, aguacate, aceite de oliva, pescado azul | Grasas trans, exceso de saturadas |
| Verdura en cada comida                          | Snacks con una lista larga de ingredientes |

## Fibra

Apunta a **al menos 25 g de fibra al día** de cereales integrales, fruta,
verdura y legumbres. En déficit la fibra es además tu estrategia de saciedad —
volumen por pocas calorías. Si la digestión va lenta, 15–20 g de linaza molida
al día ayudan.

## Leer una etiqueta

Los valores van por 100 g; el azúcar forma parte de la línea de carbohidratos
y la grasa saturada de la línea de grasa. Cuantos menos ingredientes, mejor. La
[guía de registro](/docs/tracking-food) explica cómo igualar entradas con
etiquetas.

## Vegano y vegetariano

Las dietas basadas en plantas funcionan para ganar músculo con algo de
planificación. Combina fuentes a lo largo del día — arroz y lentejas, hummus y
pan — para completar el perfil de aminoácidos; no tiene por qué ser en la
misma comida.

| Vigila                | Por qué                                              |
| --------------------- | ---------------------------------------------------- |
| Vitamina B12          | No está en las plantas — suplementa                  |
| Vitamina D            | Suele estar baja sea cual sea la dieta               |
| Hierro y zinc         | Las formas vegetales se absorben peor                |
| Omega-3               | EPA/DHA de algas si no comes pescado                 |

Buenas fuentes de proteína: legumbres, soja (tofu, tempeh, edamame), quinoa,
avena, amaranto, frutos secos y semillas.

## Ayuno intermitente

La ventana 16:8 (primera comida a mediodía, última a las 20:00) es el protocolo
habitual. Los beneficios que se le atribuyen — sensibilidad a la insulina,
quema de grasa, autofagia — vienen del propio déficit calórico, no del reloj.
El ayuno **no aporta ninguna ventaja más allá del déficit** que a algunas
personas les ayuda a mantener. Comer dentro de una ventana diurna de ~12 h,
lejos de la hora de dormir, es un valor por defecto razonable; hidrátate en
las horas de ayuno.

## Horario de las comidas

- Concentra más calorías al principio del día; haz la última comida la más
  ligera y termínala 2–3 h antes de dormir.
- Concentra los carbohidratos alrededor del entrenamiento. Tras una sesión
  dura, la sensibilidad a la insulina se mantiene elevada **hasta ~6 h** — los
  carbohidratos de ese margen van primero al músculo.
- Si tu comida grande es tarde, entrena por la tarde-noche para que la
  ventana coincida.

## Volumen sucio

Un superávit construido sobre comida rápida y postres sube peso deprisa, pero
sube grasa igual de deprisa — y las células grasas compiten con el músculo por
los nutrientes mientras empeoran la sensibilidad a la insulina, así que un
volumen sucio puede significar **menos** músculo. Además te arrastra por encima
de los techos de volumen (18–20% hombres, 28–30% mujeres) y hacia una
definición larga. Un superávit debería seguir siendo sobre todo comida real.

> **Consejo:** Si en volumen solo te crece la barriga, te has pasado de calorías y de grasa corporal al mismo tiempo.

## Relacionado

- [Intercambios de alimentos](/docs/food-swaps) — variedad sin romper el plan.
- [¿Definir, volumen o mantener?](/docs/choosing-your-phase) — los techos de grasa corporal.
- [Suplementos](/docs/supplements) — qué merece la pena añadir y qué no.`,
  },
  {
    id: 'fat-loss-myths',
    category: 'nutrition',
    title: 'Mitos de la pérdida de grasa',
    tags: ['mitos', 'cardio en ayunas', 'somatotipos', 'obesidad', 'carbohidratos', 'homeostasis'],
    body: `La mayoría de consejos sobre pérdida de grasa que suenan precisos son una
observación de ventana corta estirada hasta convertirla en regla. El cuerpo se
equilibra en días, no en minutos, así que la pregunta para cualquier
afirmación es siempre la misma: ¿qué pasa en 24 horas, y qué pasa con el
déficit total?

## El cardio en ayunas no quema más grasa

Cuarenta minutos de cardio queman más o menos la misma energía — digamos ~400
kcal — hayas comido antes o no. En ayunas, con el glucógeno bajo, la sesión
tira más de grasa. Después el cuerpo compensa durante el resto del día,
quemando más glucógeno y menos grasa, porque mantiene su mezcla de combustible
en equilibrio (homeostasis).

| Momento          | Durante la sesión         | Resto del día             | Total 24 h    |
| ---------------- | ------------------------- | ------------------------- | ------------- |
| En ayunas        | Más grasa, menos glucógeno | Más glucógeno, menos grasa | ~400 kcal    |
| Tras comer       | Más glucógeno, menos grasa | Más grasa, menos glucógeno | ~400 kcal    |

Los estudios que midieron solo durante y poco después de la sesión vieron la
primera columna y se detuvieron ahí. Los que siguieron a las personas 24 horas
vieron la compensación. El único número que mueve la pérdida de grasa es el
déficit diario — quema 2.000 y come 2.000 y te mantienes; come 1.700–1.800 y
bajas. El cardio ayuda porque sube el gasto, y ayuda exactamente igual con o
sin comida. Entrena en ayunas si lo disfrutas; no hay nada que ganar ni que
perder.

## Los somatotipos no son un plan

Ectomorfo, mesomorfo y endomorfo describen una instantánea de peso, % de grasa
y % de músculo. Esos tres números cambian cuando entrenas y comes bien, y la
etiqueta cambia con ellos: a un principiante con sobrepeso lo llaman endomorfo
y, musculado años después, mesomorfo — la misma persona. La genética es fija
pero se puede modular, y la "tendencia a engordar" desaparece casi del todo
cuando baja la grasa y sube el músculo. Planificar en torno a un somatotipo es
planificar en torno a una foto tuya del año pasado.

## Ningún nutriente por sí solo causa obesidad

La grasa fue la villana en los años 50; hoy lo es el carbohidrato. Culpar a un
solo nutriente es simplista — el sobrepeso es multifactorial, y los mismos seis
factores aparecen siempre juntos.

| Factor                  | Qué hace                                                    |
| ----------------------- | ----------------------------------------------------------- |
| Sedentarismo            | Menos pasos, menos gasto; la sociedad está diseñada para ello |
| Ultraprocesados         | Densos en calorías, poco saciantes — comes más y sigues con hambre |
| Estrés                  | Menos grasa perdida, peor sueño, más músculo perdido        |
| Dormir mal              | Más resistencia a la insulina y más hambre al día siguiente |
| Poca agua               | Menos energía para el día y para la sesión                  |
| Exceso calórico         | El que cierra el círculo — con el sedentarismo, la combinación que dispara el peso |

En una vida activa — 8.000–10.000 pasos, tres o cuatro sesiones a la semana —
ningún alimento por sí solo es "malo". Arregla los seis a la vez y los
carbohidratos dejan de ser un problema.

> **Consejo:** Cuando una regla promete un atajo, pregúntate qué hace con el déficit de 24 horas. Si la respuesta es "nada", es una preferencia, no una palanca.

## Relacionado

- [Hidratación y pasos](/docs/hydration) — dos de los seis factores, en concreto.
- [Sueño](/docs/sleep) — el lado de la recuperación de la misma lista.
- [Salir de un estancamiento](/docs/breaking-a-plateau) — las palancas que sí mueven el déficit.
- [Calidad de la dieta](/docs/diet-quality) — qué hacer con los ultraprocesados.`,
  },
];
