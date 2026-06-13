import type { DocSection } from '../types';

/**
 * English knowledge base — curated from the PowerBuilding 2.0 program.
 * `es.ts` mirrors these ids/order. Add more sections by appending here (and to
 * `es.ts`); the docs list + search pick them up automatically.
 */
export const en: DocSection[] = [
  {
    id: 'calc-bmr',
    category: 'calculators',
    title: 'BMR & TDEE calculator',
    tags: ['bmr', 'tdee', 'calories', 'harris-benedict', 'mifflin', 'katch-mcardle', 'metabolism'],
    body: `Your **BMR** (Basal Metabolic Rate) is the energy your body burns at complete rest. Your **TDEE** (Total Daily Energy Expenditure) is BMR multiplied by an activity factor — the calories you actually burn in a day, and the starting point for any diet.

**TDEE = BMR × activity multiplier** (1.2 sedentary → 1.9 very active).

### Three formulas — which to pick?

- **Mifflin–St Jeor (1990)** — derived from a modern population; today's most accurate estimate for the general public. *Use this if you're unsure.*
- **Harris–Benedict** — the classic equation first published by J. A. Harris & F. Benedict in **1919**, revised by Roza & Shizgal in **1984**. Still widely used; tends to slightly overestimate for people with higher body fat. Great for cross-checking.
- **Katch–McArdle** — uses your **lean body mass** (needs your body-fat %), so it accounts for muscle. The best choice if you're lean/muscular and know your body fat.

> All three estimate the same thing. If two formulas disagree by a few hundred kcal, that's normal — pick one, track your weight for 2 weeks, and adjust from reality.`,
  },
  {
    id: 'calc-macros',
    category: 'calculators',
    title: 'Macros calculator',
    tags: ['macros', 'protein', 'carbs', 'fat', 'calories', 'goal'],
    body: `Turns your **TDEE** and a goal (cut / maintain / bulk) into daily **protein, carb and fat** targets.

- It adjusts calories for your goal — a deficit to lose fat, a surplus to gain.
- **Protein** is set per kg of body weight (the priority macro for keeping muscle).
- The remaining calories are split between **carbs** and **fat**.

> Hit your **calories** and **protein** first — the carb/fat split is personal preference. The *Macronutrients* doc explains what each macro does.`,
  },
  {
    id: 'calc-body-fat',
    category: 'calculators',
    title: 'Body-fat calculator',
    tags: ['body fat', 'navy', 'circumference', 'composition'],
    body: `Estimates your **body-fat percentage** with the **U.S. Navy circumference method** — a tape-measure formula the Navy adopted in the 1980s.

You measure:
- **Neck** and **waist** (both sexes)
- **Hip** as well (women)

It's not as exact as a DEXA scan, but it's free, repeatable and great for tracking a trend. **Measure the same way each time** — same spots, relaxed, in the morning.`,
  },
  {
    id: 'calc-ideal-weight',
    category: 'calculators',
    title: 'Healthy weight & BMI',
    tags: ['bmi', 'ideal weight', 'healthy range', 'who'],
    body: `Shows your **BMI** (Body Mass Index = kg ÷ height²) and the **healthy weight range** for your height.

The range applies the WHO healthy-BMI band (**18.5–24.9**) to your height. Bands: under 18.5 underweight · 18.5–24.9 normal · 25–29.9 overweight · 30+ obese.

> BMI ignores muscle, so very muscular people can read as "overweight" while being lean. Use it as a rough guide, not a verdict — pair it with the body-fat calculator.`,
  },
  {
    id: 'calc-one-rep-max',
    category: 'calculators',
    title: '1RM calculator',
    tags: ['1rm', 'one rep max', 'strength', 'epley', 'brzycki'],
    body: `Estimates your **one-rep max** (1RM) — the most you could lift once — from a weight you lifted for several reps. Handy for setting working weights without testing a true max.

Two formulas:
- **Epley:** 1RM = weight × (1 + reps ÷ 30)
- **Brzycki:** 1RM = weight × 36 ÷ (37 − reps), best for under ~10 reps

> Accuracy drops above ~10 reps — use a set of **3–6 reps** for the best estimate.`,
  },
  {
    id: 'calc-water',
    category: 'calculators',
    title: 'Hydration calculator',
    tags: ['water', 'hydration', 'liters'],
    body: `Estimates your **daily water target** from your body weight (~**35 ml per kg**) plus an allowance for your activity level.

> A practical check: apart from the first morning pee, your urine should be light/clear. Drink a glass on waking and one before each meal.`,
  },
  {
    id: 'calc-ffmi',
    category: 'calculators',
    title: 'FFMI calculator',
    tags: ['ffmi', 'fat-free mass', 'muscle', 'lean mass'],
    body: `**FFMI** (Fat-Free Mass Index) measures how much **lean mass** you carry for your height — a far better "how muscular am I?" number than BMI, because it removes fat from the equation.

- **Fat-free mass** = weight × (1 − body-fat % ÷ 100)
- **FFMI** = fat-free mass ÷ height(m)²
- **Normalized FFMI** adjusts the result to a 1.8 m reference so heights compare fairly.

### Reading the scale (men)
- **16–18** below average · **18–20** average · **20–22** above average
- **22–23** excellent · **23–26** superior
- **26+** suspicious / unlikely without drugs — the natural ceiling sits around **25**.

> You need an accurate **body-fat %** for this to mean anything — estimate it with the body-fat calculator first. Women's ranges run a few points lower.`,
  },
  {
    id: 'macros',
    category: 'nutrition',
    title: 'Macronutrients',
    tags: ['nutrition', 'macros', 'protein', 'carbs', 'fat', 'calories'],
    body: `Three macros fuel everything:

- **Carbohydrates** — your main energy source. **4 kcal/g**. Sources: rice, oats, potato, fruit, vegetables.
- **Protein** — builds and repairs tissue (muscle, hair, nails). **4 kcal/g**. Sources: meat, fish, eggs, dairy, legumes, tofu.
- **Fat** — energy and hormone transport. **9 kcal/g**. Sources: olive oil, nuts, avocado, oily fish.

> What matters most is your **total daily calories** and **total protein** — the rest is detail.`,
  },
  {
    id: 'hydration',
    category: 'nutrition',
    title: 'Hydration & steps',
    tags: ['water', 'hydration', 'steps', 'health'],
    body: `- **Water:** 2–5 L per day. Apart from the first morning pee, urine should be light/clear.
- **Tip:** a glass on waking and one before each meal.
- **Daily steps:** aim for **7,500–10,000**. Reaching 7,500+ is linked to ~32% lower all-cause mortality.`,
  },
  {
    id: 'personalize',
    category: 'nutrition',
    title: 'Personalizing your diet',
    tags: ['calories', 'goals', 'cut', 'bulk', 'adjust'],
    body: `Base diets sit around **2,100 kcal**. The two levers that matter: **total calories** and **total protein**.

**Adjust by goal:**
- **Lose fat (>65 kg):** keep the plan, train as written, walk 8–10k steps.
- **Lose fat (<65 kg):** drop each food amount ~**10%**.
- **Gain muscle:** keep the plan; if you don't gain weight in 2 weeks, add ~**10%**.

> **Golden rule:** if you're progressing, change nothing. No progress after 2 weeks → adjust 5–10%.`,
  },
  {
    id: 'intensity',
    category: 'training',
    title: 'Intensity & proximity to failure',
    tags: ['intensity', 'rir', 'failure', 'tension'],
    body: `Leaving 3–5 reps in reserve is mostly wasted work. Beginners think they're closer to failure than they are.

- Push every set — give it a reason to count.
- **Mechanical tension** is the #1 driver of muscle growth: train heavy with good form.
- Track **RIR** (reps in reserve): RIR 2 means you could do ~2 more.`,
  },
  {
    id: 'volume-frequency',
    category: 'training',
    title: 'Volume & frequency',
    tags: ['volume', 'frequency', 'sets', 'hypertrophy'],
    body: `- **Volume:** **10–20 hard sets per muscle per week** is the productive range.
- More isn't better — *better* is better. Add weight or reps over time.
- **Frequency:** **2× per week** per muscle is a great default. At equal weekly volume, 1×/2×/3× give similar results — split the volume when it's too much for one day.`,
  },
  {
    id: 'technique',
    category: 'training',
    title: 'Technique: ROM, TUT & tempo',
    tags: ['technique', 'rom', 'tut', 'tempo', 'form'],
    body: `- **ROM (range of motion):** full range = more muscle worked. Never trade range for more weight.
- **TUT (time under tension):** ~**20–40 s per set** is ideal for hypertrophy.
- **Tempo:** control the **eccentric** (~3 s lowering); lift the **concentric** as fast as you can with control.
- Good technique prevents injury *and* drives progress.`,
  },
  {
    id: 'supplements',
    category: 'supplements',
    title: 'Evidence-based supplements',
    tags: ['supplements', 'creatine', 'whey', 'caffeine'],
    body: `Optional — not essential. The ones backed by evidence:

| Supplement | Dose | When |
|---|---|---|
| **Creatine monohydrate** | 5 g/day | Any time, daily |
| **Whey protein** | 20–30 g | To hit your protein target |
| **Caffeine** | 100–200 mg | Pre-workout (3–4×/week to avoid tolerance) |
| **Multivitamin** | per label | With breakfast |
| **Melatonin** | 5 mg | Before sleep |`,
  },
  {
    id: 'measures',
    category: 'progress',
    title: 'Measuring progress',
    tags: ['progress', 'measures', 'photos', 'tracking', 'body fat'],
    body: `The scale alone says little. Track the full picture, **weekly and fasted**:

- **Weight** (same scale, same time), plus tape: chest, waist (below navel), hips, both arms, both legs.
- **Photos** every 7 days — front, side, back; same light and time.
- **Body fat (visual reference):** ~10–12% = defined; ~15% = athletic; ~20% = average; 25%+ = clearly overweight. For exact numbers, see a professional.`,
  },
  {
    id: 'glossary',
    category: 'glossary',
    title: 'Glossary',
    tags: ['glossary', 'terms', 'rir', 'rom', 'tut'],
    body: `| Term | Meaning |
|---|---|
| **RIR** | Reps in reserve — reps left before failure |
| **Failure** | No more reps possible with good form |
| **ROM** | Range of motion |
| **TUT** | Time under tension (~20–40 s/set) |
| **Volume** | Total weekly sets per muscle (10–20) |
| **Frequency** | Times you train a muscle per week (2× optimal) |
| **Mechanical tension** | The main driver of muscle growth |
| **Eccentric** | The lowering phase (~3 s) |`,
  },
];
