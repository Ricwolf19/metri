import type { DocSection } from '../../types';

export const training: DocSection[] = [
  {
    id: 'progressive-overload',
    category: 'training',
    title: 'Sobrecarga progresiva',
    tags: [
      'sobrecarga progresiva',
      'hipertrofia',
      'fuerza',
      'programación',
      'aproximación',
      'registro',
    ],
    body: `El músculo y la fuerza solo crecen cuando le pides al cuerpo más de lo que está
acostumbrado. Eso es la **sobrecarga progresiva**: un aumento gradual y sostenido
de la demanda de entrenamiento en el tiempo. Lo demás son detalles.

## Formas de añadir carga

No solo progresas añadiendo peso. En orden aproximado de prioridad:

1. **Añade repeticiones** con el mismo peso.
2. **Añade peso** al llegar al tope de tu rango de reps.
3. **Añade series** (más volumen semanal).
4. **Mejora técnica / rango de movimiento.**
5. **Reduce el descanso** o acércate más al fallo.

> **Consejo:** Elige *una* palanca por bloque. Intentar subir peso, reps y series a la vez es como te estancas y te lesionas sin motivo.

## Encuentra el peso con series de aproximación

Nunca llegues al peso de trabajo en frío. Las series de aproximación
(calentamiento) hacen dos cosas: calientan las articulaciones y te dicen cuál es
el peso de trabajo de hoy. Cada una se queda lejos del fallo — unas **10 reps en
reserva** — y ninguna cuenta como volumen.

| Serie de aproximación | Carga (del peso de trabajo) |
| --------------------- | --------------------------- |
| 1                     | ~20%                        |
| 2                     | ~40%                        |
| 3                     | ~60%                        |
| 4                     | ~80%                        |
| Serie efectiva        | 100%                        |

Si la serie al 80% pesa más de lo normal, quita un poco al peso de trabajo de hoy:
la aproximación ya te avisó. En un ejercicio nuevo, la aproximación es también la
forma de descubrir el peso correcto desde el principio.

## Series fijas vs series descendentes

| Esquema             | Ejemplo | Peso                                   |
| ------------------- | ------- | -------------------------------------- |
| Series fijas        | 3×8     | quita ~5% por serie para seguir en 8   |
| Series descendentes | 8-6-4   | el mismo peso; la fatiga baja las reps |

Con series fijas, si mantienes el peso sacas 8, luego 7, luego 6. Recortar ~5%
por serie mantiene cada serie en el objetivo. En las descendentes la caída *es* el
plan, así que el peso no se toca.

## Doble progresión

Un esquema simple y duradero para hipertrofia:

- Elige un rango de reps, p. ej. **8–12**.
- Mantén el peso hasta llegar a **12 reps en todas las series**.
- Entonces sube el incremento más pequeño y vuelve hacia 8.

## El ciclo del registro

No puedes sobrecargar lo que no mides. Anota **peso × reps** de cada serie y en la
siguiente sesión supera esa entrada: mismo peso con una rep más, o un poco más de
peso con las mismas reps. ¿Te pasaste del objetivo (14 donde tocaban 12)? Sube el
peso un poco. ¿Te quedaste corto? Bájalo un poco. Solo llevar el registro ya
mejora el rendimiento por sí mismo. Usa la
[calculadora de 1RM](/es/herramientas/calculadora-1rm) para comparar series
duras en distintos rangos de reps.

## Ajusta despacio

El cuerpo responde mejor a cambios pequeños semana a semana que a cambios
grandes. Modifica el plan — ejercicios, series, rangos — solo tras un **estancamiento
real de 3–4 semanas**, no tras una mala sesión.

## Cuándo bajar el pie

El progreso no es lineal. Cuando el rendimiento cae 2–3 sesiones seguidas pese a
dormir y comer razonablemente, el problema suele ser la fatiga, no el plan: haz una
semana de **descarga** más ligera — mira
[sueño, descargas y recuperación](/es/docs/sleep) — y retoma. La fatiga enmascara
la forma; la descarga la revela.

Relacionado: [intensidad y RIR](/es/docs/training-intensity),
[volumen y frecuencia](/es/docs/volume-frequency),
[cómo funciona un programa](/es/docs/how-a-program-works).`,
  },
  {
    id: 'training-intensity',
    category: 'training',
    title: 'Intensidad, RIR y cercanía al fallo',
    tags: ['intensidad', 'rir', 'fallo', 'tensión', 'esfuerzo'],
    body: `Lo cerca que llegue una serie del fallo decide si cuenta. La tensión mecánica es
el principal motor del crecimiento muscular, y la tensión es máxima en las últimas
reps duras de la serie. El **RIR (reps en reserva)** es cómo mides esa cercanía.

## Qué significa el RIR

El RIR es el número de reps que aún podrías hacer antes de fallar. "RIR 2"
significa que paras dos reps antes de tu límite.

Ejemplo práctico: **4×4 a RIR 2–3** es un peso con el que podrías hacer **6–7
reps**, pero haces 4 y dejas 2–3 en la recámara.

| Prescripción | Peso con el que podrías hacer | Reps que haces |
| ------------ | ----------------------------- | -------------- |
| 4×4 RIR 2–3  | 6–7                           | 4              |
| 4×6 RIR 3–4  | 9–10                          | 6              |
| 3×8 RIR 1–2  | 9–10                          | 8              |
| 4×12         | 12 (al fallo)                 | 12             |

> **Consejo:** Si no se indica RIR, la serie va al fallo técnico. "4×12" se lee como "4×12 al fallo".

## Subir la intensidad a lo largo del bloque

Un bloque típico de 4 semanas recorta el RIR cada semana, así que la intensidad
sube a medida que te adaptas:

| Semana | Series                              |
| ------ | ----------------------------------- |
| 1      | 4×6 RIR 3–4                         |
| 2      | 4×6 RIR 2–3                         |
| 3      | 4×6 RIR 1–2                         |
| 4      | 1×6 RIR 0 (fallo) + 3×6 RIR 3–4     |

En la semana 4, tras la serie al fallo, baja a un peso con el que podrías hacer
**7–8 reps** para que las series restantes caigan de verdad en RIR 3–4. Entre
series, quitar ~5% está bien siempre que la fatiga te acerque al fallo más de lo
prescrito.

## Fallo técnico vs fallo absoluto

- **Fallo técnico:** no puedes hacer otra rep *con la misma técnica*; la forma
  empieza a romperse. Aquí termina una serie efectiva.
- **Fallo absoluto:** el peso no se mueve, con la técnica que sea. Rara vez
  compensa la fatiga ni el riesgo de lesión, sobre todo en multiarticulares.

## Principiantes: todo al fallo técnico

Los principiantes calculan mal el RIR de forma sistemática: sienten que les
quedan 1–2 reps cuando les quedan 5. Hasta que tu percepción del esfuerzo se
calibre (meses, no semanas), lleva cada serie efectiva al fallo técnico. Una serie
parada en 15 que podía llegar a 20 fue un calentamiento, no un estímulo.

## 3–5 RIR es trabajo perdido

Una serie que termina con 3–5 reps en reserva genera poca fatiga, pero también
poco resultado: las fibras que crecen se reclutan en las últimas reps duras. O
aprietas la serie o la aceptas como calentamiento. La única excepción es una
semana submáxima planificada dentro de una progresión como la de arriba — e
incluso ahí el bloque termina en el fallo.

## Ajustar el peso

¿Superaste las reps prescritas al RIR prescrito? Sube el peso un poco la semana
siguiente. ¿Te quedaste corto? Bájalo un poco. Ese es todo el ciclo — mira la
[sobrecarga progresiva](/es/docs/progressive-overload).

Relacionado: [volumen y frecuencia](/es/docs/volume-frequency),
[técnica](/es/docs/lifting-technique), [glosario](/es/docs/glossary).`,
  },
  {
    id: 'volume-frequency',
    category: 'training',
    title: 'Volumen, frecuencia y descanso',
    tags: ['volumen', 'frecuencia', 'series', 'hipertrofia', 'descanso', 'densidad'],
    body: `El volumen es cuántas series duras recibe un músculo por semana; la frecuencia,
en cuántas sesiones se reparten; la densidad, cuánto descanso hay entre ellas. Los
tres interactúan, y el primero es el que impulsa el crecimiento.

## Volumen: 10–20 series duras por músculo por semana

| Series semanales por músculo | Significado                                  |
| ---------------------------- | -------------------------------------------- |
| menos de 10                  | Mantenimiento, o una descarga                |
| 10–20                        | El rango productivo respaldado por evidencia |
| más de 20                    | Solo si te recuperas y sigues mejorando      |

Una "serie dura" es una cercana al fallo (mira [intensidad](/es/docs/training-intensity)).
Las series de aproximación no cuentan. El rango no es un precipicio — 8 o 22
series también hacen algo — pero la recuperación, y si tus números siguen
subiendo, te dicen dónde estás. Más no es mejor; *mejor* es mejor: más peso, o
más reps con el mismo peso.

## Frecuencia: cómo repartirlo

- Varios estudios encuentran que **2 sesiones por músculo por semana** es lo mejor
  para crecer.
- Otros encuentran que, a **igual volumen semanal**, 1, 2 o 3 sesiones rinden
  igual (12 series de pecho en un día ≈ 4 series en tres días).
- Regla práctica: **reparte cuando un día sea demasiado**. Si de dieciséis series
  de cuádriceps en una sesión las últimas seis son basura, pásalas a un segundo
  día.

| Series semanales | Sesiones | Series por sesión |
| ---------------- | -------- | ----------------- |
| 10               | 1–2      | 5–10              |
| 16               | 2        | 8                 |
| 20               | 2–3      | 7–10              |

## Densidad: descansa lo suficiente para mover peso

Descansos cortos reducen la carga que puedes mover, y la carga es lo que crea
tensión. No construyas un programa sobre descansos de 30–60 s, circuitos ni
superseries.

| Tipo de ejercicio                                  | Descanso entre series |
| -------------------------------------------------- | --------------------- |
| Multiarticulares (sentadilla, press, remo, peso muerto) | ~3 min           |
| Accesorios (curls, extensiones, elevaciones)       | ~2 min                |
| Abdominales, gemelos, extensiones lumbares         | ~1,5 min              |

> **Consejo:** Deja correr el temporizador de descanso en la pantalla de entreno: cuenta hacia atrás y luego te dice la siguiente serie, así descansas completo sin perder el hilo.

## Días de entreno por semana

Tope: **2 días de entreno consecutivos**, luego uno de descanso. Tres días (lun /
mié / vie) o cuatro (lun–mar / jue–vie) encajan igual. Entrenar tres días por
semana no es "cosa de principiantes": el volumen semanal, la intensidad de las
series y la selección de ejercicios importan mucho más que cuántos días vayas.

Relacionado: [sobrecarga progresiva](/es/docs/progressive-overload),
[cómo funciona un programa](/es/docs/how-a-program-works),
[sueño y descargas](/es/docs/sleep).`,
  },
  {
    id: 'lifting-technique',
    category: 'training',
    title: 'Técnica: ROM, tempo y colocación',
    tags: ['técnica', 'rom', 'tut', 'tempo', 'ejecución', 'colocación'],
    body: `La técnica decide si la carga cae sobre el músculo o sobre una articulación.
También mantiene honesto tu registro: una rep solo cuenta como progreso si se
hizo igual que la vez anterior.

## Orden de prioridad

Cuando algo tiene que ceder, cede en este orden — lo de arriba importa más:

| Prioridad | Palanca     | Regla                                          |
| --------- | ----------- | ---------------------------------------------- |
| 1         | Intensidad  | Lleva las series efectivas cerca del fallo     |
| 2         | Volumen     | 10–20 series duras por músculo por semana      |
| 3         | Técnica     | Carga solo lo que puedas mover con forma limpia |
| 4         | ROM         | Recorrido completo, siempre                    |
| 5         | TUT / tempo | ~3 s de excéntrica, concéntrica rápida         |

Intensidad y volumen son el estímulo. Técnica, recorrido y tempo son cómo lo
aplicas sin lesionarte — y cómo mantienes el progreso medible.

## ROM: recorrido completo, nunca negociable

Más recorrido significa más músculo trabajado. Media sentadilla porque la barra
pesa no es una sentadilla más pesada; es otro ejercicio con peores números. Nunca
cambies recorrido por más peso ni por más reps.

## Tempo y tiempo bajo tensión

- **Excéntrica (bajada): ~3 segundos**, con control.
- **Concéntrica (subida): lo más rápido que puedas** manteniendo el control.
- **TUT por serie: 20–40 s** es la ventana productiva para hipertrofia.

Con rangos por encima de 6 reps, controlar la bajada ya te deja ahí; no hace
falta metrónomo. El TUT es la menos importante de las cinco palancas; no lo
persigas.

## Misma colocación, cada sesión

La anchura de pies, el agarre, la posición de la barra y la profundidad forman
parte del ejercicio. Si cambian entre sesiones, tus números dejan de ser
comparables: 100 kg con los pies más abiertos y menos profundidad no es progreso
sobre 95 kg bien hechos. Fija tu colocación una vez y repítela. Grabarte una serie
de vez en cuando es la forma más fácil de detectar desvíos.

> **Consejo:** Apunta la colocación en las notas del ejercicio (agarre, pies, altura del asiento) para que sobreviva a un parón o a un cambio de gimnasio.

## Técnica y lesiones

Una mala posición — hombros adelantados en un press, lumbar redondeada en un
remo — frena la carga y traslada el estrés a tejidos que se adaptan más despacio
que el músculo. La técnica es lo que permite que la intensidad siga subiendo
durante años.

Relacionado: [sobrecarga progresiva](/es/docs/progressive-overload),
[intensidad y RIR](/es/docs/training-intensity), [glosario](/es/docs/glossary).`,
  },
  {
    id: 'how-a-program-works',
    category: 'training',
    title: 'Cómo funciona un programa',
    tags: ['programa', 'bloques', 'splits', 'horario', 'registro', 'orden de ejercicios'],
    body: `Un programa es un plan que repites unas semanas mientras los números se mueven.
Casi todos los programas de fuerza e hipertrofia comparten la misma forma, y
metri está construido alrededor de ella.

## La forma de un programa

| Parte           | Qué es                                        | En metri  |
| --------------- | --------------------------------------------- | --------- |
| Bloque          | ~4 semanas bajo una misma prescripción        | Fase      |
| Lado (A/B/C/D)  | Un día de entreno                             | Split     |
| Columna         | Una semana de ese lado                        | Semana    |
| Fila            | Un ejercicio con series × reps (y RIR)        | Ejercicio |

Un programa de 3 días tiene tres splits. El lunes va el split A, el miércoles el
B, el viernes el C, y la semana siguiente cada split pasa a su siguiente columna.
Un bloque termina cuando has hecho todas las columnas de todos los splits; el
siguiente bloque cambia la prescripción (o unos pocos ejercicios), no todo el
plan.

## Cómo ejecutar una sesión

1. Calienta con series de aproximación: no cuentan como series efectivas.
2. Haz **todas las series de un ejercicio antes de pasar** al siguiente.
3. **Respeta el orden de los ejercicios.** Un movimiento hecho primero rinde más
   que el mismo movimiento hecho tercero; si reordenas, tus números dejan de ser
   comparables.
4. Nada de superseries, triseries ni circuitos: descansa completo para que la
   carga siga siendo alta.
5. Anota **peso y reps de cada serie**, incluidas las que fallaste.

> **Consejo:** El temporizador de descanso arranca al terminar una serie y te dice cuál es la siguiente, así nunca pierdes el hilo entre ejercicios.

## Organizar la semana

- **Máximo 2 días de entreno consecutivos.** Cuatro días significa lun–mar +
  jue–vie o mar–mié + vie–sáb.
- La hora del día no importa; entrena cuando puedas ser constante.
- Asigna a cada split un día de la semana al iniciar el programa. La pantalla de
  inicio sabrá entonces qué split toca, y solo esos días cuentan para tu racha.

## Los números son una guía

Las reps de la hoja son un objetivo, no una ley. Sacar 10 donde ponía 8, o 7, no
cambia nada — lo que importa es que la serie fuera dura de verdad. Ajusta el peso
la semana siguiente para caer cerca de la prescripción: si te pasas → un poco más
de peso; si te quedas corto → un poco menos. Mira
[intensidad y RIR](/es/docs/training-intensity).

## Cambia de ejercicios pocas veces

El cuerpo se adapta a un movimiento concreto. Si cambias un ejercicio, pasas
semanas reaprendiéndolo antes de que construya algo. Mantén un movimiento hasta
que deje de progresar; cambia **unos pocos ejercicios cada 4–6 meses**, nunca la
lista entera.

## En metri

- Un **programa** contiene una o más **fases** (bloques de N semanas, 4 por
  defecto).
- Cada fase tiene **splits** (sesiones); cada split lista ejercicios con una
  prescripción por semana (series, reps o rango de reps, RIR, descanso).
- **Iniciar** un programa te inscribe en una copia y te pide un horario: el día y
  la hora en que va cada split.
- La pantalla de entreno recorre los ejercicios en orden, registra cada serie y
  corre el temporizador con el descanso que fijes por ejercicio.

Relacionado: [sobrecarga progresiva](/es/docs/progressive-overload),
[volumen, frecuencia y descanso](/es/docs/volume-frequency),
[técnica](/es/docs/lifting-technique).`,
  },
];
