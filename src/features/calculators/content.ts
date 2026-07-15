import type { Locale } from '@/i18n';
import type { CalcId } from './types';

export type CalcContent = {
  seoTitle: string;
  seoDescription: string;
  h1: string;
  tagline: string;
  about: string[];
  formula?: string;
  how: string[];
  interpret: string[];
  faq: { q: string; a: string }[];
};

export const CALC_CONTENT: Record<CalcId, Record<Locale, CalcContent>> = {
  onerm: {
    en: {
      seoTitle: `1RM Calculator — Estimate Your One-Rep Max`,
      seoDescription: `Free 1RM calculator. Estimate your one-rep max from any weight and rep count using the Epley or Brzycki formula, with a full training-percentage table.`,
      h1: `1RM Calculator`,
      tagline: `Estimate your one-rep max from any set — no max-out attempt needed.`,
      about: [
        `Your one-rep max (1RM) is the heaviest weight you can lift for a single rep. It's the reference point for programming intensity, but testing it directly is risky and fatiguing. This calculator estimates it from a set you've already done.`,
      ],
      formula: `Epley:  1RM = weight × (1 + reps / 30)\nBrzycki: 1RM = weight × 36 / (37 − reps)`,
      how: [
        `Enter the weight you lifted and the reps you completed, then pick a formula. Epley tends to read slightly higher at high reps; Brzycki is conservative and best under ~10 reps. The percentage table shows training loads derived from your estimate.`,
      ],
      interpret: [
        `Use the estimate to set working weights — e.g. hypertrophy work often sits at 67–80% (8–12 reps), strength work at 85%+ (1–5 reps). Estimates get less accurate above ~10 reps, so base 1RM off sets of 5 or fewer when you can.`,
      ],
      faq: [
        {
          q: `Which formula is most accurate?`,
          a: `For low reps (≤5) Epley and Brzycki are very close. Brzycki is more conservative as reps climb; Epley slightly higher. Use the same formula consistently to track progress.`,
        },
        {
          q: `How many reps should I use?`,
          a: `Sets of 3–5 reps give the most reliable estimate. Above 10 reps, accuracy drops because endurance starts to dominate.`,
        },
        {
          q: `Is it safe to skip maxing out?`,
          a: `Yes — estimating from a submaximal set avoids the injury and fatigue risk of a true 1RM attempt, which is why most programs use estimated maxes.`,
        },
      ],
    },
    es: {
      seoTitle: `Calculadora de 1RM — Estima tu repetición máxima`,
      seoDescription: `Calculadora de 1RM gratis. Estima tu repetición máxima desde cualquier peso y número de reps con las fórmulas de Epley o Brzycki, con tabla de porcentajes.`,
      h1: `Calculadora de 1RM`,
      tagline: `Estima tu repetición máxima desde cualquier serie — sin intentar un máximo real.`,
      about: [
        `Tu repetición máxima (1RM) es el peso más alto que puedes levantar una sola vez. Es la referencia para programar la intensidad, pero medirla directamente es arriesgado y fatigante. Esta calculadora la estima desde una serie que ya hiciste.`,
      ],
      formula: `Epley:  1RM = peso × (1 + reps / 30)\nBrzycki: 1RM = peso × 36 / (37 − reps)`,
      how: [
        `Introduce el peso que levantaste y las reps que completaste, y elige una fórmula. Epley tiende a dar algo más alto en reps altas; Brzycki es conservadora y mejor por debajo de ~10 reps. La tabla de porcentajes muestra cargas de entrenamiento derivadas de tu estimación.`,
      ],
      interpret: [
        `Usa la estimación para fijar pesos de trabajo — la hipertrofia suele estar en 67–80% (8–12 reps) y la fuerza en 85%+ (1–5 reps). La precisión baja por encima de ~10 reps, así que estima el 1RM con series de 5 o menos cuando puedas.`,
      ],
      faq: [
        {
          q: `¿Qué fórmula es más precisa?`,
          a: `Con reps bajas (≤5) Epley y Brzycki son muy parecidas. Brzycki es más conservadora al subir las reps; Epley algo más alta. Usa siempre la misma para seguir tu progreso.`,
        },
        {
          q: `¿Cuántas reps debo usar?`,
          a: `Series de 3–5 reps dan la estimación más fiable. Por encima de 10 reps la precisión cae porque domina la resistencia.`,
        },
        {
          q: `¿Es seguro no hacer el máximo real?`,
          a: `Sí — estimar desde una serie submáxima evita el riesgo de lesión y fatiga de un 1RM real, por eso la mayoría de programas usan máximos estimados.`,
        },
      ],
    },
  },

  tdee: {
    en: {
      seoTitle: `TDEE Calculator — Daily Calories & BMR`,
      seoDescription: `Free TDEE calculator. Estimate your maintenance calories and BMR with the Mifflin-St Jeor, Harris-Benedict or Katch-McArdle formula, plus cut and bulk targets.`,
      h1: `TDEE Calculator`,
      tagline: `Find your maintenance calories — the foundation of any nutrition plan.`,
      about: [
        `Your TDEE (total daily energy expenditure) is how many calories you burn in a day. It's your maintenance number: eat at it to stay the same, below it to lose fat, above it to gain. It starts from your BMR (resting burn) scaled by activity.`,
      ],
      formula: `Mifflin-St Jeor:\nBMR = 10×kg + 6.25×cm − 5×age + (male +5 / female −161)\nTDEE = BMR × activity factor`,
      how: [
        `Enter your stats and activity level. Mifflin-St Jeor is the modern default; Harris-Benedict is the classic; Katch-McArdle uses your body-fat % (most accurate if you know it). Your BMR is multiplied by an activity factor from 1.2 (sedentary) to 1.9 (very active).`,
      ],
      interpret: [
        `Maintenance is a starting estimate, not a fixed truth — track weight for 2–3 weeks and adjust. The result also shows a ~500 kcal deficit (mild fat loss) and a ~300 kcal surplus (lean gain). Feed your target into the macro calculator to split it.`,
      ],
      faq: [
        {
          q: `BMR vs TDEE — what's the difference?`,
          a: `BMR is what you burn at complete rest. TDEE is BMR plus activity, digestion and movement — your real daily maintenance calories.`,
        },
        {
          q: `Which formula should I pick?`,
          a: `Mifflin-St Jeor for most people. Use Katch-McArdle if you have a reliable body-fat measurement, since it accounts for lean mass.`,
        },
        {
          q: `Why isn't my weight matching the estimate?`,
          a: `Formulas are population averages. Use the number as a starting point, then nudge calories based on 2–3 weeks of real scale data.`,
        },
      ],
    },
    es: {
      seoTitle: `Calculadora de TDEE — Calorías diarias y TMB`,
      seoDescription: `Calculadora de TDEE gratis. Estima tus calorías de mantenimiento y TMB con Mifflin-St Jeor, Harris-Benedict o Katch-McArdle, con objetivos de déficit y volumen.`,
      h1: `Calculadora de TDEE`,
      tagline: `Encuentra tus calorías de mantenimiento — la base de cualquier plan.`,
      about: [
        `Tu TDEE (gasto energético diario total) es cuántas calorías quemas en un día. Es tu número de mantenimiento: come en él para mantenerte, por debajo para perder grasa, por encima para ganar. Parte de tu TMB (gasto en reposo) escalada por actividad.`,
      ],
      formula: `Mifflin-St Jeor:\nTMB = 10×kg + 6.25×cm − 5×edad + (hombre +5 / mujer −161)\nTDEE = TMB × factor de actividad`,
      how: [
        `Introduce tus datos y nivel de actividad. Mifflin-St Jeor es la opción moderna por defecto; Harris-Benedict la clásica; Katch-McArdle usa tu % de grasa (la más precisa si lo conoces). Tu TMB se multiplica por un factor de 1.2 (sedentario) a 1.9 (muy activo).`,
      ],
      interpret: [
        `El mantenimiento es una estimación inicial, no una verdad fija — sigue tu peso 2–3 semanas y ajusta. El resultado también muestra un déficit de ~500 kcal (pérdida suave) y un superávit de ~300 kcal (ganancia limpia). Pasa tu objetivo a la calculadora de macros.`,
      ],
      faq: [
        {
          q: `TMB vs TDEE — ¿cuál es la diferencia?`,
          a: `La TMB es lo que quemas en reposo absoluto. El TDEE es la TMB más actividad, digestión y movimiento — tus calorías reales de mantenimiento.`,
        },
        {
          q: `¿Qué fórmula elijo?`,
          a: `Mifflin-St Jeor para la mayoría. Usa Katch-McArdle si tienes una medición fiable de grasa corporal, porque considera la masa magra.`,
        },
        {
          q: `¿Por qué mi peso no coincide con la estimación?`,
          a: `Las fórmulas son promedios poblacionales. Úsala como punto de partida y ajusta calorías según 2–3 semanas de datos reales de la báscula.`,
        },
      ],
    },
  },

  macros: {
    en: {
      seoTitle: `Macro Calculator — Protein, Carbs & Fat`,
      seoDescription: `Free macro calculator. Turn your daily calories into protein, carb and fat targets based on your goal and bodyweight, with the math explained.`,
      h1: `Macro Calculator`,
      tagline: `Split your calories into protein, carbs and fat that fit your goal.`,
      about: [
        `Macros are where your calories come from. This calculator sets protein from your bodyweight and goal, fat as a share of calories for hormones, and fills the rest with carbs — your main training fuel.`,
      ],
      formula: `protein = g/kg × bodyweight\nfat = 25% of calories ÷ 9\ncarbs = (calories − protein×4 − fat×9) ÷ 4`,
      how: [
        `Enter your daily calories (from the TDEE calculator), your bodyweight and your goal. Protein scales with goal — 2.2 g/kg cutting, 2.0 maintaining, 1.8 bulking — fat is ~25% of calories, and carbs take the remainder.`,
      ],
      interpret: [
        `Hit protein most reliably; carbs and fat have more flexibility. You don't need to nail grams exactly — land within ~5–10 g of protein and keep calories in range, and body composition will follow.`,
      ],
      faq: [
        {
          q: `How much protein do I need?`,
          a: `Roughly 1.8–2.2 g per kg of bodyweight depending on goal. More in a deficit to protect muscle, slightly less in a surplus.`,
        },
        {
          q: `Do carbs make you fat?`,
          a: `No — total calories drive fat gain. Carbs are the main fuel for hard training; cutting them only matters via the calories they remove.`,
        },
        {
          q: `Where do I get my calorie number?`,
          a: `Use the TDEE calculator for maintenance, then adjust for your goal before entering it here.`,
        },
      ],
    },
    es: {
      seoTitle: `Calculadora de Macros — Proteína, carbohidratos y grasa`,
      seoDescription: `Calculadora de macros gratis. Convierte tus calorías diarias en objetivos de proteína, carbohidratos y grasa según tu meta y peso, con la matemática explicada.`,
      h1: `Calculadora de Macros`,
      tagline: `Reparte tus calorías en proteína, carbohidratos y grasa según tu meta.`,
      about: [
        `Los macros son de donde salen tus calorías. Esta calculadora fija la proteína según tu peso y meta, la grasa como porcentaje de calorías para las hormonas, y rellena el resto con carbohidratos — tu principal combustible de entrenamiento.`,
      ],
      formula: `proteína = g/kg × peso\ngrasa = 25% de calorías ÷ 9\ncarbos = (calorías − proteína×4 − grasa×9) ÷ 4`,
      how: [
        `Introduce tus calorías diarias (de la calculadora de TDEE), tu peso y tu meta. La proteína escala con la meta — 2.2 g/kg en déficit, 2.0 en mantenimiento, 1.8 en volumen — la grasa es ~25% de las calorías y los carbohidratos toman el resto.`,
      ],
      interpret: [
        `Cumple la proteína de forma fiable; carbohidratos y grasa tienen más margen. No necesitas clavar los gramos — quédate a ~5–10 g de proteína y mantén las calorías en rango, y la composición corporal acompañará.`,
      ],
      faq: [
        {
          q: `¿Cuánta proteína necesito?`,
          a: `Aproximadamente 1.8–2.2 g por kg de peso según la meta. Más en déficit para proteger músculo, algo menos en superávit.`,
        },
        {
          q: `¿Los carbohidratos engordan?`,
          a: `No — las calorías totales determinan la ganancia de grasa. Los carbohidratos son el combustible del entrenamiento duro; recortarlos solo cuenta por las calorías que quitan.`,
        },
        {
          q: `¿De dónde saco mi número de calorías?`,
          a: `Usa la calculadora de TDEE para el mantenimiento y ajústalo a tu meta antes de introducirlo aquí.`,
        },
      ],
    },
  },

  bodyfat: {
    en: {
      seoTitle: `Body Fat Calculator — U.S. Navy Method`,
      seoDescription: `Free body fat calculator using the U.S. Navy circumference method. Estimate your body-fat percentage from a few tape measurements — no calipers needed.`,
      h1: `Body Fat Calculator`,
      tagline: `Estimate body-fat percentage with a tape measure — the U.S. Navy method.`,
      about: [
        `The U.S. Navy method estimates body-fat percentage from circumference measurements. It needs only a tape measure and gives a repeatable number that's great for tracking change over time.`,
      ],
      formula: `Men: 495 / (1.0324 − 0.19077·log10(waist−neck) + 0.15456·log10(height)) − 450`,
      how: [
        `Measure your neck, waist (and hips for women) in centimetres, relaxed, without compressing the skin. Enter them with your height and sex. Consistency matters more than perfection — measure the same way each time.`,
      ],
      interpret: [
        `Treat the result as an estimate (±3–4%). What matters is the trend: a falling number on consistent measurements means you're losing fat. Categories range from essential fat through athletic, fitness, average and high.`,
      ],
      faq: [
        {
          q: `How accurate is the Navy method?`,
          a: `It's typically within 3–4% of more advanced methods like DEXA, and far more accurate for tracking change than a single body-fat scale reading.`,
        },
        {
          q: `Where exactly do I measure?`,
          a: `Neck just below the larynx; waist at the navel for men; waist at the narrowest point and hips at the widest for women. Keep the tape level and snug, not tight.`,
        },
        {
          q: `Why does it ask for hips for women only?`,
          a: `The female formula includes hip circumference to better account for fat distribution; the male formula does not need it.`,
        },
      ],
    },
    es: {
      seoTitle: `Calculadora de Grasa Corporal — Método Marina de EE. UU.`,
      seoDescription: `Calculadora de grasa corporal gratis con el método de circunferencias de la Marina de EE. UU. Estima tu % de grasa con unas medidas de cinta — sin plicómetro.`,
      h1: `Calculadora de Grasa Corporal`,
      tagline: `Estima el % de grasa con una cinta métrica — el método de la Marina de EE. UU.`,
      about: [
        `El método de la Marina de EE. UU. estima el porcentaje de grasa a partir de medidas de circunferencia. Solo necesita una cinta métrica y da un número repetible, ideal para seguir el cambio en el tiempo.`,
      ],
      formula: `Hombres: 495 / (1.0324 − 0.19077·log10(cintura−cuello) + 0.15456·log10(altura)) − 450`,
      how: [
        `Mide cuello, cintura (y cadera en mujeres) en centímetros, relajado y sin comprimir la piel. Introdúcelas con tu altura y sexo. La constancia importa más que la perfección — mide igual cada vez.`,
      ],
      interpret: [
        `Toma el resultado como estimación (±3–4%). Lo que importa es la tendencia: un número que baja con medidas consistentes significa que pierdes grasa. Las categorías van de grasa esencial a atlética, fitness, media y alta.`,
      ],
      faq: [
        {
          q: `¿Qué precisión tiene el método Navy?`,
          a: `Suele quedar dentro de un 3–4% de métodos avanzados como DEXA, y es mucho más fiable para seguir el cambio que una báscula de grasa.`,
        },
        {
          q: `¿Dónde mido exactamente?`,
          a: `Cuello justo bajo la laringe; cintura a la altura del ombligo en hombres; cintura en el punto más estrecho y cadera en el más ancho en mujeres. Cinta nivelada y ajustada, no apretada.`,
        },
        {
          q: `¿Por qué pide cadera solo en mujeres?`,
          a: `La fórmula femenina incluye la circunferencia de cadera para reflejar mejor la distribución de grasa; la masculina no la necesita.`,
        },
      ],
    },
  },

  bmi: {
    en: {
      seoTitle: `BMI Calculator — Body Mass Index & Healthy Weight`,
      seoDescription: `Free BMI calculator. Get your body mass index, your WHO weight category and your healthy-weight range from height and weight.`,
      h1: `BMI Calculator`,
      tagline: `Your body mass index and the healthy-weight range for your height.`,
      about: [
        `Body Mass Index (BMI) is a quick screening number relating weight to height. It's not a measure of body composition, but it's a useful population-level reference and shows the healthy-weight range for your height.`,
      ],
      formula: `BMI = weight(kg) / height(m)²`,
      how: [
        `Enter your height and weight. The result places you in a WHO category — underweight (<18.5), normal (18.5–24.9), overweight (25–29.9) or obese (≥30) — and shows the weight range that keeps you in the healthy band.`,
      ],
      interpret: [
        `BMI doesn't distinguish muscle from fat, so muscular lifters can read 'overweight' while lean. Use it as a rough guide alongside body-fat percentage and waist measurements, not as a verdict.`,
      ],
      faq: [
        {
          q: `Is BMI accurate for athletes?`,
          a: `Not reliably — muscle is dense, so trained lifters often score 'overweight' despite being lean. Pair BMI with body-fat % for a fuller picture.`,
        },
        {
          q: `What's a healthy BMI?`,
          a: `The WHO healthy range is 18.5–24.9. The calculator converts that into a weight range for your specific height.`,
        },
        {
          q: `Does BMI differ by sex or age?`,
          a: `The standard adult formula doesn't adjust for sex or age. Those factors matter for interpretation, which is why body composition is a better individual metric.`,
        },
      ],
    },
    es: {
      seoTitle: `Calculadora de IMC — Índice de masa corporal y peso saludable`,
      seoDescription: `Calculadora de IMC gratis. Obtén tu índice de masa corporal, tu categoría de peso de la OMS y tu rango de peso saludable a partir de altura y peso.`,
      h1: `Calculadora de IMC`,
      tagline: `Tu índice de masa corporal y el rango de peso saludable para tu altura.`,
      about: [
        `El Índice de Masa Corporal (IMC) es un número rápido de cribado que relaciona peso y altura. No mide la composición corporal, pero es una referencia útil a nivel poblacional y muestra el rango de peso saludable para tu altura.`,
      ],
      formula: `IMC = peso(kg) / altura(m)²`,
      how: [
        `Introduce tu altura y peso. El resultado te sitúa en una categoría de la OMS — bajo peso (<18.5), normal (18.5–24.9), sobrepeso (25–29.9) u obesidad (≥30) — y muestra el rango de peso que te mantiene en la banda saludable.`,
      ],
      interpret: [
        `El IMC no distingue músculo de grasa, así que un lifter musculado puede marcar 'sobrepeso' estando definido. Úsalo como guía aproximada junto al % de grasa y la cintura, no como un veredicto.`,
      ],
      faq: [
        {
          q: `¿Es preciso el IMC para atletas?`,
          a: `No de forma fiable — el músculo es denso, así que los lifters entrenados marcan 'sobrepeso' a menudo estando definidos. Combina el IMC con el % de grasa.`,
        },
        {
          q: `¿Qué IMC es saludable?`,
          a: `El rango saludable de la OMS es 18.5–24.9. La calculadora lo convierte en un rango de peso para tu altura concreta.`,
        },
        {
          q: `¿El IMC cambia por sexo o edad?`,
          a: `La fórmula estándar para adultos no ajusta por sexo ni edad. Esos factores importan para interpretar, por eso la composición corporal es mejor métrica individual.`,
        },
      ],
    },
  },

  ffmi: {
    en: {
      seoTitle: `FFMI Calculator — Fat-Free Mass Index`,
      seoDescription: `Free FFMI calculator. Estimate your fat-free mass index and see how much muscle you carry relative to your height — the lean alternative to BMI.`,
      h1: `FFMI Calculator`,
      tagline: `How much muscle you carry for your height — the lean version of BMI.`,
      about: [
        `Fat-Free Mass Index (FFMI) is like BMI but for lean mass only. It tells you how much muscle you carry relative to height, and is popular for gauging muscular development and natural-physique potential.`,
      ],
      formula: `fat-free mass = weight × (1 − bodyfat%)\nFFMI = FFM / height(m)²\nnormalized = FFMI + 6.1 × (1.8 − height_m)`,
      how: [
        `Enter your weight, height and body-fat percentage (use the body-fat calculator if you don't know it). We compute fat-free mass, divide by height squared, then normalize to a 1.8 m reference so people of different heights can be compared.`,
      ],
      interpret: [
        `For men, ~18–20 is average, 22–23 is excellent, and the mid-20s approach the natural ceiling; values much above ~25 are uncommon without exceptional genetics. Use it to track muscle gain, not as a hard limit.`,
      ],
      faq: [
        {
          q: `What's a good FFMI?`,
          a: `Around 18–20 is average for trained men, 22–23 is excellent, and ~25 is near the natural upper range. Women's reference values run lower.`,
        },
        {
          q: `Why normalize FFMI?`,
          a: `Normalizing to 1.8 m height removes the bias that taller people get higher raw scores, making comparisons fairer.`,
        },
        {
          q: `Do I need an accurate body-fat number?`,
          a: `Yes — FFMI is sensitive to body-fat input. Use a consistent method (e.g. the Navy estimate) so your trend is meaningful.`,
        },
      ],
    },
    es: {
      seoTitle: `Calculadora de FFMI — Índice de masa libre de grasa`,
      seoDescription: `Calculadora de FFMI gratis. Estima tu índice de masa libre de grasa y cuánto músculo llevas en relación a tu altura — la alternativa magra al IMC.`,
      h1: `Calculadora de FFMI`,
      tagline: `Cuánto músculo llevas para tu altura — la versión magra del IMC.`,
      about: [
        `El Índice de Masa Libre de Grasa (FFMI) es como el IMC pero solo con masa magra. Indica cuánto músculo llevas en relación a la altura y es popular para valorar el desarrollo muscular y el potencial natural.`,
      ],
      formula: `masa libre de grasa = peso × (1 − %grasa)\nFFMI = MLG / altura(m)²\nnormalizado = FFMI + 6.1 × (1.8 − altura_m)`,
      how: [
        `Introduce tu peso, altura y porcentaje de grasa (usa la calculadora de grasa corporal si no lo sabes). Calculamos la masa libre de grasa, la dividimos por la altura al cuadrado y la normalizamos a una referencia de 1.8 m para poder comparar alturas distintas.`,
      ],
      interpret: [
        `En hombres, ~18–20 es media, 22–23 es excelente y los 25 se acercan al techo natural; valores muy por encima de ~25 son raros sin genética excepcional. Úsalo para seguir la ganancia muscular, no como límite rígido.`,
      ],
      faq: [
        {
          q: `¿Qué FFMI es bueno?`,
          a: `En torno a 18–20 es media en hombres entrenados, 22–23 es excelente y ~25 es casi el tope natural. En mujeres los valores de referencia son menores.`,
        },
        {
          q: `¿Por qué se normaliza el FFMI?`,
          a: `Normalizar a 1.8 m de altura elimina el sesgo de que las personas más altas obtengan puntuaciones brutas mayores, haciendo más justa la comparación.`,
        },
        {
          q: `¿Necesito un % de grasa preciso?`,
          a: `Sí — el FFMI es sensible a ese dato. Usa un método consistente (p. ej. la estimación Navy) para que tu tendencia tenga sentido.`,
        },
      ],
    },
  },

  water: {
    en: {
      seoTitle: `Water Intake Calculator — Daily Hydration`,
      seoDescription: `Free water intake calculator. Estimate how much water to drink per day from your bodyweight and activity level, in litres, millilitres and cups.`,
      h1: `Water Intake Calculator`,
      tagline: `How much water to drink per day, based on your weight and activity.`,
      about: [
        `Hydration affects performance, focus and recovery. This calculator estimates a daily water target from your bodyweight plus a bonus for how active you are.`,
      ],
      formula: `ml = bodyweight(kg) × 35 + activity bonus`,
      how: [
        `Enter your weight and activity level. The base is ~35 ml per kg of bodyweight, plus 0–1000 ml depending on activity. The result is shown in litres, millilitres and roughly-240 ml cups.`,
      ],
      interpret: [
        `This is a baseline, not a hard rule — heat, sweat rate and diet all shift your needs. A simple field check: pale-straw urine usually means you're well hydrated.`,
      ],
      faq: [
        {
          q: `Does coffee or tea count?`,
          a: `Yes — fluids from drinks and water-rich foods all contribute. The target is total daily fluid, not plain water only.`,
        },
        {
          q: `Can you drink too much water?`,
          a: `Rarely, but chugging far beyond your needs in a short time can dilute sodium. Spread intake across the day.`,
        },
        {
          q: `Should I drink more on training days?`,
          a: `Yes — that's what the activity bonus accounts for. Add extra to replace heavy sweat losses in hot sessions.`,
        },
      ],
    },
    es: {
      seoTitle: `Calculadora de Agua — Hidratación diaria`,
      seoDescription: `Calculadora de agua gratis. Estima cuánta agua beber al día según tu peso y nivel de actividad, en litros, mililitros y vasos.`,
      h1: `Calculadora de Agua`,
      tagline: `Cuánta agua beber al día, según tu peso y actividad.`,
      about: [
        `La hidratación afecta al rendimiento, la concentración y la recuperación. Esta calculadora estima un objetivo diario de agua a partir de tu peso más un extra según lo activo que seas.`,
      ],
      formula: `ml = peso(kg) × 35 + extra por actividad`,
      how: [
        `Introduce tu peso y nivel de actividad. La base es ~35 ml por kg de peso, más 0–1000 ml según la actividad. El resultado se muestra en litros, mililitros y vasos de ~240 ml.`,
      ],
      interpret: [
        `Es una base, no una regla rígida — el calor, la sudoración y la dieta cambian tus necesidades. Una comprobación simple: una orina de color pajizo claro suele indicar buena hidratación.`,
      ],
      faq: [
        {
          q: `¿Cuenta el café o el té?`,
          a: `Sí — los líquidos de bebidas y alimentos ricos en agua suman. El objetivo es el líquido total diario, no solo agua pura.`,
        },
        {
          q: `¿Se puede beber demasiada agua?`,
          a: `Rara vez, pero beber muchísimo en poco tiempo puede diluir el sodio. Reparte la ingesta a lo largo del día.`,
        },
        {
          q: `¿Debo beber más los días de entreno?`,
          a: `Sí — eso refleja el extra por actividad. Añade más para reponer el sudor en sesiones calurosas.`,
        },
      ],
    },
  },

  plates: {
    en: {
      seoTitle: `Plate Calculator — Barbell Loading`,
      seoDescription: `Free barbell plate calculator. Enter a target weight and bar weight to see exactly which plates to load on each side.`,
      h1: `Plate Calculator`,
      tagline: `Which plates to load on each side of the bar for any target weight.`,
      about: [
        `Stop doing barbell math mid-warmup. Enter your target total and bar weight and this shows the plates to put on each side, using standard kg plates.`,
      ],
      formula: `per side = (target − bar) / 2, loaded heaviest-first`,
      how: [
        `Enter the total weight you want on the bar and your bar's weight (20 kg Olympic by default). The calculator subtracts the bar, halves the rest, and greedily loads the largest plates first: 25, 20, 15, 10, 5, 2.5, 1.25 kg.`,
      ],
      interpret: [
        `Each row is the plate and how many go on each side. If there's a remainder, your target isn't reachable with standard plates and the smaller increment — round to the nearest loadable weight.`,
      ],
      faq: [
        {
          q: `What bar weight should I use?`,
          a: `A standard Olympic barbell is 20 kg; women's bars are 15 kg and some technique bars are lighter. Set it to match your bar.`,
        },
        {
          q: `What plates does it assume?`,
          a: `Standard kilo plates: 25, 20, 15, 10, 5, 2.5 and 1.25 kg, loaded largest-first on each side.`,
        },
        {
          q: `Why is there a remainder?`,
          a: `Because your target can't be made exactly from the available plates per side. Adjust the target to the nearest loadable number.`,
        },
      ],
    },
    es: {
      seoTitle: `Calculadora de Discos — Carga de barra`,
      seoDescription: `Calculadora de discos gratis. Introduce un peso objetivo y el peso de la barra para ver exactamente qué discos cargar en cada lado.`,
      h1: `Calculadora de Discos`,
      tagline: `Qué discos cargar en cada lado de la barra para cualquier peso objetivo.`,
      about: [
        `Deja de hacer cuentas en pleno calentamiento. Introduce tu peso total objetivo y el de la barra y verás los discos a poner en cada lado, con discos estándar en kg.`,
      ],
      formula: `por lado = (objetivo − barra) / 2, cargando del más pesado primero`,
      how: [
        `Introduce el peso total que quieres en la barra y el peso de tu barra (20 kg olímpica por defecto). La calculadora resta la barra, divide el resto a la mitad y carga los discos más grandes primero: 25, 20, 15, 10, 5, 2.5, 1.25 kg.`,
      ],
      interpret: [
        `Cada fila es el disco y cuántos van en cada lado. Si queda un resto, tu objetivo no se alcanza con discos estándar y el incremento menor — redondea al peso cargable más cercano.`,
      ],
      faq: [
        {
          q: `¿Qué peso de barra uso?`,
          a: `La barra olímpica estándar pesa 20 kg; las de mujer 15 kg y algunas técnicas menos. Ajústalo a tu barra.`,
        },
        {
          q: `¿Qué discos asume?`,
          a: `Discos estándar en kilos: 25, 20, 15, 10, 5, 2.5 y 1.25 kg, cargando del más grande al más pequeño en cada lado.`,
        },
        {
          q: `¿Por qué hay un resto?`,
          a: `Porque tu objetivo no se puede formar exactamente con los discos disponibles por lado. Ajusta el objetivo al número cargable más cercano.`,
        },
      ],
    },
  },

  idealweight: {
    en: {
      seoTitle: `Ideal Weight Calculator — Devine, Robinson & BMI Range`,
      seoDescription: `Free ideal weight calculator. Find your healthy weight from height and sex using the Devine and Robinson formulas, plus your BMI healthy-weight range.`,
      h1: `Ideal Weight Calculator`,
      tagline: `Find a healthy target weight for your height and sex.`,
      about: [
        `Ideal-weight formulas give a reference point for a healthy bodyweight based on height and sex. They predate modern body-composition tools, so treat the number as a guide rather than a target written in stone.`,
      ],
      formula: `Devine (male):   50 + 2.3 × (height_in − 60)\nDevine (female): 45.5 + 2.3 × (height_in − 60)\nRobinson (male): 52 + 1.9 × (height_in − 60)`,
      how: [
        `Enter your height and sex. We compute the Devine estimate (the clinical standard, also used for drug dosing), the slightly different Robinson estimate, and the WHO healthy-weight range derived from a BMI of 18.5–24.9.`,
      ],
      interpret: [
        `Use the BMI range as your healthy band and the Devine/Robinson numbers as a midpoint reference. Muscular people will sit above these estimates without being overweight — pair them with body-fat percentage for a fuller picture.`,
      ],
      faq: [
        {
          q: `Which formula is best?`,
          a: `Devine is the most widely used and is the clinical default. Robinson is a refinement; both land close together. The BMI range is the most evidence-based way to define 'healthy'.`,
        },
        {
          q: `Is there one perfect weight?`,
          a: `No — a healthy weight is a range, not a single number. These formulas give a midpoint; the BMI band shows the full healthy span for your height.`,
        },
        {
          q: `Do these work for athletes?`,
          a: `Less well. Muscle adds weight without adding fat, so trained lifters often exceed 'ideal' figures while being lean. Use body-fat percentage alongside them.`,
        },
      ],
    },
    es: {
      seoTitle: `Calculadora de Peso Ideal — Devine, Robinson y rango de IMC`,
      seoDescription: `Calculadora de peso ideal gratis. Encuentra tu peso saludable según altura y sexo con las fórmulas de Devine y Robinson, más tu rango de peso saludable por IMC.`,
      h1: `Calculadora de Peso Ideal`,
      tagline: `Encuentra un peso objetivo saludable para tu altura y sexo.`,
      about: [
        `Las fórmulas de peso ideal dan una referencia de peso saludable según altura y sexo. Son anteriores a las herramientas modernas de composición corporal, así que toma el número como guía y no como un objetivo inamovible.`,
      ],
      formula: `Devine (hombre):  50 + 2.3 × (altura_in − 60)\nDevine (mujer):  45.5 + 2.3 × (altura_in − 60)\nRobinson (hombre): 52 + 1.9 × (altura_in − 60)`,
      how: [
        `Introduce tu altura y sexo. Calculamos la estimación de Devine (el estándar clínico, también usado para dosificar fármacos), la algo distinta de Robinson y el rango de peso saludable de la OMS derivado de un IMC de 18.5–24.9.`,
      ],
      interpret: [
        `Usa el rango de IMC como tu banda saludable y los valores Devine/Robinson como referencia central. Las personas musculadas estarán por encima sin tener sobrepeso — combínalos con el % de grasa para una imagen completa.`,
      ],
      faq: [
        {
          q: `¿Qué fórmula es mejor?`,
          a: `Devine es la más usada y el estándar clínico. Robinson es un refinamiento; ambas quedan cerca. El rango de IMC es la forma más respaldada por evidencia de definir 'saludable'.`,
        },
        {
          q: `¿Existe un peso perfecto?`,
          a: `No — un peso saludable es un rango, no un único número. Estas fórmulas dan un punto medio; la banda de IMC muestra todo el rango saludable para tu altura.`,
        },
        {
          q: `¿Sirven para atletas?`,
          a: `Menos. El músculo añade peso sin añadir grasa, así que los lifters entrenados superan las cifras 'ideales' estando definidos. Úsalas junto al % de grasa.`,
        },
      ],
    },
  },

  deficit: {
    en: {
      seoTitle: `Calorie Deficit Calculator — Goal Weight Timeline`,
      seoDescription: `Free calorie deficit calculator. Enter your current and goal weight to get the daily calorie deficit and a realistic timeline in weeks and months.`,
      h1: `Calorie Deficit Calculator`,
      tagline: `Turn a goal weight into a daily deficit and a realistic timeline.`,
      about: [
        `Losing fat means eating fewer calories than you burn. This calculator turns your goal weight and chosen pace into the daily deficit you need and how long it will take, based on roughly 7,700 kcal per kilogram of body mass.`,
      ],
      formula: `daily deficit = weekly rate × 7700 / 7\nweeks = |current − goal| / weekly rate`,
      how: [
        `Enter your current weight, goal weight and a weekly rate of change (0.5 kg/week is a sustainable default). We compute the daily calorie deficit and project the number of weeks and months to reach your goal. It also works for gaining weight.`,
      ],
      interpret: [
        `A 0.25–0.75 kg/week loss is sustainable for most people; faster than ~1% of bodyweight per week risks muscle loss. The timeline is an estimate — real progress is rarely perfectly linear, so reassess every few weeks.`,
      ],
      faq: [
        {
          q: `How big should my deficit be?`,
          a: `A deficit producing 0.25–0.75 kg of loss per week suits most people. Aggressive deficits work short-term but are harder to sustain and risk muscle loss.`,
        },
        {
          q: `Why 7,700 kcal per kg?`,
          a: `It's the common approximation for the energy in a kilogram of body mass. It's not exact for everyone, but it's a reliable planning figure.`,
        },
        {
          q: `Can I use this to gain weight?`,
          a: `Yes — set a goal heavier than your current weight and the result becomes a daily surplus with the same timeline math.`,
        },
      ],
    },
    es: {
      seoTitle: `Calculadora de Déficit Calórico — Plazo hasta tu peso objetivo`,
      seoDescription: `Calculadora de déficit calórico gratis. Introduce tu peso actual y objetivo para obtener el déficit diario y un plazo realista en semanas y meses.`,
      h1: `Calculadora de Déficit Calórico`,
      tagline: `Convierte un peso objetivo en un déficit diario y un plazo realista.`,
      about: [
        `Perder grasa significa comer menos calorías de las que gastas. Esta calculadora convierte tu peso objetivo y el ritmo elegido en el déficit diario que necesitas y cuánto tardarás, según unas 7.700 kcal por kilo de masa corporal.`,
      ],
      formula: `déficit diario = ritmo semanal × 7700 / 7\nsemanas = |actual − objetivo| / ritmo semanal`,
      how: [
        `Introduce tu peso actual, tu peso objetivo y un ritmo semanal de cambio (0.5 kg/semana es un valor sostenible por defecto). Calculamos el déficit calórico diario y proyectamos las semanas y meses hasta tu meta. También funciona para ganar peso.`,
      ],
      interpret: [
        `Perder 0.25–0.75 kg por semana es sostenible para la mayoría; más rápido de ~1% del peso por semana arriesga músculo. El plazo es una estimación — el progreso real rara vez es perfectamente lineal, así que revísalo cada pocas semanas.`,
      ],
      faq: [
        {
          q: `¿Qué tamaño debe tener mi déficit?`,
          a: `Un déficit que produzca 0.25–0.75 kg de pérdida por semana sirve a la mayoría. Los déficits agresivos funcionan a corto plazo pero cuestan de mantener y arriesgan músculo.`,
        },
        {
          q: `¿Por qué 7.700 kcal por kg?`,
          a: `Es la aproximación habitual de la energía de un kilo de masa corporal. No es exacta para todos, pero es una cifra fiable para planificar.`,
        },
        {
          q: `¿Puedo usarla para ganar peso?`,
          a: `Sí — fija un objetivo más alto que tu peso actual y el resultado pasa a ser un superávit diario con el mismo cálculo de plazos.`,
        },
      ],
    },
  },

  protein: {
    en: {
      seoTitle: `Protein Calculator — Daily Protein Intake`,
      seoDescription: `Free protein calculator. Get your daily protein target in grams from your bodyweight and goal, with calories from protein and a per-meal breakdown.`,
      h1: `Protein Calculator`,
      tagline: `How much protein to eat per day for your bodyweight and goal.`,
      about: [
        `Protein builds and preserves muscle, keeps you full and has the highest thermic effect of any macro. This calculator sets a daily target from your bodyweight, scaled by whether you're cutting, maintaining or bulking.`,
      ],
      formula: `protein g/day = bodyweight × factor\ncut 2.2 · maintain 2.0 · bulk 1.8 g/kg`,
      how: [
        `Enter your bodyweight and goal. We multiply by 2.2 g/kg for a cut (to protect muscle in a deficit), 2.0 for maintenance and 1.8 for a bulk, then show the calories that come from protein and a per-meal target across four meals.`,
      ],
      interpret: [
        `Spreading protein across 3–5 meals of 0.3–0.5 g/kg each maximises muscle protein synthesis. Hitting your daily total is what matters most — the per-meal figure is a practical way to get there.`,
      ],
      faq: [
        {
          q: `Is more protein always better?`,
          a: `Up to a point. Beyond ~2.2 g/kg there's little extra muscle benefit for most people, though high protein can still help with fullness on a cut.`,
        },
        {
          q: `Why more protein when cutting?`,
          a: `In a calorie deficit, higher protein protects lean mass and curbs hunger, so 2.2 g/kg is recommended versus 1.8 in a surplus.`,
        },
        {
          q: `Does timing matter?`,
          a: `Total daily intake matters most. That said, splitting protein fairly evenly across meals modestly improves muscle protein synthesis.`,
        },
      ],
    },
    es: {
      seoTitle: `Calculadora de Proteína — Ingesta diaria de proteína`,
      seoDescription: `Calculadora de proteína gratis. Obtén tu objetivo diario de proteína en gramos según tu peso y meta, con las calorías de la proteína y el reparto por comida.`,
      h1: `Calculadora de Proteína`,
      tagline: `Cuánta proteína comer al día según tu peso y tu meta.`,
      about: [
        `La proteína construye y preserva el músculo, sacia y tiene el mayor efecto térmico de los macros. Esta calculadora fija un objetivo diario según tu peso, ajustado a si estás en definición, mantenimiento o volumen.`,
      ],
      formula: `proteína g/día = peso × factor\ndefinición 2.2 · mantenimiento 2.0 · volumen 1.8 g/kg`,
      how: [
        `Introduce tu peso y tu meta. Multiplicamos por 2.2 g/kg en definición (para proteger el músculo en déficit), 2.0 en mantenimiento y 1.8 en volumen, y mostramos las calorías que aporta la proteína y un objetivo por comida en cuatro comidas.`,
      ],
      interpret: [
        `Repartir la proteína en 3–5 comidas de 0.3–0.5 g/kg cada una maximiza la síntesis de proteína muscular. Lo que más importa es cumplir el total diario — la cifra por comida es una forma práctica de lograrlo.`,
      ],
      faq: [
        {
          q: `¿Más proteína siempre es mejor?`,
          a: `Hasta cierto punto. Por encima de ~2.2 g/kg hay poco beneficio muscular extra para la mayoría, aunque la proteína alta ayuda con la saciedad en definición.`,
        },
        {
          q: `¿Por qué más proteína en definición?`,
          a: `En déficit calórico, más proteína protege la masa magra y reduce el hambre, por eso se recomienda 2.2 g/kg frente a 1.8 en superávit.`,
        },
        {
          q: `¿Importa el momento?`,
          a: `Lo que más importa es el total diario. Dicho esto, repartir la proteína de forma pareja entre comidas mejora algo la síntesis muscular.`,
        },
      ],
    },
  },

  leanmass: {
    en: {
      seoTitle: `Lean Body Mass Calculator — LBM & Fat Mass`,
      seoDescription: `Free lean body mass calculator. Estimate your fat-free mass with the Boer formula and from your body-fat percentage, plus your total fat mass.`,
      h1: `Lean Body Mass Calculator`,
      tagline: `Estimate your fat-free mass and how much of you is muscle and organs.`,
      about: [
        `Lean body mass (LBM) is everything in your body that isn't fat — muscle, bone, organs and water. Knowing it helps set protein needs, dose certain medications and track whether you're losing fat or muscle.`,
      ],
      formula: `Boer (male):   0.407×kg + 0.267×cm − 19.2\nBoer (female): 0.252×kg + 0.473×cm − 48.3\nLBM = weight × (1 − bodyfat%)`,
      how: [
        `Enter your sex, weight, height and body-fat percentage. We compute LBM two ways — the Boer formula (from height and weight) and directly from your body-fat figure — and show your fat mass for comparison.`,
      ],
      interpret: [
        `If you know your body fat, the direct LBM figure is usually the most accurate; the Boer estimate is a useful cross-check when you don't. When dieting, the goal is to lose fat mass while keeping LBM steady.`,
      ],
      faq: [
        {
          q: `LBM vs fat-free mass — same thing?`,
          a: `Almost. Fat-free mass excludes all fat; LBM technically includes a small amount of essential fat. In practice the terms are used interchangeably.`,
        },
        {
          q: `Which estimate should I trust?`,
          a: `If you have a reliable body-fat measurement, the LBM-from-body-fat figure is best. Otherwise the Boer formula gives a solid height-and-weight estimate.`,
        },
        {
          q: `Why does LBM matter?`,
          a: `It drives protein needs, reflects training progress, and on a diet it tells you whether you're losing fat or muscle — the difference between a good and bad cut.`,
        },
      ],
    },
    es: {
      seoTitle: `Calculadora de Masa Magra — MLG y masa grasa`,
      seoDescription: `Calculadora de masa magra gratis. Estima tu masa libre de grasa con la fórmula de Boer y desde tu % de grasa, más tu masa grasa total.`,
      h1: `Calculadora de Masa Magra`,
      tagline: `Estima tu masa libre de grasa y cuánto de ti es músculo y órganos.`,
      about: [
        `La masa magra (MLG) es todo lo que no es grasa en tu cuerpo — músculo, hueso, órganos y agua. Conocerla ayuda a fijar las necesidades de proteína, dosificar ciertos fármacos y saber si pierdes grasa o músculo.`,
      ],
      formula: `Boer (hombre):  0.407×kg + 0.267×cm − 19.2\nBoer (mujer):  0.252×kg + 0.473×cm − 48.3\nMLG = peso × (1 − %grasa)`,
      how: [
        `Introduce tu sexo, peso, altura y porcentaje de grasa. Calculamos la MLG de dos formas — la fórmula de Boer (desde altura y peso) y directamente desde tu % de grasa — y mostramos tu masa grasa para comparar.`,
      ],
      interpret: [
        `Si conoces tu % de grasa, la MLG directa suele ser la más precisa; la estimación de Boer es un buen contraste cuando no lo conoces. Al hacer dieta, la meta es perder masa grasa manteniendo estable la MLG.`,
      ],
      faq: [
        {
          q: `¿MLG y masa libre de grasa son lo mismo?`,
          a: `Casi. La masa libre de grasa excluye toda la grasa; la MLG incluye técnicamente algo de grasa esencial. En la práctica se usan indistintamente.`,
        },
        {
          q: `¿Qué estimación es más fiable?`,
          a: `Si tienes una medición fiable de grasa, la MLG desde el % de grasa es la mejor. Si no, la fórmula de Boer da una buena estimación desde altura y peso.`,
        },
        {
          q: `¿Por qué importa la MLG?`,
          a: `Determina las necesidades de proteína, refleja el progreso del entrenamiento y, en dieta, indica si pierdes grasa o músculo — la diferencia entre una buena y una mala definición.`,
        },
      ],
    },
  },

  heartrate: {
    en: {
      seoTitle: `Heart Rate Zone Calculator — Max HR & Training Zones`,
      seoDescription: `Free heart-rate zone calculator. Get your max heart rate (Tanaka) and five Karvonen training zones in beats per minute from your age and resting heart rate.`,
      h1: `Heart Rate Zone Calculator`,
      tagline: `Your max heart rate and five training zones in beats per minute.`,
      about: [
        `Training by heart-rate zone keeps each workout at the right intensity — easy days easy and hard days hard. This calculator finds your maximum heart rate and five personalised zones using your resting heart rate.`,
      ],
      formula: `max HR = 208 − 0.7 × age   (Tanaka)\nzone bpm = resting + %×(max − resting)   (Karvonen)`,
      how: [
        `Enter your age and resting heart rate (measure it first thing in the morning). We estimate max HR with the Tanaka formula, then apply the Karvonen heart-rate-reserve method to map five zones from recovery (50–60%) to maximal (90–100%).`,
      ],
      interpret: [
        `Most endurance training should sit in Z2 (aerobic base); Z4–Z5 are reserved for intervals. The Karvonen method personalises zones using your resting heart rate, so they're more accurate than a flat percentage of max HR.`,
      ],
      faq: [
        {
          q: `Why use Tanaka over 220 − age?`,
          a: `The classic 220 − age formula is less accurate across ages. Tanaka (208 − 0.7×age) better fits the data, especially for older athletes.`,
        },
        {
          q: `What's the Karvonen method?`,
          a: `It bases zones on heart-rate reserve (max minus resting) rather than max alone, personalising them to your fitness level.`,
        },
        {
          q: `Which zone should I train in?`,
          a: `Build most volume in Z2 for an aerobic base, with limited time in Z4–Z5 for intervals. The exact mix depends on your goal.`,
        },
      ],
    },
    es: {
      seoTitle: `Calculadora de Zonas de Frecuencia Cardíaca — FC máxima y zonas`,
      seoDescription: `Calculadora de zonas de frecuencia cardíaca gratis. Obtén tu FC máxima (Tanaka) y cinco zonas de entrenamiento (Karvonen) en pulsaciones según tu edad y FC en reposo.`,
      h1: `Calculadora de Zonas de Frecuencia Cardíaca`,
      tagline: `Tu frecuencia cardíaca máxima y cinco zonas de entrenamiento en pulsaciones.`,
      about: [
        `Entrenar por zonas de frecuencia cardíaca mantiene cada sesión en la intensidad correcta — los días suaves suaves y los duros duros. Esta calculadora encuentra tu frecuencia máxima y cinco zonas personalizadas con tu FC en reposo.`,
      ],
      formula: `FC máxima = 208 − 0.7 × edad   (Tanaka)\nzona ppm = reposo + %×(máx − reposo)   (Karvonen)`,
      how: [
        `Introduce tu edad y tu frecuencia cardíaca en reposo (mídela nada más despertar). Estimamos la FC máxima con la fórmula de Tanaka y aplicamos el método de Karvonen (reserva cardíaca) para mapear cinco zonas, de recuperación (50–60%) a máxima (90–100%).`,
      ],
      interpret: [
        `La mayoría del entrenamiento de resistencia debe estar en Z2 (base aeróbica); Z4–Z5 se reservan para intervalos. El método de Karvonen personaliza las zonas con tu FC en reposo, así que son más precisas que un porcentaje plano de la FC máxima.`,
      ],
      faq: [
        {
          q: `¿Por qué Tanaka y no 220 − edad?`,
          a: `La fórmula clásica 220 − edad es menos precisa según la edad. Tanaka (208 − 0.7×edad) se ajusta mejor a los datos, sobre todo en atletas mayores.`,
        },
        {
          q: `¿Qué es el método de Karvonen?`,
          a: `Basa las zonas en la reserva cardíaca (máxima menos reposo) en lugar de solo la máxima, personalizándolas a tu nivel de forma.`,
        },
        {
          q: `¿En qué zona debo entrenar?`,
          a: `Acumula la mayor parte del volumen en Z2 para una base aeróbica, con tiempo limitado en Z4–Z5 para intervalos. La mezcla exacta depende de tu objetivo.`,
        },
      ],
    },
  },

  whtr: {
    en: {
      seoTitle: `Waist-to-Height Ratio Calculator — WHtR`,
      seoDescription: `Free waist-to-height ratio calculator. Divide your waist by your height for a simple, accurate screen of central fat and health risk — better than BMI.`,
      h1: `Waist-to-Height Ratio Calculator`,
      tagline: `A simple central-fat screen — keep your waist under half your height.`,
      about: [
        `Waist-to-height ratio (WHtR) is a quick screen for central (abdominal) fat, which carries more health risk than fat elsewhere. It's often a better predictor of cardiometabolic risk than BMI and works across heights and sexes.`,
      ],
      formula: `WHtR = waist (cm) / height (cm)`,
      how: [
        `Measure your waist at the navel, relaxed, and enter it with your height in the same units. The ratio falls into bands: below 0.4 low, 0.4–0.5 healthy, 0.5–0.6 increased risk, and 0.6 or above high risk.`,
      ],
      interpret: [
        `The simple rule is 'keep your waist to less than half your height' — a ratio under 0.5. Rising WHtR signals accumulating abdominal fat even if your weight looks stable, making it a useful trend to track.`,
      ],
      faq: [
        {
          q: `Is WHtR better than BMI?`,
          a: `For health risk, often yes — it captures dangerous central fat that BMI misses, and the 0.5 threshold works across heights and both sexes.`,
        },
        {
          q: `Where do I measure my waist?`,
          a: `At the navel, standing relaxed after a normal exhale, with the tape level and snug but not compressing the skin.`,
        },
        {
          q: `What's a healthy ratio?`,
          a: `Below 0.5 is considered healthy for most adults. Climbing toward 0.6 and above signals rising central-fat risk.`,
        },
      ],
    },
    es: {
      seoTitle: `Calculadora de Ratio Cintura-Altura — WHtR`,
      seoDescription: `Calculadora de ratio cintura-altura gratis. Divide tu cintura entre tu altura para un cribado simple y preciso de grasa central y riesgo — mejor que el IMC.`,
      h1: `Calculadora de Ratio Cintura-Altura`,
      tagline: `Un cribado simple de grasa central — mantén tu cintura por debajo de media altura.`,
      about: [
        `El ratio cintura-altura (WHtR) es un cribado rápido de grasa central (abdominal), que conlleva más riesgo que la grasa de otras zonas. Suele predecir mejor el riesgo cardiometabólico que el IMC y funciona en distintas alturas y sexos.`,
      ],
      formula: `WHtR = cintura (cm) / altura (cm)`,
      how: [
        `Mide tu cintura a la altura del ombligo, relajado, e introdúcela con tu altura en las mismas unidades. El ratio cae en bandas: por debajo de 0.4 bajo, 0.4–0.5 saludable, 0.5–0.6 riesgo aumentado y 0.6 o más riesgo alto.`,
      ],
      interpret: [
        `La regla simple es 'mantén tu cintura por debajo de la mitad de tu altura' — un ratio menor de 0.5. Un WHtR que sube señala grasa abdominal en aumento aunque tu peso parezca estable, así que es una tendencia útil de seguir.`,
      ],
      faq: [
        {
          q: `¿Es el WHtR mejor que el IMC?`,
          a: `Para el riesgo de salud, a menudo sí — capta la grasa central peligrosa que el IMC ignora, y el umbral de 0.5 funciona en distintas alturas y ambos sexos.`,
        },
        {
          q: `¿Dónde mido la cintura?`,
          a: `A la altura del ombligo, de pie y relajado tras una espiración normal, con la cinta nivelada y ajustada pero sin comprimir la piel.`,
        },
        {
          q: `¿Qué ratio es saludable?`,
          a: `Por debajo de 0.5 se considera saludable para la mayoría de adultos. Acercarse a 0.6 y más señala un riesgo creciente por grasa central.`,
        },
      ],
    },
  },

  wilks: {
    en: {
      seoTitle: `Wilks / DOTS Calculator — Powerlifting Strength Score`,
      seoDescription: `Free DOTS calculator (the modern Wilks replacement). Score your powerlifting total relative to bodyweight to compare strength fairly across weight classes.`,
      h1: `Wilks / DOTS Calculator`,
      tagline: `Score your total relative to bodyweight — compare strength across weight classes.`,
      about: [
        `How do you compare a 90 kg lifter's total to a 60 kg lifter's? Coefficient scores do it by weighting your total against bodyweight. This calculator uses DOTS, the modern formula that has replaced Wilks in most federations.`,
      ],
      formula: `score = total × 500 / (A·bw⁴ + B·bw³ + C·bw² + D·bw + E)`,
      how: [
        `Enter your sex, bodyweight and competition total (squat + bench + deadlift, all in kg). We plug them into the DOTS polynomial to produce a single comparable strength score — higher is stronger, pound-for-pound.`,
      ],
      interpret: [
        `As a rough guide, DOTS around 300 is a solid intermediate, 400 is advanced, and 500+ is elite/competitive. Because it normalises for bodyweight, you can track it as you gain or lose weight to see true strength change.`,
      ],
      faq: [
        {
          q: `DOTS vs Wilks — what changed?`,
          a: `DOTS is a newer coefficient fitted to modern data. It's now the standard in many federations because it treats today's weight classes more fairly than the original Wilks.`,
        },
        {
          q: `Does it need a competition total?`,
          a: `Use squat + bench + deadlift in kilograms. You can enter gym maxes too, but the score is most meaningful with a true, full-effort total.`,
        },
        {
          q: `What's a good DOTS score?`,
          a: `Roughly: 300 intermediate, 400 advanced, 500+ elite. Women's and men's coefficients differ so scores are comparable across sexes.`,
        },
      ],
    },
    es: {
      seoTitle: `Calculadora Wilks / DOTS — Puntuación de fuerza en powerlifting`,
      seoDescription: `Calculadora DOTS gratis (el reemplazo moderno de Wilks). Puntúa tu total de powerlifting según tu peso para comparar la fuerza de forma justa entre categorías.`,
      h1: `Calculadora Wilks / DOTS`,
      tagline: `Puntúa tu total según tu peso — compara la fuerza entre categorías.`,
      about: [
        `¿Cómo comparas el total de un atleta de 90 kg con el de uno de 60 kg? Las puntuaciones por coeficiente lo hacen ponderando tu total frente al peso. Esta calculadora usa DOTS, la fórmula moderna que ha reemplazado a Wilks en la mayoría de federaciones.`,
      ],
      formula: `puntuación = total × 500 / (A·pc⁴ + B·pc³ + C·pc² + D·pc + E)`,
      how: [
        `Introduce tu sexo, peso corporal y total de competición (sentadilla + press banca + peso muerto, todo en kg). Lo introducimos en el polinomio DOTS para producir una única puntuación de fuerza comparable — más alta es más fuerte, kilo por kilo.`,
      ],
      interpret: [
        `Como guía: un DOTS de ~300 es un intermedio sólido, 400 es avanzado y 500+ es élite/competitivo. Como normaliza por peso corporal, puedes seguirlo al ganar o perder peso para ver el cambio real de fuerza.`,
      ],
      faq: [
        {
          q: `DOTS vs Wilks — ¿qué cambió?`,
          a: `DOTS es un coeficiente más nuevo ajustado a datos modernos. Hoy es el estándar en muchas federaciones porque trata las categorías actuales de forma más justa que el Wilks original.`,
        },
        {
          q: `¿Necesita un total de competición?`,
          a: `Usa sentadilla + press banca + peso muerto en kilos. Puedes introducir máximos de gimnasio, pero la puntuación es más significativa con un total real a máximo esfuerzo.`,
        },
        {
          q: `¿Qué puntuación DOTS es buena?`,
          a: `Aproximadamente: 300 intermedio, 400 avanzado, 500+ élite. Los coeficientes de hombres y mujeres difieren para que las puntuaciones sean comparables entre sexos.`,
        },
      ],
    },
  },

  calsburned: {
    en: {
      seoTitle: `Calories Burned Calculator — By Activity & Duration`,
      seoDescription: `Free calories burned calculator. Estimate the calories you burn from any activity using MET values, your bodyweight and how long you exercise.`,
      h1: `Calories Burned Calculator`,
      tagline: `How many calories an activity burns for your weight and duration.`,
      about: [
        `Different activities burn energy at different rates. This calculator uses MET values — a standard measure of exercise intensity — together with your bodyweight and time to estimate the calories you burn in a session.`,
      ],
      formula: `kcal = MET × 3.5 × weight(kg) / 200 × minutes`,
      how: [
        `Pick an activity, enter your bodyweight and how many minutes you did it. Each activity has a MET (metabolic equivalent) rating — walking is ~3.5, running ~9.8 — and the formula scales that by your weight and duration.`,
      ],
      interpret: [
        `Treat the result as a ballpark — real burn varies with intensity, fitness and efficiency. It's most useful for comparing activities and for rough planning, not as a precise figure to 'eat back' calorie-for-calorie.`,
      ],
      faq: [
        {
          q: `What is a MET?`,
          a: `A metabolic equivalent — the ratio of an activity's energy cost to resting. 1 MET is rest; a 8-MET activity burns eight times as much energy per minute.`,
        },
        {
          q: `How accurate is the estimate?`,
          a: `It's an approximation. MET tables are averages, so your actual burn depends on intensity, terrain, technique and fitness. Use it as a guide, not gospel.`,
        },
        {
          q: `Should I eat back these calories?`,
          a: `Be conservative — estimates often run high. If you're tracking for fat loss, eating back only part of the figure is usually wiser.`,
        },
      ],
    },
    es: {
      seoTitle: `Calculadora de Calorías Quemadas — Por actividad y duración`,
      seoDescription: `Calculadora de calorías quemadas gratis. Estima las calorías que quemas en cualquier actividad usando valores MET, tu peso corporal y el tiempo de ejercicio.`,
      h1: `Calculadora de Calorías Quemadas`,
      tagline: `Cuántas calorías quema una actividad según tu peso y duración.`,
      about: [
        `Cada actividad quema energía a un ritmo distinto. Esta calculadora usa valores MET — una medida estándar de intensidad del ejercicio — junto con tu peso y tiempo para estimar las calorías que quemas en una sesión.`,
      ],
      formula: `kcal = MET × 3.5 × peso(kg) / 200 × minutos`,
      how: [
        `Elige una actividad, introduce tu peso y cuántos minutos la hiciste. Cada actividad tiene un valor MET (equivalente metabólico) — caminar es ~3.5, correr ~9.8 — y la fórmula lo escala según tu peso y duración.`,
      ],
      interpret: [
        `Toma el resultado como una aproximación — el gasto real varía con la intensidad, la forma física y la eficiencia. Es más útil para comparar actividades y planificar a grandes rasgos que como cifra precisa para 'recuperar' caloría por caloría.`,
      ],
      faq: [
        {
          q: `¿Qué es un MET?`,
          a: `Un equivalente metabólico — la relación entre el coste energético de una actividad y el reposo. 1 MET es reposo; una actividad de 8 MET quema ocho veces más energía por minuto.`,
        },
        {
          q: `¿Qué precisión tiene la estimación?`,
          a: `Es una aproximación. Las tablas MET son promedios, así que tu gasto real depende de la intensidad, el terreno, la técnica y la forma física. Úsala como guía, no como dogma.`,
        },
        {
          q: `¿Debo recuperar estas calorías?`,
          a: `Sé conservador — las estimaciones suelen quedar altas. Si controlas la pérdida de grasa, recuperar solo parte de la cifra suele ser más prudente.`,
        },
      ],
    },
  },
};
