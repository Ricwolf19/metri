import type { DocSection } from '../../types';

export const calculators: DocSection[] = [
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
Epley: 1RM = peso × (1 + reps ÷ 30)
Brzycki: 1RM = peso × 36 ÷ (37 − reps)
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
masa magra = peso × (1 − % grasa ÷ 100)
FFMI = masa magra ÷ altura(m)²
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
];
