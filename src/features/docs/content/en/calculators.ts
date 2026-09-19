import type { DocSection } from '../../types';

export const calculators: DocSection[] = [
  {
    id: 'bmr-tdee-guide',
    category: 'calculators',
    title: 'BMR & TDEE calculator guide',
    tags: ['bmr', 'tdee', 'calories', 'harris-benedict', 'mifflin', 'katch-mcardle', 'metabolism'],
    body: `Your **BMR** (basal metabolic rate) is the energy your body burns at complete
rest. Your **TDEE** (total daily energy expenditure) is BMR multiplied by an
activity factor — the calories you actually burn in a day, and the starting
point for any diet.

**TDEE = BMR × activity multiplier** (1.2 sedentary → 1.9 very active).

## Three formulas — which to pick?

- **Mifflin–St Jeor (1990)** — derived from a modern population; today's most
  accurate estimate for the general public. *Use this if you're unsure.*
- **Harris–Benedict** — the classic equation first published by J. A. Harris &
  F. Benedict in **1919**, revised by Roza & Shizgal in **1984**. Still widely
  used; tends to slightly overestimate for people with higher body fat. Great
  for cross-checking.
- **Katch–McArdle** — uses your **lean body mass** (needs your body-fat %), so
  it accounts for muscle. The best choice if you're lean/muscular and know your
  body fat.

> **Note:** All three estimate the same thing. If two formulas disagree by a few hundred kcal, that's normal — pick one, track your weight for 2 weeks, and adjust from reality.

## Try it

Run your own numbers in the [TDEE calculator](/tools/tdee-calculator), then feed
the result into the [macro calculator](/tools/macro-calculator) to split it into
protein, carbs and fat.`,
  },
  {
    id: 'macros-calculator-guide',
    category: 'calculators',
    title: 'Macros calculator guide',
    tags: ['macros', 'protein', 'carbs', 'fat', 'calories', 'goal'],
    body: `The macros calculator turns your **TDEE** and a goal (cut / maintain / bulk)
into daily **protein, carb and fat** targets.

## How it works

- It adjusts calories for your goal — a deficit to lose fat, a surplus to gain.
- **Protein** is set per kg of body weight (the priority macro for keeping
  muscle).
- The remaining calories are split between **carbs** and **fat**.

> **Tip:** Hit your **calories** and **protein** first — the carb/fat split is personal preference. The [macronutrients guide](/docs/macros) explains what each macro does.

## Try it

Open the [macro calculator](/tools/macro-calculator) and enter your calories,
weight and goal — it returns grams per macro instantly.`,
  },
  {
    id: 'body-fat-guide',
    category: 'calculators',
    title: 'Body-fat calculator guide',
    tags: ['body fat', 'navy', 'circumference', 'composition'],
    body: `The body-fat calculator estimates your **body-fat percentage** with the
**U.S. Navy circumference method** — a tape-measure formula the Navy adopted in
the 1980s.

## What you measure

- **Neck** and **waist** (both sexes)
- **Hip** as well (women)

It's not as exact as a DEXA scan, but it's free, repeatable and great for
tracking a trend. **Measure the same way each time** — same spots, relaxed, in
the morning.

> **Tip:** Estimate yours in the [body-fat calculator](/tools/body-fat-calculator). Pair it with the [FFMI guide](/docs/ffmi-guide) to see how muscular you really are.`,
  },
  {
    id: 'bmi-healthy-weight',
    category: 'calculators',
    title: 'Healthy weight & BMI guide',
    tags: ['bmi', 'ideal weight', 'healthy range', 'who'],
    body: `The healthy-weight calculator shows your **BMI** (Body Mass Index = kg ÷ height²)
and the **healthy weight range** for your height.

## Reading the bands

The range applies the WHO healthy-BMI band (**18.5–24.9**) to your height.

| BMI         | Band        |
| ----------- | ----------- |
| Under 18.5  | Underweight |
| 18.5–24.9   | Normal      |
| 25–29.9     | Overweight  |
| 30+         | Obese       |

> **Note:** BMI ignores muscle, so very muscular people can read as "overweight" while being lean. Use it as a rough guide, not a verdict — pair it with the [body-fat calculator](/tools/body-fat-calculator).

## Try it

Check your range in the
[ideal-weight calculator](/tools/ideal-weight-calculator).`,
  },
  {
    id: 'one-rep-max-guide',
    category: 'calculators',
    title: '1RM calculator guide',
    tags: ['1rm', 'one rep max', 'strength', 'epley', 'brzycki'],
    body: `The 1RM calculator estimates your **one-rep max** (1RM) — the most you could
lift once — from a weight you lifted for several reps. Handy for setting working
weights without testing a true max.

## Two formulas

\`\`\`
Epley: 1RM = weight × (1 + reps ÷ 30)
Brzycki: 1RM = weight × 36 ÷ (37 − reps)
\`\`\`

> **Tip:** Accuracy drops above ~10 reps — use a set of **3–6 reps** for the best estimate.

## Try it

Estimate your max in the [1RM calculator](/tools/1rm-calculator).`,
  },
  {
    id: 'hydration-calculator-guide',
    category: 'calculators',
    title: 'Hydration calculator guide',
    tags: ['water', 'hydration', 'liters'],
    body: `The hydration calculator estimates your **daily water target** from your body
weight (~**35 ml per kg**) plus an allowance for your activity level.

> **Tip:** A practical check: apart from the first morning pee, your urine should be light/clear. Drink a glass on waking and one before each meal.

## Try it

Get your target in the
[water-intake calculator](/tools/water-intake-calculator), and read the
[hydration & steps guide](/docs/hydration) for the habits around it.`,
  },
  {
    id: 'ffmi-guide',
    category: 'calculators',
    title: 'FFMI calculator guide',
    tags: ['ffmi', 'fat-free mass', 'muscle', 'lean mass'],
    body: `**FFMI** (Fat-Free Mass Index) measures how much **lean mass** you carry for
your height — a far better "how muscular am I?" number than BMI, because it
removes fat from the equation.

## The math

\`\`\`
fat-free mass = weight × (1 − body-fat % ÷ 100)
FFMI = fat-free mass ÷ height(m)²
\`\`\`

**Normalized FFMI** adjusts the result to a 1.8 m reference so heights compare
fairly.

## Reading the scale (men)

| FFMI  | Meaning                          |
| ----- | -------------------------------- |
| 16–18 | Below average                    |
| 18–20 | Average                          |
| 20–22 | Above average                    |
| 22–23 | Excellent                        |
| 23–26 | Superior                         |
| 26+   | Suspicious / unlikely natural    |

The natural ceiling sits around **25**.

> **Note:** You need an accurate **body-fat %** for this to mean anything — estimate it with the [body-fat calculator](/tools/body-fat-calculator) first. Women's ranges run a few points lower.

## Try it

Run your numbers in the [FFMI calculator](/tools/ffmi-calculator).`,
  },
];
