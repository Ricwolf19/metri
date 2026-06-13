import type { DocSection } from '../types';

/** Spanish knowledge base — mirrors the ids/order in `en.ts`. */
export const es: DocSection[] = [
  {
    id: 'calc-bmr',
    category: 'calculators',
    title: 'Calculadora de TMB y GETD',
    tags: ['tmb', 'getd', 'calorías', 'harris-benedict', 'mifflin', 'katch-mcardle', 'metabolismo'],
    body: `Tu **TMB** (Tasa Metabólica Basal) es la energía que tu cuerpo gasta en reposo total. Tu **GETD** (Gasto Energético Total Diario) es la TMB multiplicada por un factor de actividad — las calorías que realmente quemas al día y el punto de partida de cualquier dieta.

**GETD = TMB × multiplicador de actividad** (1.2 sedentario → 1.9 muy activo).

### Tres fórmulas — ¿cuál elegir?

- **Mifflin–St Jeor (1990)** — derivada de una población moderna; hoy es la estimación más precisa para el público general. *Úsala si tienes dudas.*
- **Harris–Benedict** — la ecuación clásica publicada por J. A. Harris y F. Benedict en **1919**, revisada por Roza y Shizgal en **1984**. Sigue muy usada; tiende a sobreestimar un poco en personas con más grasa corporal. Ideal para contrastar.
- **Katch–McArdle** — usa tu **masa magra** (necesita tu % de grasa), así que tiene en cuenta el músculo. La mejor opción si estás definido/musculado y conoces tu grasa corporal.

> Las tres estiman lo mismo. Si dos fórmulas difieren en unos cientos de kcal, es normal — elige una, sigue tu peso 2 semanas y ajusta según la realidad.`,
  },
  {
    id: 'calc-macros',
    category: 'calculators',
    title: 'Calculadora de macros',
    tags: ['macros', 'proteína', 'carbohidratos', 'grasa', 'calorías', 'objetivo'],
    body: `Convierte tu **GETD** y un objetivo (definir / mantener / volumen) en objetivos diarios de **proteína, carbohidratos y grasa**.

- Ajusta las calorías según tu objetivo — déficit para perder grasa, superávit para ganar.
- La **proteína** se fija por kg de peso corporal (el macro prioritario para conservar músculo).
- El resto de calorías se reparte entre **carbohidratos** y **grasa**.

> Cumple primero tus **calorías** y tu **proteína** — el reparto carbos/grasa es preferencia personal. El doc *Macronutrientes* explica qué hace cada macro.`,
  },
  {
    id: 'calc-body-fat',
    category: 'calculators',
    title: 'Calculadora de grasa corporal',
    tags: ['grasa corporal', 'navy', 'circunferencia', 'composición'],
    body: `Estima tu **porcentaje de grasa corporal** con el **método de circunferencias de la Marina de EE. UU.** — una fórmula con cinta métrica que la Marina adoptó en los años 80.

Mides:
- **Cuello** y **cintura** (ambos sexos)
- También la **cadera** (mujeres)

No es tan exacto como un DEXA, pero es gratis, repetible y perfecto para seguir una tendencia. **Mide igual cada vez** — mismos puntos, relajado, por la mañana.`,
  },
  {
    id: 'calc-ideal-weight',
    category: 'calculators',
    title: 'Peso saludable e IMC',
    tags: ['imc', 'peso ideal', 'rango saludable', 'oms'],
    body: `Muestra tu **IMC** (Índice de Masa Corporal = kg ÷ altura²) y el **rango de peso saludable** para tu altura.

El rango aplica la banda de IMC saludable de la OMS (**18.5–24.9**) a tu altura. Bandas: menos de 18.5 bajo peso · 18.5–24.9 normal · 25–29.9 sobrepeso · 30+ obesidad.

> El IMC ignora el músculo, así que personas muy musculadas pueden salir como "sobrepeso" estando definidas. Úsalo como guía aproximada, no como veredicto — combínalo con la calculadora de grasa corporal.`,
  },
  {
    id: 'calc-one-rep-max',
    category: 'calculators',
    title: 'Calculadora de 1RM',
    tags: ['1rm', 'una repetición máxima', 'fuerza', 'epley', 'brzycki'],
    body: `Estima tu **1RM** (una repetición máxima) — lo máximo que podrías levantar una vez — a partir de un peso que levantaste varias repeticiones. Útil para fijar pesos de trabajo sin probar un máximo real.

Dos fórmulas:
- **Epley:** 1RM = peso × (1 + reps ÷ 30)
- **Brzycki:** 1RM = peso × 36 ÷ (37 − reps), mejor por debajo de ~10 reps

> La precisión baja por encima de ~10 reps — usa una serie de **3–6 reps** para la mejor estimación.`,
  },
  {
    id: 'calc-water',
    category: 'calculators',
    title: 'Calculadora de hidratación',
    tags: ['agua', 'hidratación', 'litros'],
    body: `Estima tu **objetivo diario de agua** a partir de tu peso (~**35 ml por kg**) más un extra según tu nivel de actividad.

> Un truco práctico: salvo el primer pis de la mañana, tu orina debería ser clara/ligera. Bebe un vaso al despertar y uno antes de cada comida.`,
  },
  {
    id: 'calc-ffmi',
    category: 'calculators',
    title: 'Calculadora de FFMI',
    tags: ['ffmi', 'masa libre de grasa', 'músculo', 'masa magra'],
    body: `El **FFMI** (Índice de Masa Libre de Grasa) mide cuánta **masa magra** tienes para tu altura — un número mucho mejor que el IMC para saber "¿cuánto músculo tengo?", porque quita la grasa de la ecuación.

- **Masa libre de grasa** = peso × (1 − % grasa ÷ 100)
- **FFMI** = masa libre de grasa ÷ altura(m)²
- El **FFMI normalizado** ajusta el resultado a una referencia de 1.8 m para comparar alturas con justicia.

### Leer la escala (hombres)
- **16–18** bajo la media · **18–20** media · **20–22** sobre la media
- **22–23** excelente · **23–26** superior
- **26+** sospechoso / improbable sin sustancias — el techo natural ronda **25**.

> Necesitas un **% de grasa** preciso para que esto signifique algo — estímalo antes con la calculadora de grasa corporal. Los rangos de las mujeres son algo más bajos.`,
  },
  {
    id: 'macros',
    category: 'nutrition',
    title: 'Macronutrientes',
    tags: ['nutrición', 'macros', 'proteína', 'carbohidratos', 'grasa', 'calorías'],
    body: `Tres macros alimentan todo:

- **Carbohidratos** — tu principal fuente de energía. **4 kcal/g**. Fuentes: arroz, avena, patata, fruta, verduras.
- **Proteínas** — generan y reparan tejido (músculo, pelo, uñas). **4 kcal/g**. Fuentes: carne, pescado, huevos, lácteos, legumbres, tofu.
- **Grasas** — energía y transporte de hormonas. **9 kcal/g**. Fuentes: aceite de oliva, frutos secos, aguacate, pescado azul.

> Lo más importante es el **total calórico diario** y la **proteína total** — el resto es detalle.`,
  },
  {
    id: 'hydration',
    category: 'nutrition',
    title: 'Hidratación y pasos',
    tags: ['agua', 'hidratación', 'pasos', 'salud'],
    body: `- **Agua:** 2–5 L al día. Salvo la primera micción de la mañana, la orina debe ser clara/transparente.
- **Tip:** un vaso al despertar y otro antes de cada comida.
- **Pasos diarios:** apunta a **7.500–10.000**. Superar 7.500 se asocia a ~32% menos mortalidad por todas las causas.`,
  },
  {
    id: 'personalize',
    category: 'nutrition',
    title: 'Personaliza tu dieta',
    tags: ['calorías', 'objetivos', 'definir', 'volumen', 'ajustar'],
    body: `Las dietas base rondan las **2.100 kcal**. Las dos palancas que importan: **calorías totales** y **proteína total**.

**Ajusta según tu objetivo:**
- **Perder grasa (>65 kg):** deja el plan, entrena tal cual, camina 8–10k pasos.
- **Perder grasa (<65 kg):** baja cada cantidad ~**10%**.
- **Ganar músculo:** deja el plan; si en 2 semanas no subes de peso, añade ~**10%**.

> **Regla de oro:** si progresas, no cambies nada. Sin progreso tras 2 semanas → ajusta 5–10%.`,
  },
  {
    id: 'intensity',
    category: 'training',
    title: 'Intensidad y cercanía al fallo',
    tags: ['intensidad', 'rir', 'fallo', 'tensión'],
    body: `Dejar 3–5 reps en reserva es, casi siempre, perder el tiempo. Los principiantes se creen más cerca del fallo de lo que están.

- Da todo en cada serie — que cuente.
- La **tensión mecánica** es el factor #1 del crecimiento muscular: entrena pesado con buena técnica.
- Registra el **RIR** (reps en reserva): RIR 2 = podrías hacer ~2 más.`,
  },
  {
    id: 'volume-frequency',
    category: 'training',
    title: 'Volumen y frecuencia',
    tags: ['volumen', 'frecuencia', 'series', 'hipertrofia'],
    body: `- **Volumen:** **10–20 series duras por músculo por semana** es el rango productivo.
- Más no es mejor — *mejor* es mejor. Sube peso o reps con el tiempo.
- **Frecuencia:** **2× por semana** por músculo es un gran punto de partida. A igual volumen semanal, 1×/2×/3× dan resultados similares — reparte el volumen cuando sea mucho para un día.`,
  },
  {
    id: 'technique',
    category: 'training',
    title: 'Técnica: ROM, TUT y tempo',
    tags: ['técnica', 'rom', 'tut', 'tempo', 'ejecución'],
    body: `- **ROM (recorrido):** recorrido completo = más músculo trabajado. Nunca cambies recorrido por más peso.
- **TUT (tiempo bajo tensión):** ~**20–40 s por serie** es lo ideal para hipertrofia.
- **Tempo:** controla la **excéntrica** (~3 s al bajar); sube la **concéntrica** lo más rápido posible con control.
- La buena técnica evita lesiones *y* impulsa el progreso.`,
  },
  {
    id: 'supplements',
    category: 'supplements',
    title: 'Suplementos con evidencia',
    tags: ['suplementos', 'creatina', 'proteína', 'cafeína'],
    body: `Opcionales — no indispensables. Los respaldados por evidencia:

| Suplemento | Dosis | Cuándo |
|---|---|---|
| **Creatina monohidratada** | 5 g/día | A cualquier hora, diario |
| **Proteína whey** | 20–30 g | Para alcanzar tu proteína diaria |
| **Cafeína** | 100–200 mg | Pre-entreno (3–4×/sem para evitar tolerancia) |
| **Multivitamínico** | según envase | Con el desayuno |
| **Melatonina** | 5 mg | Antes de dormir |`,
  },
  {
    id: 'measures',
    category: 'progress',
    title: 'Medir tu progreso',
    tags: ['progreso', 'medidas', 'fotos', 'seguimiento', 'grasa'],
    body: `El peso por sí solo dice poco. Sigue el cuadro completo, **semanal y en ayunas**:

- **Peso** (misma báscula, misma hora), más cinta: pecho, cintura (bajo el ombligo), cadera, ambos brazos, ambas piernas.
- **Fotos** cada 7 días — frente, lateral, espalda; misma luz y hora.
- **Grasa (referencia visual):** ~10–12% = definido; ~15% = atlético; ~20% = promedio; 25%+ = sobrepeso evidente. Para valores exactos, acude a un profesional.`,
  },
  {
    id: 'glossary',
    category: 'glossary',
    title: 'Glosario',
    tags: ['glosario', 'términos', 'rir', 'rom', 'tut'],
    body: `| Término | Significado |
|---|---|
| **RIR** | Reps en reserva — las que faltan para el fallo |
| **Fallo** | No poder hacer otra rep con buena técnica |
| **ROM** | Rango de movimiento / recorrido |
| **TUT** | Tiempo bajo tensión (~20–40 s/serie) |
| **Volumen** | Series semanales por músculo (10–20) |
| **Frecuencia** | Veces que entrenas un músculo por semana (2× óptimo) |
| **Tensión mecánica** | El principal motor del crecimiento muscular |
| **Excéntrica** | La fase de bajada (~3 s) |`,
  },
];
