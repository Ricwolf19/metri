import type { DocSection } from '../types';

/**
 * English knowledge base — curated from the PowerBuilding 2.0 program.
 * `es.ts` mirrors these ids/order. Add more sections by appending here (and to
 * `es.ts`); the docs list + search pick them up automatically.
 */
export const en: DocSection[] = [
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
