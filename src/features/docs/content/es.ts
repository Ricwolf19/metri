import type { DocSection } from '../types';

/**
 * Spanish knowledge base — ported from the metri.info docs (content/docs/es).
 * Mirrors the ids/order in `en.ts`.
 */
export const es: DocSection[] = [
  {
    id: 'welcome',
    category: 'getting-started',
    title: '¿Qué es Metri?',
    tags: ['intro', 'primeros pasos', 'resumen'],
    body: `Metri es un compañero de fitness de código abierto hecho para gente que de verdad
entrena. Reúne las herramientas que usan los lifters serios — calculadoras
basadas en evidencia y una base de conocimiento directa — en un paquete rápido,
privado y sin anuncios.

## Qué incluye

- **Calculadoras** que funcionan al instante en tu navegador: 1RM, TDEE, macros,
  grasa corporal, FFMI, hidratación y más. Las mismas fórmulas que la app móvil.
- **Una base de conocimiento** como esta: guías cortas y prácticas, sin relleno.

> **Consejo:** Todo aquí es gratis y de código abierto. La app móvil funciona totalmente sin conexión — tus datos nunca salen de tu dispositivo.

## Para quién es

Ya entrenes por fuerza, hipertrofia o salud general, Metri te da los números sin adivinanzas — y te explica qué significan.

## Cómo usar la documentación

Empieza por las guías de calculadoras si quieres entender un número concreto, o
lee las secciones de entrenamiento y nutrición para construir un modelo mental.
Cada artículo enlaza a la herramienta correspondiente para pasar del "qué" al
"cómo" en un clic.

> **Nota:** Esto es contenido educativo, no consejo médico. Para cualquier tema de salud, consulta a un profesional cualificado.`,
  },
  {
    id: 'bmr-tdee-guide',
    category: 'calculators',
    title: 'Guía de la calculadora de TMB y GETD',
    tags: ['tmb', 'getd', 'calorías', 'harris-benedict', 'mifflin', 'katch-mcardle', 'metabolismo'],
    body: `Tu **TMB** (Tasa Metabólica Basal) es la energía que tu cuerpo gasta en reposo
total. Tu **GETD** (Gasto Energético Total Diario) es la TMB multiplicada por un
factor de actividad — las calorías que realmente quemas al día y el punto de
partida de cualquier dieta.

**GETD = TMB × multiplicador de actividad** (1.2 sedentario → 1.9 muy activo).

## Tres fórmulas — ¿cuál elegir?

- **Mifflin–St Jeor (1990)** — derivada de una población moderna; hoy es la
  estimación más precisa para el público general. *Úsala si tienes dudas.*
- **Harris–Benedict** — la ecuación clásica publicada por J. A. Harris y
  F. Benedict en **1919**, revisada por Roza y Shizgal en **1984**. Sigue muy
  usada; tiende a sobreestimar un poco en personas con más grasa corporal. Ideal
  para contrastar.
- **Katch–McArdle** — usa tu **masa magra** (necesita tu % de grasa), así que
  tiene en cuenta el músculo. La mejor opción si estás definido/musculado y
  conoces tu grasa corporal.

> **Nota:** Las tres estiman lo mismo. Si dos fórmulas difieren en unos cientos de kcal, es normal — elige una, sigue tu peso 2 semanas y ajusta según la realidad.

## Pruébala

Calcula tus números en la
[calculadora de TDEE](/es/herramientas/calculadora-tdee) y luego pasa el
resultado a la [calculadora de macros](/es/herramientas/calculadora-macros) para
repartirlo en proteína, carbohidratos y grasa.`,
  },
  {
    id: 'macros-calculator-guide',
    category: 'calculators',
    title: 'Guía de la calculadora de macros',
    tags: ['macros', 'proteína', 'carbohidratos', 'grasa', 'calorías', 'objetivo'],
    body: `La calculadora de macros convierte tu **GETD** y un objetivo (definir / mantener
/ volumen) en objetivos diarios de **proteína, carbohidratos y grasa**.

## Cómo funciona

- Ajusta las calorías según tu objetivo — déficit para perder grasa, superávit
  para ganar.
- La **proteína** se fija por kg de peso corporal (el macro prioritario para
  conservar músculo).
- El resto de calorías se reparte entre **carbohidratos** y **grasa**.

> **Consejo:** Cumple primero tus **calorías** y tu **proteína** — el reparto carbos/grasa es preferencia personal. La [guía de macronutrientes](/es/docs/macros) explica qué hace cada macro.

## Pruébala

Abre la [calculadora de macros](/es/herramientas/calculadora-macros) e introduce
tus calorías, peso y objetivo — devuelve los gramos por macro al instante.`,
  },
  {
    id: 'body-fat-guide',
    category: 'calculators',
    title: 'Guía de la calculadora de grasa corporal',
    tags: ['grasa corporal', 'navy', 'circunferencia', 'composición'],
    body: `La calculadora de grasa corporal estima tu **porcentaje de grasa corporal** con
el **método de circunferencias de la Marina de EE. UU.** — una fórmula con cinta
métrica que la Marina adoptó en los años 80.

## Qué mides

- **Cuello** y **cintura** (ambos sexos)
- También la **cadera** (mujeres)

No es tan exacto como un DEXA, pero es gratis, repetible y perfecto para seguir
una tendencia. **Mide igual cada vez** — mismos puntos, relajado, por la mañana.

> **Consejo:** Estima la tuya en la [calculadora de grasa corporal](/es/herramientas/calculadora-grasa-corporal). Combínala con la [guía de FFMI](/es/docs/ffmi-guide) para ver cuánto músculo tienes realmente.`,
  },
  {
    id: 'bmi-healthy-weight',
    category: 'calculators',
    title: 'Guía de peso saludable e IMC',
    tags: ['imc', 'peso ideal', 'rango saludable', 'oms'],
    body: `La calculadora de peso saludable muestra tu **IMC** (Índice de Masa Corporal =
kg ÷ altura²) y el **rango de peso saludable** para tu altura.

## Leer las bandas

El rango aplica la banda de IMC saludable de la OMS (**18.5–24.9**) a tu altura.

| IMC         | Banda      |
| ----------- | ---------- |
| Menos de 18.5 | Bajo peso |
| 18.5–24.9   | Normal     |
| 25–29.9     | Sobrepeso  |
| 30+         | Obesidad   |

> **Nota:** El IMC ignora el músculo, así que personas muy musculadas pueden salir como "sobrepeso" estando definidas. Úsalo como guía aproximada, no como veredicto — combínalo con la [calculadora de grasa corporal](/es/herramientas/calculadora-grasa-corporal).

## Pruébala

Consulta tu rango en la
[calculadora de peso ideal](/es/herramientas/calculadora-peso-ideal).`,
  },
  {
    id: 'one-rep-max-guide',
    category: 'calculators',
    title: 'Guía de la calculadora de 1RM',
    tags: ['1rm', 'una repetición máxima', 'fuerza', 'epley', 'brzycki'],
    body: `La calculadora de 1RM estima tu **1RM** (una repetición máxima) — lo máximo que
podrías levantar una vez — a partir de un peso que levantaste varias
repeticiones. Útil para fijar pesos de trabajo sin probar un máximo real.

## Dos fórmulas

\`\`\`
Epley:   1RM = peso × (1 + reps ÷ 30)
Brzycki: 1RM = peso × 36 ÷ (37 − reps)   # mejor por debajo de ~10 reps
\`\`\`

> **Consejo:** La precisión baja por encima de ~10 reps — usa una serie de **3–6 reps** para la mejor estimación.

## Pruébala

Estima tu máximo en la [calculadora de 1RM](/es/herramientas/calculadora-1rm).`,
  },
  {
    id: 'hydration-calculator-guide',
    category: 'calculators',
    title: 'Guía de la calculadora de hidratación',
    tags: ['agua', 'hidratación', 'litros'],
    body: `La calculadora de hidratación estima tu **objetivo diario de agua** a partir de
tu peso (~**35 ml por kg**) más un extra según tu nivel de actividad.

> **Consejo:** Un truco práctico: salvo el primer pis de la mañana, tu orina debería ser clara/ligera. Bebe un vaso al despertar y uno antes de cada comida.

## Pruébala

Obtén tu objetivo en la
[calculadora de agua](/es/herramientas/calculadora-agua), y lee la
[guía de hidratación y pasos](/es/docs/hydration) para los hábitos que la
acompañan.`,
  },
  {
    id: 'ffmi-guide',
    category: 'calculators',
    title: 'Guía de la calculadora de FFMI',
    tags: ['ffmi', 'masa libre de grasa', 'músculo', 'masa magra'],
    body: `El **FFMI** (Índice de Masa Libre de Grasa) mide cuánta **masa magra** tienes
para tu altura — un número mucho mejor que el IMC para saber "¿cuánto músculo
tengo?", porque quita la grasa de la ecuación.

## La fórmula

\`\`\`
masa libre de grasa = peso × (1 − % grasa ÷ 100)
FFMI                = masa libre de grasa ÷ altura(m)²
\`\`\`

El **FFMI normalizado** ajusta el resultado a una referencia de 1.8 m para
comparar alturas con justicia.

## Leer la escala (hombres)

| FFMI  | Significado                       |
| ----- | --------------------------------- |
| 16–18 | Bajo la media                     |
| 18–20 | Media                             |
| 20–22 | Sobre la media                    |
| 22–23 | Excelente                         |
| 23–26 | Superior                          |
| 26+   | Sospechoso / improbable natural   |

El techo natural ronda **25**.

> **Nota:** Necesitas un **% de grasa** preciso para que esto signifique algo — estímalo antes con la [calculadora de grasa corporal](/es/herramientas/calculadora-grasa-corporal). Los rangos de las mujeres son algo más bajos.

## Pruébala

Calcula tus números en la [calculadora de FFMI](/es/herramientas/calculadora-ffmi).`,
  },
  {
    id: 'macros',
    category: 'nutrition',
    title: 'Cómo contar macros',
    tags: ['macros', 'proteína', 'carbohidratos', 'grasa', 'nutrición'],
    body: `Los macros — proteína, carbohidratos y grasa — son de donde salen tus calorías
diarias. Acierta el reparto y la composición corporal mejora; obsesiónate con
qué comes ignorando los totales y darás vueltas sin avanzar.

## Empieza por las calorías

Tu plan de macros se apoya en un objetivo calórico. Usa la
[calculadora de TDEE](/es/herramientas/calculadora-tdee) para estimar
mantenimiento y luego ajusta:

- **Definición:** ~10–20% por debajo de mantenimiento
- **Mantenimiento:** en mantenimiento
- **Volumen limpio:** ~10% por encima de mantenimiento

## Fija la proteína primero

La proteína es el macro prioritario — conserva músculo en déficit y lo construye
en superávit.

| Meta          | Proteína           |
| ------------- | ------------------ |
| Definición    | 2.2 g / kg de peso |
| Mantenimiento | 2.0 g / kg         |
| Volumen       | 1.8 g / kg         |

## Luego grasa, luego carbohidratos

Pon la grasa en torno al **25% de las calorías** para apoyar las hormonas, y
rellena el resto con carbohidratos — tu principal combustible de entrenamiento.

\`\`\`
kcal_proteína = proteína_g × 4
kcal_grasa    = calorías × 0.25
kcal_carbos   = calorías − kcal_proteína − kcal_grasa
carbos_g      = kcal_carbos / 4
\`\`\`

> **Consejo:** La [calculadora de macros](/es/herramientas/calculadora-macros) hace todo esto por ti — introduce calorías, peso y meta y te devuelve gramos por macro.

## La constancia gana a la precisión

No necesitas clavar los gramos. Si te quedas a ~5–10 g de proteína y mantienes
las calorías en rango la mayoría de los días, progresarás. Cuenta unas semanas
para crear intuición, no para siempre.`,
  },
  {
    id: 'tdee',
    category: 'nutrition',
    title: 'TMB y TDEE explicados',
    tags: ['tdee', 'tmb', 'calorías', 'metabolismo', 'harris-benedict'],
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

> **Nota:** Son estimaciones. Toma el resultado como punto de partida y ajusta según 3–4 semanas de datos reales de peso.

## Usar el número

- Come en tu TDEE para mantener.
- Resta ~300–500 kcal para perder grasa.
- Suma ~200–300 kcal para ganar masa magra.

Después pasa tu objetivo a la
[calculadora de macros](/es/herramientas/calculadora-macros) para repartirlo en
proteína, carbohidratos y grasa.

> **Consejo:** Calcula tus números en la [calculadora de TDEE](/es/herramientas/calculadora-tdee).`,
  },
  {
    id: 'hydration',
    category: 'nutrition',
    title: 'Hidratación y pasos',
    tags: ['agua', 'hidratación', 'pasos', 'salud'],
    body: `- **Agua:** 2–5 L al día. Salvo la primera micción de la mañana, la orina debe
  ser clara/transparente.
- **Tip:** un vaso al despertar y otro antes de cada comida.
- **Pasos diarios:** apunta a **7.500–10.000**. Superar 7.500 se asocia a ~32%
  menos mortalidad por todas las causas.

> **Consejo:** Obtén un objetivo de agua personalizado con la [calculadora de agua](/es/herramientas/calculadora-agua).`,
  },
  {
    id: 'personalizing-your-diet',
    category: 'nutrition',
    title: 'Personaliza tu dieta',
    tags: ['calorías', 'objetivos', 'definir', 'volumen', 'ajustar'],
    body: `Las dietas base rondan las **2.100 kcal**. Las dos palancas que importan:
**calorías totales** y **proteína total**.

## Ajusta según tu objetivo

- **Perder grasa (>65 kg):** deja el plan, entrena tal cual, camina 8–10k pasos.
- **Perder grasa (<65 kg):** baja cada cantidad ~**10%**.
- **Ganar músculo:** deja el plan; si en 2 semanas no subes de peso, añade
  ~**10%**.

> **Nota:** **Regla de oro:** si progresas, no cambies nada. Sin progreso tras 2 semanas → ajusta 5–10%.`,
  },
  {
    id: 'progressive-overload',
    category: 'training',
    title: 'Sobrecarga progresiva',
    tags: ['sobrecarga progresiva', 'hipertrofia', 'fuerza', 'programación'],
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

## Doble progresión

Un esquema simple y duradero para hipertrofia:

- Elige un rango de reps, p. ej. **8–12**.
- Mantén el peso hasta llegar a **12 reps en todas las series**.
- Entonces sube el incremento más pequeño y vuelve hacia 8.

## Mide para progresar

No puedes sobrecargar lo que no mides. Registra peso × reps cada sesión — superar
los números de la semana pasada por una rep ya es progreso. Usa la
[calculadora de 1RM](/es/herramientas/calculadora-1rm) para comparar series
duras en distintos rangos de reps.

## Cuándo bajar el pie

El progreso no es lineal. Cuando el rendimiento se estanca 2–3 sesiones, haz una
semana de **descarga** más ligera — mira la
[guía de recuperación](/es/docs/sleep) — y retoma. La fatiga enmascara la forma;
la descarga la revela.`,
  },
  {
    id: 'training-intensity',
    category: 'training',
    title: 'Intensidad y cercanía al fallo',
    tags: ['intensidad', 'rir', 'fallo', 'tensión'],
    body: `Dejar 3–5 reps en reserva es, casi siempre, perder el tiempo. Los principiantes
se creen más cerca del fallo de lo que están.

- Da todo en cada serie — que cuente.
- La **tensión mecánica** es el factor #1 del crecimiento muscular: entrena
  pesado con buena técnica.
- Registra el **RIR** (reps en reserva): RIR 2 = podrías hacer ~2 más.

> **Consejo:** ¿Términos nuevos? El [glosario](/es/docs/glossary) define RIR, fallo y tensión mecánica.`,
  },
  {
    id: 'volume-frequency',
    category: 'training',
    title: 'Volumen y frecuencia',
    tags: ['volumen', 'frecuencia', 'series', 'hipertrofia'],
    body: `- **Volumen:** **10–20 series duras por músculo por semana** es el rango
  productivo.
- Más no es mejor — *mejor* es mejor. Sube peso o reps con el tiempo.
- **Frecuencia:** **2× por semana** por músculo es un gran punto de partida. A
  igual volumen semanal, 1×/2×/3× dan resultados similares — reparte el volumen
  cuando sea mucho para un día.

> **Consejo:** Combina esto con la [sobrecarga progresiva](/es/docs/progressive-overload) para que el volumen siga siendo productivo.`,
  },
  {
    id: 'lifting-technique',
    category: 'training',
    title: 'Técnica: ROM, TUT y tempo',
    tags: ['técnica', 'rom', 'tut', 'tempo', 'ejecución'],
    body: `- **ROM (recorrido):** recorrido completo = más músculo trabajado. Nunca cambies
  recorrido por más peso.
- **TUT (tiempo bajo tensión):** ~**20–40 s por serie** es lo ideal para
  hipertrofia.
- **Tempo:** controla la **excéntrica** (~3 s al bajar); sube la **concéntrica**
  lo más rápido posible con control.
- La buena técnica evita lesiones *y* impulsa el progreso.

> **Consejo:** ¿Dudas con un término? El [glosario](/es/docs/glossary) cubre ROM, TUT y excéntrica.`,
  },
  {
    id: 'sleep',
    category: 'recovery',
    title: 'Sueño, descargas y recuperación',
    tags: ['recuperación', 'sueño', 'descarga', 'fatiga'],
    body: `No creces en el gimnasio — creces al recuperarte de él. Si la recuperación se
queda atrás, la fatiga se acumula, el rendimiento cae y el progreso se estanca
por mucho que aprietes.

## El sueño primero

El sueño es la herramienta de recuperación de mayor impacto, punto. Apunta a
**7–9 horas**. Dormir poco reduce la fuerza, perjudica la síntesis de proteína
muscular y aumenta el esfuerzo percibido.

> **Consejo:** La regularidad de horarios importa más que cualquier suplemento. Fija tu hora de despertar y lo demás suele acompañar.

## Gestiona la fatiga con descargas

Una **descarga** es una semana ligera planificada que deja disipar la fatiga
acumulada para que aflore tu forma real. Señales de que la necesitas:

- El rendimiento cae 2–3 sesiones seguidas.
- Molestias articulares, motivación por el suelo, peor sueño.
- Arrastras reps que antes eran fáciles.

Una descarga simple: mantén los mismos ejercicios, recorta el **volumen ~40–50%**
(menos series) y quédate un par de reps más lejos del fallo durante una semana.

## Lo básico de la recuperación

| Palanca     | Objetivo                                                        |
| ----------- | --------------------------------------------------------------- |
| Sueño       | 7–9 h, constante                                                |
| Proteína    | mira la [guía de macros](/es/docs/macros)                       |
| Hidratación | usa la [calculadora de agua](/es/herramientas/calculadora-agua) |
| Descarga    | cada 4–8 semanas, o según haga falta                            |

> **Nota:** La capacidad de recuperación es individual y cambia con la edad, el estrés y la nutrición. Ajusta a tu propia respuesta más que a una regla fija.`,
  },
  {
    id: 'supplements',
    category: 'supplements',
    title: 'Suplementos con evidencia',
    tags: ['suplementos', 'creatina', 'proteína', 'cafeína'],
    body: `Los suplementos son opcionales — no indispensables. Los respaldados por
evidencia:

| Suplemento                | Dosis        | Cuándo                                       |
| ------------------------- | ------------ | -------------------------------------------- |
| **Creatina monohidratada**| 5 g/día      | A cualquier hora, diario                     |
| **Proteína whey**         | 20–30 g      | Para alcanzar tu proteína diaria             |
| **Cafeína**               | 100–200 mg   | Pre-entreno (3–4×/sem para evitar tolerancia)|
| **Multivitamínico**       | según envase | Con el desayuno                              |
| **Melatonina**            | 5 mg         | Antes de dormir                              |

> **Nota:** Primero la comida. Los suplementos cubren huecos — no reemplazan calorías, proteína ni sueño.`,
  },
  {
    id: 'measuring-progress',
    category: 'progress',
    title: 'Medir tu progreso',
    tags: ['progreso', 'medidas', 'fotos', 'seguimiento', 'grasa'],
    body: `El peso por sí solo dice poco. Sigue el cuadro completo, **semanal y en
ayunas**:

- **Peso** (misma báscula, misma hora), más cinta: pecho, cintura (bajo el
  ombligo), cadera, ambos brazos, ambas piernas.
- **Fotos** cada 7 días — frente, lateral, espalda; misma luz y hora.
- **Grasa (referencia visual):** ~10–12% = definido; ~15% = atlético; ~20% =
  promedio; 25%+ = sobrepeso evidente. Para valores exactos, acude a un
  profesional.

> **Consejo:** Pon un número con la [calculadora de grasa corporal](/es/herramientas/calculadora-grasa-corporal).`,
  },
  {
    id: 'glossary',
    category: 'glossary',
    title: 'Glosario',
    tags: ['glosario', 'términos', 'rir', 'rom', 'tut'],
    body: `| Término                 | Significado                                    |
| ----------------------- | ---------------------------------------------- |
| **RIR**                 | Reps en reserva — las que faltan para el fallo |
| **Fallo**               | No poder hacer otra rep con buena técnica      |
| **ROM**                 | Rango de movimiento / recorrido                |
| **TUT**                 | Tiempo bajo tensión (~20–40 s/serie)           |
| **Volumen**             | Series semanales por músculo (10–20)           |
| **Frecuencia**          | Veces que entrenas un músculo por semana (2× óptimo) |
| **Tensión mecánica**    | El principal motor del crecimiento muscular    |
| **Excéntrica**          | La fase de bajada (~3 s)                       |`,
  },
];
