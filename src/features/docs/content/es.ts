import type { DocSection } from '../types';

/** Spanish knowledge base — mirrors the ids/order in `en.ts`. */
export const es: DocSection[] = [
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
