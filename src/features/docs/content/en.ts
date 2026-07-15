import type { DocSection } from '../types';

/**
 * English knowledge base — ported from the metri.info docs (content/docs/en).
 * `es.ts` mirrors these ids/order. Add more sections by appending here (and to
 * `es.ts`); the docs list + search pick them up automatically.
 */
export const en: DocSection[] = [
  {
    id: 'welcome',
    category: 'getting-started',
    title: 'What is Metri?',
    tags: ['intro', 'getting started', 'overview'],
    body: `Metri is an open-source fitness companion built for people who actually train.
It bundles the tools serious lifters reach for — evidence-based calculators and
a no-nonsense knowledge base — into one fast, private, ad-free package.

## What you get

- **Calculators** that run instantly in your browser: 1RM, TDEE, macros, body
  fat, FFMI, hydration and more. The same formulas power the mobile app.
- **A knowledge base** like this one: short, practical guides with no fluff.

> **Tip:** Everything here is free and open source. The mobile app works fully offline — your data never leaves your device.

## Who it's for

Whether you train for strength, hypertrophy, or general health, Metri gives you the numbers without the guesswork — and explains what they mean.

## How to use the docs

Start with the calculator guides if you want to understand a specific number, or
read the training and nutrition sections to build a mental model. Each article
links to the relevant tool so you can go from "what" to "how" in one click.

> **Note:** This is educational content, not medical advice. For anything health-related, talk to a qualified professional.`,
  },
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
Epley:   1RM = weight × (1 + reps ÷ 30)
Brzycki: 1RM = weight × 36 ÷ (37 − reps)   # best under ~10 reps
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
FFMI          = fat-free mass ÷ height(m)²
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
  {
    id: 'macros',
    category: 'nutrition',
    title: 'How to track macros',
    tags: ['macros', 'protein', 'carbs', 'fat', 'nutrition'],
    body: `Macros — protein, carbohydrate and fat — are where your daily calories come
from. Get the split right and body composition follows; obsess over food choice
while ignoring totals and you'll spin your wheels.

## Start with calories

Your macro plan sits on top of a calorie target. Use the
[TDEE calculator](/tools/tdee-calculator) to estimate maintenance, then adjust:

- **Cut:** ~10–20% below maintenance
- **Maintain:** at maintenance
- **Lean bulk:** ~10% above maintenance

## Set protein first

Protein is the priority macro — it preserves muscle in a deficit and builds it
in a surplus.

| Goal     | Protein               |
| -------- | --------------------- |
| Cut      | 2.2 g / kg bodyweight |
| Maintain | 2.0 g / kg            |
| Bulk     | 1.8 g / kg            |

## Then fat, then carbs

Set fat to roughly **25% of total calories** to support hormones, then fill the
rest with carbs — your main training fuel.

\`\`\`
protein_kcal = protein_g × 4
fat_kcal     = calories × 0.25
carb_kcal    = calories − protein_kcal − fat_kcal
carbs_g      = carb_kcal / 4
\`\`\`

> **Tip:** The [macro calculator](/tools/macro-calculator) does all of this for you — enter your calories, weight and goal and it returns grams per macro.

## Consistency beats precision

You don't need to hit grams exactly. Land within ~5–10 g of protein and keep
calories in range most days, and you'll progress. Track for a few weeks to build
intuition, not forever.`,
  },
  {
    id: 'tdee',
    category: 'nutrition',
    title: 'BMR & TDEE explained',
    tags: ['tdee', 'bmr', 'calories', 'metabolism', 'harris-benedict'],
    body: `Your **BMR** (basal metabolic rate) is the energy your body burns at complete
rest. Your **TDEE** (total daily energy expenditure) is BMR plus everything else
you do — moving, digesting, training. TDEE is your maintenance calories.

## Estimating BMR

Metri supports three established formulas:

- **Harris–Benedict** — the classic default.
- **Mifflin–St Jeor** — often more accurate for modern populations.
- **Katch–McArdle** — uses lean body mass, best if you know your body fat %.

For example, Mifflin–St Jeor:

\`\`\`
BMR = 10 × kg + 6.25 × cm − 5 × age + s
  s = +5 (male) or −161 (female)
\`\`\`

## From BMR to TDEE

Multiply BMR by an activity factor:

| Activity    | Multiplier |
| ----------- | ---------- |
| Sedentary   | 1.2        |
| Light       | 1.375      |
| Moderate    | 1.55       |
| Active      | 1.725      |
| Very active | 1.9        |

> **Note:** These are estimates. Treat the result as a starting point, then adjust based on 3–4 weeks of real weight data.

## Using the number

- Eat at TDEE to maintain.
- Subtract ~300–500 kcal to lose fat.
- Add ~200–300 kcal to gain lean mass.

Then feed your target into the [macro calculator](/tools/macro-calculator) to
split it into protein, carbs and fat.

> **Tip:** Run your own numbers in the [TDEE calculator](/tools/tdee-calculator).`,
  },
  {
    id: 'hydration',
    category: 'nutrition',
    title: 'Hydration & steps',
    tags: ['water', 'hydration', 'steps', 'health'],
    body: `- **Water:** 2–5 L per day. Apart from the first morning pee, urine should be
  light/clear.
- **Tip:** a glass on waking and one before each meal.
- **Daily steps:** aim for **7,500–10,000**. Reaching 7,500+ is linked to ~32%
  lower all-cause mortality.

> **Tip:** Get a personalized water target from the [water-intake calculator](/tools/water-intake-calculator).`,
  },
  {
    id: 'personalizing-your-diet',
    category: 'nutrition',
    title: 'Personalizing your diet',
    tags: ['calories', 'goals', 'cut', 'bulk', 'adjust'],
    body: `Base diets sit around **2,100 kcal**. The two levers that matter: **total
calories** and **total protein**.

## Adjust by goal

- **Lose fat (>65 kg):** keep the plan, train as written, walk 8–10k steps.
- **Lose fat (<65 kg):** drop each food amount ~**10%**.
- **Gain muscle:** keep the plan; if you don't gain weight in 2 weeks, add
  ~**10%**.

> **Note:** **Golden rule:** if you're progressing, change nothing. No progress after 2 weeks → adjust 5–10%.`,
  },
  {
    id: 'progressive-overload',
    category: 'training',
    title: 'Progressive overload',
    tags: ['progressive overload', 'hypertrophy', 'strength', 'programming'],
    body: `Muscle and strength only grow when you ask the body to do more than it's used to.
That's **progressive overload**: a gradual, sustained increase in training
demand over time. Everything else is detail.

## Ways to add load

You don't only progress by adding weight. In rough priority:

1. **Add reps** at the same weight.
2. **Add weight** once you hit the top of your rep range.
3. **Add sets** (more weekly volume).
4. **Improve technique / range of motion.**
5. **Reduce rest** or increase proximity to failure.

> **Tip:** Pick *one* lever per block. Trying to add weight, reps and sets at once is how you stall and get sore for no reason.

## Double progression

A simple, durable scheme for hypertrophy:

- Choose a rep range, e.g. **8–12**.
- Keep the weight until you hit **12 reps on all sets**.
- Then add the smallest increment and drop back toward 8.

## Track to progress

You can't overload what you don't measure. Log weight × reps each session — even
a beating last week's numbers by one rep is progress. Use the
[1RM calculator](/tools/1rm-calculator) to compare hard sets across different
rep ranges.

## When to back off

Progress isn't linear. When performance stalls for 2–3 sessions, take a lighter
**deload** week — see the [recovery guide](/docs/sleep) — then resume. Fatigue
masks fitness; a deload reveals it.`,
  },
  {
    id: 'training-intensity',
    category: 'training',
    title: 'Intensity & proximity to failure',
    tags: ['intensity', 'rir', 'failure', 'tension'],
    body: `Leaving 3–5 reps in reserve is mostly wasted work. Beginners think they're
closer to failure than they are.

- Push every set — give it a reason to count.
- **Mechanical tension** is the #1 driver of muscle growth: train heavy with
  good form.
- Track **RIR** (reps in reserve): RIR 2 means you could do ~2 more.

> **Tip:** New terms? The [glossary](/docs/glossary) defines RIR, failure and mechanical tension.`,
  },
  {
    id: 'volume-frequency',
    category: 'training',
    title: 'Volume & frequency',
    tags: ['volume', 'frequency', 'sets', 'hypertrophy'],
    body: `- **Volume:** **10–20 hard sets per muscle per week** is the productive range.
- More isn't better — *better* is better. Add weight or reps over time.
- **Frequency:** **2× per week** per muscle is a great default. At equal weekly
  volume, 1×/2×/3× give similar results — split the volume when it's too much
  for one day.

> **Tip:** Combine this with [progressive overload](/docs/progressive-overload) to keep the volume productive.`,
  },
  {
    id: 'lifting-technique',
    category: 'training',
    title: 'Technique: ROM, TUT & tempo',
    tags: ['technique', 'rom', 'tut', 'tempo', 'form'],
    body: `- **ROM (range of motion):** full range = more muscle worked. Never trade range
  for more weight.
- **TUT (time under tension):** ~**20–40 s per set** is ideal for hypertrophy.
- **Tempo:** control the **eccentric** (~3 s lowering); lift the **concentric**
  as fast as you can with control.
- Good technique prevents injury *and* drives progress.

> **Tip:** Unsure on a term? The [glossary](/docs/glossary) covers ROM, TUT and eccentric.`,
  },
  {
    id: 'sleep',
    category: 'recovery',
    title: 'Sleep, deloads & recovery',
    tags: ['recovery', 'sleep', 'deload', 'fatigue'],
    body: `You don't grow in the gym — you grow recovering from it. If recovery lags behind
training, fatigue accumulates, performance drops, and progress stalls no matter
how hard you push.

## Sleep first

Sleep is the highest-leverage recovery tool, full stop. Aim for **7–9 hours**.
Under-sleeping reduces strength, impairs muscle protein synthesis and raises
perceived effort.

> **Tip:** Consistent sleep/wake times matter more than any supplement. Anchor your wake time and the rest tends to follow.

## Manage fatigue with deloads

A **deload** is a planned light week that lets accumulated fatigue dissipate so
your real fitness shows. Signs you need one:

- Performance drops 2–3 sessions in a row.
- Joints ache, motivation tanks, sleep worsens.
- You're grinding reps that used to feel easy.

A simple deload: keep the same exercises, cut **volume by ~40–50%** (fewer sets)
and stay a couple of reps further from failure for one week.

## The recovery basics

| Lever     | Target                                                     |
| --------- | ---------------------------------------------------------- |
| Sleep     | 7–9 h, consistent                                          |
| Protein   | see the [macros guide](/docs/macros)                       |
| Hydration | use the [water calculator](/tools/water-intake-calculator) |
| Deload    | every 4–8 weeks, or as needed                              |

> **Note:** Recovery capacity is individual and shifts with age, stress and nutrition. Adjust to your own response rather than a fixed rule.`,
  },
  {
    id: 'supplements',
    category: 'supplements',
    title: 'Evidence-based supplements',
    tags: ['supplements', 'creatine', 'whey', 'caffeine'],
    body: `Supplements are optional — not essential. The ones backed by evidence:

| Supplement              | Dose       | When                                          |
| ----------------------- | ---------- | --------------------------------------------- |
| **Creatine monohydrate**| 5 g/day    | Any time, daily                               |
| **Whey protein**        | 20–30 g    | To hit your protein target                    |
| **Caffeine**            | 100–200 mg | Pre-workout (3–4×/week to avoid tolerance)    |
| **Multivitamin**        | per label  | With breakfast                                |
| **Melatonin**           | 5 mg       | Before sleep                                  |

> **Note:** Food first. Supplements fill gaps — they don't replace calories, protein or sleep.`,
  },
  {
    id: 'measuring-progress',
    category: 'progress',
    title: 'Measuring progress',
    tags: ['progress', 'measures', 'photos', 'tracking', 'body fat'],
    body: `The scale alone says little. Track the full picture, **weekly and fasted**:

- **Weight** (same scale, same time), plus tape: chest, waist (below navel),
  hips, both arms, both legs.
- **Photos** every 7 days — front, side, back; same light and time.
- **Body fat (visual reference):** ~10–12% = defined; ~15% = athletic; ~20% =
  average; 25%+ = clearly overweight. For exact numbers, see a professional.

> **Tip:** Put a number on it with the [body-fat calculator](/tools/body-fat-calculator).`,
  },
  {
    id: 'glossary',
    category: 'glossary',
    title: 'Glossary',
    tags: ['glossary', 'terms', 'rir', 'rom', 'tut'],
    body: `| Term                    | Meaning                                        |
| ----------------------- | ---------------------------------------------- |
| **RIR**                 | Reps in reserve — reps left before failure     |
| **Failure**             | No more reps possible with good form           |
| **ROM**                 | Range of motion                                |
| **TUT**                 | Time under tension (~20–40 s/set)              |
| **Volume**              | Total weekly sets per muscle (10–20)           |
| **Frequency**           | Times you train a muscle per week (2× optimal) |
| **Mechanical tension**  | The main driver of muscle growth               |
| **Eccentric**           | The lowering phase (~3 s)                      |`,
  },
];
