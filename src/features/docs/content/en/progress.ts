import type { DocSection } from '../../types';

export const progress: DocSection[] = [
  {
    id: 'measuring-progress',
    category: 'progress',
    title: 'Measuring progress',
    tags: ['progress', 'measures', 'photos', 'tracking', 'body fat', 'tape'],
    body: `The scale alone says little. Weight moves with water, glycogen, salt and the
last meal; muscle and fat change slowly underneath. To see what is really
shifting you combine three signals, **once a week, fasted**: weight, tape
measurements and photos.

## The weekly protocol

- **Same day, same conditions.** Pick one weekday and measure on waking,
  fasted, before eating or drinking, after the bathroom.
- **Weight:** same scale, same spot on the floor. Better still, weigh in every
  morning and log the weekly average — see [weight tracking](/docs/weight-tracking).
- **Tape:** always at the same spot, and always the **largest** reading. If your
  waist is wider slightly below the navel, that is your reference from now on.
- **Photos:** front, side and back — same light, same distance, same pose.

## Where to place the tape

| Site  | Landmark                                  |
| ----- | ----------------------------------------- |
| Chest | At the nipple line, arms relaxed at sides |
| Waist | Just below the navel                      |
| Arm   | Just below the armpit, arm relaxed        |
| Thigh | Just below the glute fold                 |

Measure both arms and both thighs; hips are optional but useful in a cut. Keep
the tape snug, not tight, and parallel to the floor.

## A 12-week log

One row per week. The values below are an example of a cut going well.

| Week | Weight  | Waist   | Chest    | Arm   | Thigh   |
| ---- | ------- | ------- | -------- | ----- | ------- |
| 1    | 80.0 kg | 88 cm   | 102 cm   | 36 cm | 60 cm   |
| 2    | 79.6 kg | 87 cm   | 102 cm   | 36 cm | 60 cm   |
| 3    | 79.2 kg | 86 cm   | 102 cm   | 36 cm | 59.5 cm |
| 4    | 78.8 kg | 85.5 cm | 101.5 cm | 36 cm | 59.5 cm |
| …    | …       | …       | …        | …     | …       |

## Body fat as a visual reference

| Approx. body fat | What you see               |
| ---------------- | -------------------------- |
| ~10–12%          | Defined, visible abs       |
| ~15%             | Athletic, soft definition  |
| ~20%             | Average, little definition |
| 25%+             | Clearly overweight         |

For an exact number see a professional; for an estimate, use the
[body-fat calculator](/tools/body-fat-calculator).

## Photos that can actually be compared

- Three angles: **front, side, back**.
- Same room, same light source, same distance from the camera, same time of day.
- Same clothing and the same relaxed pose every time.
- Compare against four weeks ago, not against yesterday.

## Where this lives in metri

The **Progress** tab holds your weigh-ins, your photo timeline and the
consistency calendar, so weight, pictures and adherence sit side by side.
Log tape readings wherever you keep notes, on the same weekly rhythm.

> **Tip:** One number rarely means anything on its own. Read weight and tape together — see [reading your numbers](/docs/reading-your-numbers).

## Related

- [Weight tracking](/docs/weight-tracking)
- [Reading your numbers](/docs/reading-your-numbers)
- [Body fat guide](/docs/body-fat-guide)
- [App guide](/docs/app-guide)`,
  },
  {
    id: 'weight-tracking',
    category: 'progress',
    title: 'Weight tracking',
    tags: ['weight', 'scale', 'tracking', 'cut', 'bulk', 'rate of loss'],
    body: `Daily weight is noisy; the trend is not. This method turns the scale into a
planning tool: you decide the weight you want to reach each week, and you use
daily fasted weigh-ins to steer toward it.

## The target-weight calendar

1. Pick a **fixed weekday** — Monday, Saturday, it does not matter.
2. Write one row per week for the whole phase (12 or 16 rows, for example):
   the date and the weight you intend to see that morning.
3. When cutting, subtract **400–500 g per row**. When bulking, spread the
   monthly gain over four rows.

| Date        | Target  |
| ----------- | ------- |
| Mon, week 1 | 80.0 kg |
| Mon, week 2 | 79.6 kg |
| Mon, week 3 | 79.2 kg |
| Mon, week 4 | 78.8 kg |
| …           | …       |

The example starts at 80 kg; the method is identical at 60 or at 100.

## Weigh-in rules

- **Every morning, fasted**, after the bathroom, before eating or drinking.
  One weigh-in a week gives you one chance to correct; seven give you seven.
- **Eat roughly the same every day.** A repeated breakfast and two or three
  rotating options for the other meals keep water and glycogen stable, so the
  scale reflects fat and not yesterday's menu.
- Judge the **weekly average and the monthly trend**, never a single reading.
  A 100 g miss is noise.
- Being 200–300 g ahead of target is a fine cushion. Being ahead every single
  week means you are losing too fast.
- If one week drops sharply (say 1 kg), hold that weight the following week —
  eat slightly more — so the monthly average lands where it should.

## How fast to lose

| Bodyweight | Weekly loss |
| ---------- | ----------- |
| 60–65 kg   | 300–350 g   |
| > 70 kg    | 400 g       |
| > 100 kg   | 500 g       |

Roughly **400 g/week (about 1.6 kg/month)** fits most people.

## Why not faster

Losing 1 kg/week instead of 0.5 kg/week brings more hunger over time, a slower
metabolism, worse sleep and worse sessions. In men, four weeks at 1 kg/week has
been linked to **around 30% lower testosterone**. Faster does not mean more
fat lost either: the extra is mostly glycogen, water and some muscle.

## Adjusting intake

Keep **fats and protein fixed** and use **carbohydrates as the dial**. At
2,000–2,500 kcal that looks like ~60–70 g fat, ~140 g protein (depends on your
weight) and the rest as carbs — around 300 g, about 1,200 kcal.

- Above target for two weeks: trim carbs a little, or add steps or a bit of
  cardio.
- Already at next week's target mid-week: change nothing and coast to the
  weekday.
- Already at 10,000–12,000 steps and 1.5–2 h of easy cardio a week? Do not
  push those further; adjust food or train harder. See
  [cardio and NEAT](/docs/cardio-and-neat).

## Bulking and recomposition

- Gain **0.5–1% of bodyweight per month** (about 150–300 g/week). At 75 kg
  that is 350–700 g/month; faster than that is mostly fat.
- Very lean beginners can sit at the top of that range.
- At **maintenance** with a reasonable body-fat level, **recomposition**
  happens: same weight, more muscle, less fat over months. If you perform,
  sleep well and are not hungry, there is no need to raise calories.

> **Tip:** Log every fasted weigh-in in metri's Progress tab; the weekly average does the interpreting for you.

## Related

- [Measuring progress](/docs/measuring-progress)
- [Reading your numbers](/docs/reading-your-numbers)
- [Choosing your phase](/docs/choosing-your-phase)
- [TDEE](/docs/tdee)`,
  },
  {
    id: 'reading-your-numbers',
    category: 'progress',
    title: 'Reading your numbers',
    tags: ['progress', 'weight', 'measures', 'recomposition', 'muscle loss', 'interpretation'],
    body: `Weight, tape and mirror rarely agree in the same week, and that is fine: each
answers a different question. Read them together and you know whether to keep
going or to adjust.

## The four situations

| Scale     | Tape | What is happening                   |
| --------- | ---- | ----------------------------------- |
| Up        | Down | Recomposition — muscle up, fat down |
| Down      | Flat | Probably losing muscle              |
| Flat      | Up   | Overeating; fat gain                |
| Down fast | Flat | Water and glycogen, or muscle loss  |

## 1. Weight up, measurements down

Common in the first one or two months for someone new to lifting, or who just
started training properly. Waist and hips shrink while the scale climbs: a few
kilos of fat left, and more than that came in as muscle and glycogen.

**What to do:** nothing. Keep the plan. Expect it to fade after the second
month, when total weight should start moving down in a cut.

## 2. Weight down, measurements flat

The scale drops, but waist, arms and legs stay put and the mirror looks the
same. The loss is coming from muscle, not fat.

**What to do:** check the basics — protein at [target](/docs/macros), sleep,
effort in the gym. Slow the deficit (see [weight tracking](/docs/weight-tracking))
and give it two weeks.

## 3. Weight flat, measurements up

Typical in someone trying to gain who overshoots: the waist grows while weight
does not. The surplus is going to fat, and chronic overeating worsens insulin
sensitivity — muscle stops absorbing nutrients well, which also caps muscle
gain.

**What to do:** bring calories back to maintenance, review
[diet quality](/docs/diet-quality), keep steps up. Re-check the body-fat
ceiling for bulking in [choosing your phase](/docs/choosing-your-phase).

## 4. Big weight drop, no visual change

Two very different causes:

- **You just cut carbs.** A low-carb or ketogenic start empties muscle
  glycogen and the water bound to it: 1–2 kg vanish in a week with nothing to
  show in the mirror. Expected, not a problem.
- **Normal diet, drops for weeks or months, same look.** Muscle is going. This
  usually ends in a rebound, because the tissue that kept your expenditure up
  is gone too.

**What to do:** in the first case, wait. In the second, treat it as situation 2.

## The case that worries people most

"I weigh the same or slightly more and it bothers me, but my clothes fit better
and the tape is down." That is muscle gained and fat lost. Of the three signals
the scale is the least informative; trust the tape and the photos.

> **Tip:** A single week never decides. Compare 4-week averages of weight and tape before changing anything.

## Related

- [Measuring progress](/docs/measuring-progress)
- [Weight tracking](/docs/weight-tracking)
- [Breaking a plateau](/docs/breaking-a-plateau)
- [Body fat guide](/docs/body-fat-guide)`,
  },
];
