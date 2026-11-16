import type { DocSection } from '../../types';

export const nutrition: DocSection[] = [
  {
    id: 'macros',
    category: 'nutrition',
    title: 'How to track macros',
    tags: ['macros', 'protein', 'carbs', 'fat', 'nutrition', 'lean mass'],
    body: `Macros — protein, carbohydrate and fat — are where your daily calories come
from. Get the split right and body composition follows; obsess over food choice
while ignoring totals and you'll spin your wheels.

Every gram carries a fixed amount of energy — **4 kcal** for protein, **4** for
carbs, **9** for fat — so when you hit your macro grams you hit your calories
by definition.

## Start with calories

Your macro plan sits on top of a calorie target. Use the
[TDEE calculator](/tools/tdee-calculator) to estimate maintenance, then adjust:

- **Cut:** ~10–20% below maintenance
- **Maintain:** at maintenance
- **Lean bulk:** ~10% above maintenance

## Set protein first

Protein is the priority macro — it preserves muscle in a deficit and builds it
in a surplus. Size it one of two ways.

**Per kilogram of bodyweight** — simple, and accurate enough at a normal
body-fat level:

| Goal     | Protein               |
| -------- | --------------------- |
| Cut      | 2.2 g / kg bodyweight |
| Maintain | 2.0 g / kg            |
| Bulk     | 1.8 g / kg            |

**Per kilogram of lean mass** — better when you carry a lot of fat, because fat
tissue does not need protein to maintain itself. Use **1.8–2.5 g per kg of
lean mass**, with 2.2 as the default. Example: 100 kg at 20% body fat carries
20 kg of fat, so lean mass is 80 kg and 80 × 2.2 = **176 g** per day.

\`\`\`
lean_kg = weight_kg × (1 − body_fat)
protein_g = lean_kg × 2.2
\`\`\`

> **Tip:** 176 g of protein is not 176 g of chicken — meat and fish hold roughly 20–25 g per 100 g. The [protein calculator](/tools/protein-calculator) turns your numbers into a daily target.

## Then fat

Fat supports hormones and vitamin absorption. Set it in g/kg, not as a percentage:

| Fat       | When                                    |
| --------- | --------------------------------------- |
| 0.5 g/kg  | Floor — never lower, not even in a cut  |
| 0.8 g/kg  | Typical, cutting or bulking             |
| 1.2–1.5   | Hard-gainers who struggle to eat enough |
| 1.5–2     | Low-carb diets                          |
| 0.3 g/kg  | Contest prep only, briefly              |

With a lot of body fat, read the table per kg of **lean mass**, as you did for
protein: about **0.5–0.7 g** per kg of lean mass in a cut and **0.7–1 g** in a
bulk (the worked example below uses 0.7). Whichever basis you use, a result
between roughly 20% and 35% of calories is the usual healthy range; staying
well under 20% for long has been linked to lower testosterone in men.

## Then carbs fill the rest

Whatever calories remain after protein and fat become carbohydrate. Keep fat
toward the low end when cutting so more of the budget lands here — carbs are
what fuels hard sessions.

| Carbs (g / kg) | Profile                     |
| -------------- | --------------------------- |
| ≤ 2            | Keto / low-carb             |
| 2–3            | Low                         |
| 3–5            | Moderate — most lifters     |
| 5–8            | High — intense endurance    |
| 8–10           | Ultra-endurance events      |

## Worked example: 2,500 kcal

100 kg, 20% body fat (80 kg lean), cutting on 2,500 kcal, fat at 0.7 g per kg
of lean mass:

\`\`\`
protein = 80 × 2.2 = 176 g → 704 kcal
fat = 80 × 0.7 = 56 g → 504 kcal
carbs = (2500 − 704 − 504) ÷ 4 = 323 g
\`\`\`

> **Tip:** The [macro calculator](/tools/macro-calculator) does the arithmetic — enter your calories, weight and goal and it returns grams per macro.

> **Note:** Consistency beats precision. Land within ~5–10 g of protein and keep calories in range most days and you'll progress; track for a few weeks to build intuition, not forever.

## Related

- [BMR & TDEE explained](/docs/tdee) — where the calorie target comes from.
- [Personalizing your diet](/docs/personalizing-your-diet) — adjusting once the plan is running.
- [Tracking food](/docs/tracking-food) — logging so the grams actually mean something.`,
  },
  {
    id: 'tdee',
    category: 'nutrition',
    title: 'BMR & TDEE explained',
    tags: ['tdee', 'bmr', 'calories', 'metabolism', 'harris-benedict', 'maintenance'],
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

Three to five lifting sessions a week plus a couple of cardio days and
7,000–10,000 daily steps usually lands between "moderate" and "active". When in
doubt, start at moderate and let the scale correct you.

## Quick cross-check: bodyweight × 22

If you want a sanity check that needs no formula, multiply your weight in
kilograms by 22, then by the same activity factor. For 92 kg and moderate
activity:

\`\`\`
92 × 22 = 2,024 kcal
2,024 × 1.55 = 3,137 kcal
\`\`\`

When this lands close to your formula result you have a solid starting point.
When it doesn't, take the lower number — it is easier to add food later than to
undo two weeks of unintended gain.

## Correct for high body fat

Fat tissue burns far less energy than muscle, so every weight-based formula
overestimates at a high body-fat percentage. Calculate on a leaner reference
weight instead: someone at 100 kg and 30% body fat would run the numbers on
about **80 kg** — roughly what they would weigh near 10%. It does not need to be
exact. Katch–McArdle handles this implicitly because it starts from lean mass,
so if you know your body fat, prefer it.

## Using the number

- Eat at TDEE to maintain.
- Subtract ~10% (roughly 300–500 kcal) to lose fat.
- Add ~10% (roughly 200–300 kcal) to gain lean mass.

Then feed your target into the [macro calculator](/tools/macro-calculator) to
split it into protein, carbs and fat.

## Adjust after 1–2 weeks

The formula is a starting point; the weekly fasted average is the truth. Weigh
yourself fasted, average the week, and compare after one to two weeks:

| Weekly average shows…                | Action                 |
| ------------------------------------ | ---------------------- |
| Weight holds but you want to lose    | Cut calories by ~10%   |
| Weight rises and you did not want it | Cut by 15–20%          |
| Moving in the planned direction      | Change nothing         |

Take any reduction from carbs or fat, never from protein. Your maintenance
moves with your weight, so re-check it every ~5 kg lost or gained — the why is
in [adaptive thermogenesis](/docs/adaptive-thermogenesis).

> **Note:** These are estimates built from population averages. Treat the result as a hypothesis and let three to four weeks of real weight data confirm or correct it.

> **Tip:** Run your own numbers in the [TDEE calculator](/tools/tdee-calculator).

## Related

- [How to track macros](/docs/macros) — splitting the target into grams.
- [Choosing your phase](/docs/choosing-your-phase) — whether to cut, bulk or hold.
- [Breaking a plateau](/docs/breaking-a-plateau) — when the scale stops moving.
- [Adaptive thermogenesis](/docs/adaptive-thermogenesis) — why maintenance falls as you lose.`,
  },
  {
    id: 'hydration',
    category: 'nutrition',
    title: 'Hydration & steps',
    tags: ['water', 'hydration', 'steps', 'neat', 'health'],
    body: `Water and daily movement are the two habits that cost nothing, sit underneath
every other nutrition rule, and quietly go wrong first. Neither needs an app —
just a couple of checks you can run without thinking.

## Water

Aim for **2–5 L per day**, scaling with your size, the climate and how much you
sweat in training. Even mild dehydration lowers your energy for the day and
for the session, which means fewer calories burned and worse lifts. Thirst
arrives late, so use the checks below rather than waiting for it.

| Check                       | What it tells you                                |
| --------------------------- | ------------------------------------------------ |
| Urine after the first pee   | Should be light or clear the rest of the day     |
| Glass on waking             | Covers the overnight loss before breakfast       |
| Glass before each meal      | Spreads intake across the day and blunts hunger  |
| Long or hot training        | Add to the baseline — the upper range exists for this |

> **Tip:** Get a personalized water target from the [water-intake calculator](/tools/water-intake-calculator).

## Steps

Daily steps are the bulk of your non-exercise activity, and they are the
cheapest way to raise energy expenditure. Walking does not build fatigue the
way cardio does, so it is hard to overdo and easy to keep constant week to week.

| Goal                  | Daily steps                          |
| --------------------- | ------------------------------------ |
| Bulk                  | 7,000–8,000                          |
| Cut or recomposition  | 8,000–10,000                         |
| Stalled cut           | Raise gradually, up to ~13,000       |

In large studies, the risk of dying early keeps falling as daily steps rise,
then levels off — at around 8,000–10,000 steps for adults under 60 and
6,000–8,000 above that. The health return arrives well before the fat-loss one.

## Related

- [Breaking a plateau](/docs/breaking-a-plateau) — steps are the first lever, not food.
- [BMR & TDEE explained](/docs/tdee) — activity is baked into your maintenance number.
- [Cardio, steps & NEAT](/docs/cardio-and-neat) — how much walking and cardio each phase needs.
- [Fat-loss myths](/docs/fat-loss-myths) — why under-hydration is one of the six real factors.`,
  },
  {
    id: 'personalizing-your-diet',
    category: 'nutrition',
    title: 'Personalizing your diet',
    tags: ['calories', 'goals', 'cut', 'bulk', 'adjust', 'hunger'],
    body: `A calculated diet is a hypothesis about your body, not a verdict. The two
levers that matter are **total calories** and **total protein**; everything
else — timing, food choice, supplements — is second-order. Personalizing means
running a small experiment, reading the result, and nudging.

## The adjustment loop

1. Start from your maintenance (the [TDEE calculator](/tools/tdee-calculator))
   and shift it ~10% in the direction of your goal.
2. Hold that intake for **2 weeks**. Weigh yourself fasted and use the weekly
   average — single days are noise.
3. Results? Change nothing. No results? Move another **5–10%** in the same
   direction, then wait another 2 weeks.

| Goal      | Starting shift | What 2 weeks should show     |
| --------- | -------------- | ---------------------------- |
| Cut       | −10%           | Average down ~0.3–0.5 kg/wk  |
| Maintain  | 0%             | Average flat                 |
| Lean bulk | +10%           | Average up ~0.25 kg/wk       |

Your body is not a Swiss watch. Round the numbers, keep the loop, and let two
weeks — never two days — decide.

## Scale the whole plan, not one food

If you eat from a fixed meal plan, apply the percentage to every quantity
instead of deleting a single item. That keeps protein, fiber and micronutrients
in the same proportion. Reference plans often sit at **2,100 kcal** for men and
**1,700 kcal** for women, which makes the arithmetic easy:

| Case                            | Target          | Change to the plan          |
| ------------------------------- | --------------- | --------------------------- |
| Man, maintenance 2,300, cutting | 2,300 − 10% ≈ 2,100 | Use the 2,100 plan as is |
| Man, maintenance 2,000, cutting | 2,000 − 10% = 1,800 | Cut all portions ~15%    |
| Woman, maintenance 1,700, cutting | 1,700 − 10% ≈ 1,500 | Cut all portions ~10%  |
| Man, bulking on 2,500           | 2,500           | Raise all portions ~20%     |

## The 1,800 kcal floor

Do not chase fat loss below roughly **1,800 kcal**. Below that it becomes hard
to cover protein, fiber and micronutrients, and you lack the fuel to train hard
enough to keep muscle. If a 1,800 kcal plan has stopped working, add an extra
training day, more steps or a cardio session — spend more instead of eating
less.

## Hunger is a signal, not a test of character

If you are hungry all the time, the approach is wrong. A sustainable deficit
leaves you performing in the gym, sleeping well and not thinking about food
constantly. Persistent hunger usually means the deficit is too steep, protein
is too low, or the plate has too little volume (vegetables, fruit, legumes).
Fix the setup rather than white-knuckle it — a deficit that steep costs more
muscle, sleep and training than it buys in fat.

> **Tip:** Bulking and nothing happens after 2 weeks? Add ~10% to every portion and hold again. Repeat until the weekly average creeps up slowly, then stay there.

## While there are results, change nothing

The single most common mistake is adjusting on top of something that is
working. A cut that drops 0.4 kg per week does not need to be faster; a bulk
that gains 250 g per week with a stable waist does not need more food. Touch
the plan only when two clean weeks show no movement.

## Related

- [Choosing your phase](/docs/choosing-your-phase) — which direction to shift in the first place.
- [Breaking a plateau](/docs/breaking-a-plateau) — the levers to pull before eating less.
- [How to track macros](/docs/macros) — turning the calorie target into grams.`,
  },
  {
    id: 'choosing-your-phase',
    category: 'nutrition',
    title: 'Cut, bulk or maintain?',
    tags: ['cut', 'bulk', 'maintenance', 'body fat', 'recomposition', 'phase'],
    body: `Whether you should be eating above, below or at maintenance is decided by your
body-fat percentage, not by the calendar or your mood. Body fat determines
whether a surplus turns into muscle or into more fat, and whether a deficit
costs you strength. Get the phase right and the diet almost writes itself.

## Men

| Body fat | Phase                                                      |
| -------- | ---------------------------------------------------------- |
| 6–12%    | Surplus — you have room to gain                            |
| 12–15%   | Optimal band: maintain, or a light deficit toward 12%      |
| 15–20%   | Deficit; you can still add muscle and strength while cutting |
| 20%+     | Deficit, no debate, until you are back in the band         |

The long-term rhythm is to bulk up to ~15%, cut back to ~12%, and repeat.
**Never bulk past 18–20%** — beyond that the surplus mostly goes to fat.

## Women

| Body fat | Phase                                            |
| -------- | ------------------------------------------------ |
| 10–12%   | Surplus until ~20%, then switch to maintenance   |
| 20–22%   | Maintain and recompose                           |
| ~25%     | Deficit, ~400 g per week                         |
| 30%+     | Deficit, up to 500 g per week                    |

**Never bulk past 28–30%.** A woman at ~20% who wants to get leaner cuts
slowly, ~300 g per week.

## How fast to gain

More food does not mean more muscle. The rate is capped by how much fat you
are willing to gain, and that cap drops as you get more experienced.

| Level        | Gain per month     | At 80 kg     |
| ------------ | ------------------ | ------------ |
| Beginner     | 1–1.5% bodyweight  | 0.8–1.2 kg   |
| Intermediate | 0.5–1%             | 0.4–0.8 kg   |
| Advanced     | 0.25–0.5%          | 0.2–0.4 kg   |

If the waist grows while the lifts do not, you are above your ceiling —
gain slower or switch to maintenance.

## How fast to lose

| Body fat            | Loss per month      | Weekly            |
| ------------------- | ------------------- | ----------------- |
| Above 25%           | 3–4% of bodyweight  | up to ~500 g      |
| 13–19%              | 1–2%                | ~300–400 g        |

The leaner you are, the slower you must lose — the risk of losing muscle rises
as fat drops. Around **400 g per week** works for most people. Faster loss
brings more hunger, worse sessions and sleep, and a hormonal cost; it also does
not guarantee more fat lost, since much of a fast drop is glycogen and water.

## Recomposition at maintenance

Inside the optimal band you do not need to pick a direction. Eating at
maintenance while training hard slowly swaps fat for muscle at the same
bodyweight: a man at 75 kg and 15% can sit at 75 kg and 13% six months later;
a woman can go from 22% to 19% the same way. If you are not hungry, recover
well, sleep well and the lifts keep moving, there is no reason to raise
calories.

> **Tip:** Estimate where you are with the [body-fat calculator](/tools/body-fat-calculator), then read your number in the [body-fat guide](/docs/body-fat-guide).

## Related

- [BMR & TDEE explained](/docs/tdee) — the maintenance number every phase starts from.
- [Personalizing your diet](/docs/personalizing-your-diet) — the ±10% loop once you know the direction.
- [Control your bodyweight](/docs/weight-tracking) — the target-weight calendar for the phase you picked.
- [Diet quality](/docs/diet-quality) — why a dirty bulk pushes you past the ceiling faster.`,
  },
  {
    id: 'breaking-a-plateau',
    category: 'nutrition',
    title: 'Breaking a plateau',
    tags: ['plateau', 'stall', 'neat', 'steps', 'cardio', 'fat loss', 'weighing', 'diet break'],
    body: `Stalls are normal. As you lose weight your body spends less, and the deficit
that worked in week one quietly closes — the why is in
[adaptive thermogenesis](/docs/adaptive-thermogenesis). The reflex is to eat less
again, but food is the last lever: every cut to intake also cuts the fuel you
need to train and the protein that protects muscle. Spend more first.

## Is it a real plateau?

Check these before you change anything:

| Check                 | A real plateau when…                                      |
| --------------------- | --------------------------------------------------------- |
| Weekly average weight | Flat for 2–3 weeks, from 3+ weigh-ins a week              |
| Waist (or hips)       | Flat over the same weeks                                  |
| The food log          | Oils, drinks, bites and weekends are all in it            |
| Water                 | No new program, creatine, salty week or period in the window |

A jump of 1–2 kg from one day to the next is water, not fat; the arithmetic is
in [reading your numbers](/docs/reading-your-numbers). Only when all four line
up is it time to pull a lever.

## The five levers, in order

| Lever                      | First move                                            |
| -------------------------- | ----------------------------------------------------- |
| 1. NEAT (daily steps)      | Count them, then add a little                         |
| 2. Cardio                  | Add a session, or start with 2 × 40 min a week        |
| 3. Progress in the weights | Keep adding load or reps; it is what keeps the muscle |
| 4. Sleep 7–9 h             | Regular hours, few long wake-ups                      |
| 5. Stress                  | Chronic stress erodes sleep, appetite and consistency |

**NEAT** is everything you move outside of training. Your phone already
counts steps; when you stall, you will know exactly where you are and can raise
the number a little. A typical progression: 7,000–8,000 steps and two cardio
sessions, then 10,000 steps after 3–4 weeks, then a third session, then
~13,000 steps.

**Cardio** should be the same amount every week. If your calories are
constant, your movement must be too — otherwise you are changing two variables
at once.

**Lifting** matters more than it looks: a body that keeps getting stronger
keeps its muscle in a deficit, and the muscle you keep is expenditure and
insulin sensitivity you keep. The calories a session burns are a bonus, not the
point.

**Sleep and stress** are metabolic, not just mood. Short sleep raises hunger,
lowers insulin sensitivity and, in a diet, shifts what you lose from fat toward
muscle. Chronic stress works through the same channels: worse sleep, more
appetite, a plan that slips.

Only when steps are already at 10,000–12,000 and you do 1.5–2 hours of easy
cardio per week do you trim intake — a little, 5–10% from carbs or fat — or
train harder.

## Or take a break

A long cut that has stalled with hunger high and sessions sliding may need
maintenance, not a deeper deficit: 1–2 weeks at maintenance, then resume. The
scale will rise a little from glycogen and water; it is not fat. Details in
[adaptive thermogenesis](/docs/adaptive-thermogenesis).

> **Tip:** Daily weighing gives you seven chances a week to read the trend; weekly weighing gives you one, and it may land on a water day.

## Related

- [Reading your numbers](/docs/reading-your-numbers) — water versus fat, and when a trend counts.
- [Adaptive thermogenesis](/docs/adaptive-thermogenesis) — why the deficit shrinks.
- [Hydration & steps](/docs/hydration) — the step targets by phase.
- [Sleep](/docs/sleep) — why lever four is not optional.
- [Cardio, steps & NEAT](/docs/cardio-and-neat) — levers one and two in detail.
- [Control your bodyweight](/docs/weight-tracking) — reading the weekly average before you touch anything.
- [Personalizing your diet](/docs/personalizing-your-diet) — when food finally is the lever.`,
  },
  {
    id: 'adaptive-thermogenesis',
    category: 'nutrition',
    title: 'Adaptive thermogenesis: why maintenance moves',
    tags: [
      'metabolic adaptation',
      'adaptive thermogenesis',
      'metabolism',
      'neat',
      'diet break',
      'plateau',
      'starvation mode',
    ],
    body: `A cut that lost half a kilo a week in the first month often loses half that by
the third, on the same food. Nothing broke. Your body got smaller, you started
moving a little less without noticing, and the deficit you began with quietly
shrank. That is **metabolic adaptation**, also called adaptive thermogenesis:
real, measurable, usually modest, and manageable.

## Where your daily burn goes

| Part of the day's burn         | Share            | In a long cut              |
| ------------------------------ | ---------------- | -------------------------- |
| Resting metabolism (BMR)       | ~60–70%          | Dips as you get smaller    |
| Digesting food                 | ~10%             | Dips with what you eat     |
| Training                       | ~5–10%           | Holds if you keep training |
| NEAT: steps, fidgeting, chores | Most of the rest | Drops most, unnoticed      |

## Why a cut slows

**1. A smaller body costs less.** This is expected, and it is the largest part.
With the bodyweight × 22 rule from the [TDEE guide](/docs/tdee), at moderate
activity:

\`\`\`
10 kg lost × 22 × 1.55 ≈ 340 kcal less per day
\`\`\`

A 500 kcal deficit set at the start is now closer to 160 kcal.

**2. You move less without deciding to.** Fewer steps, less fidgeting, more
sitting, flatter sessions. NEAT is the most variable part of expenditure and
the first to fall when food is low, which is why you count steps rather than
trust how active you feel.

**3. The body gets thriftier.** As fat falls, so do the hormones that report
it, leptin among them; thyroid output and the drive to move dip, muscle does
the same work for slightly less energy, and hunger rises. Studies of people who
lost a lot of weight find expenditure below what their new size predicts. In
resting metabolism the gap is usually small — tens to a couple of hundred kcal
a day — largest while you are in the deficit, and it shrinks once you eat at
maintenance again.

**4. The log drifts.** Not adaptation, but it looks the same: portions creep,
oils and drinks go unlogged, weekends grow. In one classic study of people who
said they could not lose weight on very little food, measured intake was close
to double what they had logged.

## What it is not

| Claim                                     | What actually happens                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| "Starvation mode stops fat loss"          | A real deficit always draws on stored energy; adaptation shrinks it, never reverses it |
| "Eat too little and you store fat"        | Fat is stored when intake beats expenditure, not because intake is low     |
| "Dieting breaks your metabolism for good" | Most of the drop is a smaller body; the extra part fades at maintenance    |
| "Eat more to lose more"                   | More food can buy better sessions and adherence, not a bigger deficit      |

In the classic semi-starvation experiments, volunteers on roughly half their
usual food kept losing weight for six months. What a hard diet does cost is
muscle, sleep and mood — the real reasons not to diet hard.

> **Note:** A scale that has not moved for a week or two can still be hiding fat loss behind water: a hard training block, stress or the menstrual cycle hold water for days. Judge three weeks of weekly averages, not one.

## What to do about it

- **Count steps and keep a floor.** The movement you lose without noticing is
  the movement a step count catches. Targets are in
  [hydration & steps](/docs/hydration).
- **Keep lifting heavy and keep protein high.** The muscle you keep is
  expenditure you keep — see [macros](/docs/macros).
- **Lose at a moderate pace.** Roughly 0.5–1% of bodyweight a week; steeper
  deficits bring more adaptation, more hunger and more muscle loss
  ([choosing your phase](/docs/choosing-your-phase)).
- **Re-check maintenance as you go.** Every ~5 kg lost, or after 2–3 flat
  weeks, adjust by 5–10% ([personalizing your diet](/docs/personalizing-your-diet)).
- **Protect sleep.** Short nights shift what you lose from fat toward muscle
  ([sleep](/docs/sleep)).
- **Pull the levers in order** before cutting food again
  ([breaking a plateau](/docs/breaking-a-plateau)).

## Diet breaks and maintenance phases

| Option            | How                                   | When                                                       |
| ----------------- | ------------------------------------- | ---------------------------------------------------------- |
| Diet break        | 1–2 weeks at maintenance, extra carbs | Every 6–12 weeks of a long cut, or when sleep, hunger and sessions slide |
| Maintenance phase | 4+ weeks at your new maintenance      | After a long cut, or between two cuts                      |
| Refeed            | 1–2 days of extra carbs               | Optional; a better session and a mental break              |

The evidence is promising but mixed. In one trial, alternating two weeks of
dieting with two weeks at maintenance lost more fat per week of dieting than
dieting straight through, at the cost of more calendar time. In trained lifters,
diet breaks have matched continuous dieting for fat and muscle while leaving
people less hungry. Treat a break as an adherence tool, not a metabolic reset.

Expect the scale to rise 0.5–1.5 kg in the first days of a break or at the end
of a cut: glycogen, the water it binds and more food in the gut. It is not fat,
and it settles within the week.

## Ending a cut

Move to your new maintenance in one or two steps, estimated from where your
weekly average actually held — not from your pre-diet number. Slow "reverse
diets" have little evidence of protecting metabolism; their real use is
finding the new maintenance without overshooting.

## The same thing on the way up

In a surplus, expenditure rises too: a bigger body costs more, and many people
move more without noticing. In one overfeeding study, the extra daily movement
ranged from almost nothing to nearly 700 kcal a day between people. A bulk's
surplus shrinks the same way — if the weekly average stalls for 2–3 weeks and
the waist holds, add ~10% ([personalizing your diet](/docs/personalizing-your-diet)).

> **Note:** A lost or irregular period, dizziness, feeling cold all the time or exhaustion during a diet are not a plateau to push through. Stop the cut, eat at maintenance and see a clinician.

## Related

- [Breaking a plateau](/docs/breaking-a-plateau) — the levers, in order.
- [BMR & TDEE explained](/docs/tdee) — where maintenance comes from.
- [Reading your numbers](/docs/reading-your-numbers) — water versus fat on the scale.
- [Cardio, steps & NEAT](/docs/cardio-and-neat) — keeping movement constant.`,
  },
  {
    id: 'tracking-food',
    category: 'nutrition',
    title: 'Tracking food',
    tags: ['logging', 'weighing', 'raw', 'cooked', 'labels', 'protein', 'tracking'],
    body: `Logging food is a measurement tool, not a lifestyle. Its job is to teach you
what a portion actually weighs and what it costs, so that when you stall you
know what you are eating and can move it. A few rules make the numbers mean
something.

## Raw versus cooked

Water has no calories but plenty of weight, so the same food logs very
differently depending on when you weigh it.

| Food                        | Raw / dry             | Cooked                      |
| --------------------------- | --------------------- | --------------------------- |
| Rice, pasta, dry grains     | ~350 kcal per 100 g   | 100 g dry → ~300 g cooked   |
| Cooked rice                 | —                     | ~130 kcal per 100 g         |
| Meat, fish                  | Log this weight       | Loses ~20% of its weight    |

Grains soak up water and get lighter per gram; meat releases water and gets
heavier per gram. **Weigh raw and log raw** — the one common exception is
legumes, which most plans weigh cooked. Whatever you choose, do it the same
way every time.

## Match by label, not by brand

Most foods in a food-logging app are listed per 100 g. If your exact brand is
missing, pick a comparable entry and adjust the quantity until the calories
match the label on the package — the macros will land close enough. Example:
frozen fries at 150 kcal per 100 g, 300 g eaten, so log whatever quantity of
"fries" gives 450 kcal.

Cereals are a good illustration: almost every box lands near the same
calories, and what varies is fiber or a little fat from nuts.

## What a label says

- Values are per 100 g, not per serving, unless stated.
- Sugar is already inside carbohydrate; saturated fat is already inside fat.
- Protein × 4 + carbs × 4 + fat × 9 should roughly equal the calories shown.
- Fewer ingredients is usually better.

## Protein per 100 g

Meat and fish are mostly water. Whatever the cut, count on roughly
**20–25 g of protein per 100 g**; the rest is water and some fat.

| Food                     | Protein            |
| ------------------------ | ------------------ |
| Chicken breast, 100 g    | ~22 g (70 g ≈ 100 kcal) |
| Lean pork loin, 300 g    | ~63 g, ~365 kcal   |
| One egg                  | ~6 g               |
| Oats, 100 g dry          | ~12–14 g           |
| Pasta, 100 g dry         | ~13 g              |
| Rice, 100 g dry          | ~8 g               |

Grain protein counts too — over a day it adds up to a meaningful share.

## Consistency beats precision

A caliper might say 12% body fat and a scan 15%; neither is "wrong" as long as
you keep using the same one, because the trend is what you act on. Food is the
same: an entry that is always 10% off is still perfectly usable.

> **Tip:** Log for a few months, not forever. After that you will estimate a plate by eye — in restaurants and on holiday — and the log becomes something you reopen only when progress stalls.

## Related

- [How to track macros](/docs/macros) — the targets the log is measured against.
- [Food swaps](/docs/food-swaps) — trading foods without re-weighing everything.
- [Personalizing your diet](/docs/personalizing-your-diet) — what to do with what the log shows.`,
  },
  {
    id: 'food-swaps',
    category: 'nutrition',
    title: 'Food swaps',
    tags: ['swaps', 'equivalences', 'meal plan', 'substitutions', 'variety'],
    body: `A plan you can vary is a plan you keep. Most foods come in families that share
the same macro profile, so you can trade inside a family at equal grams. Across
families the water content differs, and that is where a multiplier is needed.

## Multipliers between families

| Swap                                        | Multiply grams by       |
| ------------------------------------------- | ----------------------- |
| Grains (rice, pasta, oats, quinoa) → bread  | ×2 (50 g rice = 100 g bread) |
| Grains → potato or sweet potato             | ×4                      |
| Grains → legumes                            | ×3                      |
| Nuts → avocado                              | ×3                      |
| White fish → white fish, oily → oily        | ×1                      |

Going the other way, divide: 200 g of potato replaces 50 g of dry rice.

\`\`\`
bread_g = grain_g × 2
potato_g = grain_g × 4
legumes_g = grain_g × 3
avocado_g = nuts_g × 3
\`\`\`

The multipliers exist because grains are logged dry while potato, legumes and
avocado carry water; the calories per 100 g are lower, so you need more grams
for the same energy.

## Interchange groups (equal grams)

| Group             | Members                                                        |
| ----------------- | -------------------------------------------------------------- |
| Bread             | Toast, loaf bread, corn or flour tortillas, arepas             |
| Grains            | Basmati, jasmine or brown rice, whole-wheat pasta, quinoa, oats, whole-wheat bread |
| White meat        | Chicken breast, turkey breast, trimmed pork loin, rabbit       |
| Lean red meat     | Beef and other lean cuts, no visible fat or bone               |
| White fish        | Cod, hake, sole, sea bream, sea bass, monkfish, cuttlefish, shrimp |
| Oily fish         | Salmon, tuna, sardines, mackerel, trout, anchovies             |
| Fruit             | Apple, pear, orange, banana, kiwi, peach, berries, melon, grapes |
| Vegetables        | Leafy greens, broccoli, cauliflower, zucchini, peppers, tomato, onion, carrot, green beans |
| Nuts and seeds    | Almonds, walnuts, cashews, hazelnuts, pistachios, peanuts, pumpkin seeds |
| Low-fat dairy     | 0% cottage or fresh cheese, 0% Greek yogurt, 0% quark, high-protein 0% yogurt |
| Higher-fat dairy  | Greek yogurt, mozzarella, burrata, aged cheese, brie, whole milk |

Keep fish inside its own column: swapping oily for white changes the fat
count, not just the flavor. Red meat trades for red meat and white for white
for the same reason.

## Rules that keep a plan flexible

- Meal times do not matter — what you have eaten by the end of the day does.
- Meals of similar calories can be shuffled: a snack option at breakfast, a
  lunch option at dinner.
- If you cannot fit a meal, merge it with the previous or the next one.
- An extra piece of fruit or serving of vegetables is always allowed.
- Nuts raw or toasted, not fried.

> **Tip:** Vary preparation before varying ingredients: eggs boiled, poached or scrambled; potato baked, boiled or mashed; rice steamed or in a salad. Same macros, less boredom.

## Related

- [Tracking food](/docs/tracking-food) — why grains log dry and what a label says.
- [Diet quality](/docs/diet-quality) — choosing within a group.
- [How to track macros](/docs/macros) — the targets the swaps must respect.`,
  },
  {
    id: 'diet-quality',
    category: 'nutrition',
    title: 'Diet quality',
    tags: ['quality', 'fiber', 'processed', 'vegan', 'fasting', 'meal timing', 'dirty bulk'],
    body: `Calories decide whether your weight moves. Quality decides how you feel while
it moves — energy, satiety, recovery, digestion — and therefore whether the
plan survives past week three. You are not what you eat; you are what you
absorb.

## Nutrient density and processing

Prefer foods that carry more nutrients per calorie: 100 kcal of boiled potato
brings more than 100 kcal of white rice, even though both are fine carbs.
Ultra-processed foods are the opposite — dense in calories, light in nutrients,
and often less satiating, so they leave you hungrier after more calories. Cook
steamed, baked, grilled or stir-fried with little oil, and cook ahead for
several days.

| Prefer                                    | Limit                                 |
| ----------------------------------------- | ------------------------------------- |
| Whole grains, potatoes, fruit, legumes    | Refined flours, added sugar           |
| Lean meat, fish, eggs, legumes, tofu      | Fatty cuts, processed meat            |
| Nuts, seeds, avocado, olive oil, oily fish | Trans fats, excess saturated fat     |
| Vegetables at every meal                  | Snacks with a long ingredient list    |

## Fiber

Aim for **at least 25 g of fiber per day** from whole grains, fruit,
vegetables and legumes. In a deficit, fiber is also your satiety strategy —
volume for few calories. If digestion is sluggish, 15–20 g of ground flaxseed
a day helps.

## Reading a label

Values are per 100 g; sugar is part of the carbohydrate line and saturated fat
part of the fat line. The fewer ingredients, the better. The
[tracking guide](/docs/tracking-food) covers matching entries to labels.

## Vegan and vegetarian

Plant-based diets work for muscle gain with a little planning. Combine sources
across the day — rice and lentils, hummus and bread — so the amino-acid profile
completes; it does not have to happen in the same meal.

| Watch                | Why                                        |
| -------------------- | ------------------------------------------ |
| Vitamin B12          | Not available from plants — supplement     |
| Vitamin D            | Commonly low regardless of diet            |
| Iron and zinc        | Plant forms absorb less well               |
| Omega-3              | Algae-based EPA/DHA if you eat no fish     |

Good protein sources: legumes, soy (tofu, tempeh, edamame), quinoa, oats,
amaranth, nuts and seeds.

## Intermittent fasting

A 16:8 window (first meal at noon, last at 20:00) is the common protocol. The
claimed benefits — insulin sensitivity, fat burning, autophagy — come from the
caloric deficit itself, not from the clock. Fasting offers **no advantage
beyond the deficit** it helps some people keep. Eating inside a ~12 h daytime
window, away from bedtime, is a reasonable default; stay hydrated in the
fasting hours.

## Meal timing

- Put more of your calories earlier in the day; make the last meal the
  lightest and finish it 2–3 h before sleep.
- Concentrate carbohydrate around training. After a hard session muscle is
  first in line for it, and insulin sensitivity stays raised for hours — up to
  a day or two — so the window is wide, not a race against the clock
  ([insulin sensitivity](/docs/insulin-sensitivity)).
- If your big meal is late, train in the evening so the window lines up.

## Dirty bulk

A surplus built on fast food and desserts gains weight quickly, but it gains
fat quickly too. Past a modest surplus the extra calories add fat, not muscle,
and the extra fat — with the processed food that brought it — erodes
[insulin sensitivity](/docs/insulin-sensitivity). A dirty bulk also drags you
past the bulk ceilings (18–20% men, 28–30% women) and into a long cut. A
surplus should still be mostly whole food.

> **Tip:** If only your belly grows during a bulk, you are over on calories and over on body fat at the same time.

## Related

- [Food swaps](/docs/food-swaps) — variety without breaking the plan.
- [Choosing your phase](/docs/choosing-your-phase) — the body-fat ceilings.
- [Supplements](/docs/supplements) — what is worth adding, and what is not.
- [Insulin sensitivity](/docs/insulin-sensitivity) — why training, sleep and the waist matter for carbs.`,
  },
  {
    id: 'insulin-sensitivity',
    category: 'nutrition',
    title: 'Insulin sensitivity',
    tags: [
      'insulin',
      'insulin sensitivity',
      'insulin resistance',
      'blood sugar',
      'carbs',
      'metabolism',
    ],
    body: `Insulin is the hormone that announces a meal. Blood sugar rises, the pancreas
releases insulin, and muscle, liver and fat take up glucose and store it; while
insulin is high, fat breakdown slows. **Insulin sensitivity** is how strongly
your tissues answer that signal. Sensitive tissues clear a meal with little
insulin; resistant ones need more for the same job, and when the pancreas can
no longer keep up, blood sugar climbs — the road to type 2 diabetes.

Muscle handles most of the glucose cleared under insulin's action, which is why
the habits that raise sensitivity are the ones a lifter already practises.

> **Note:** General information, not medical advice. If you have diabetes, prediabetes or another medical condition, or take medication that lowers blood sugar, plan changes to diet and training with your clinician: both can lower blood sugar enough to need a dose change.

## What raises it

| Lever             | What it does                                                          |
| ----------------- | --------------------------------------------------------------------- |
| Training          | Working muscle pulls in glucose without needing insulin, and sensitivity stays higher for a day or two |
| More muscle       | More room to store carbohydrate as glycogen                           |
| Daily steps       | Keeps glucose uptake going between sessions                           |
| Losing excess fat | Fat around the waist and in the liver matters most                    |
| Sleep             | Enough of it; a single short night lowers sensitivity the next day    |
| Energy balance    | A deficit raises it; a long, large surplus lowers it                  |

Each lever has been tested on its own:

- **Steps.** Healthy young men who cut their daily steps to under 1,500 for
  two weeks lost insulin sensitivity and gained fat around the organs.
- **Fat loss and activity.** In people at high risk of type 2 diabetes, losing
  ~7% of bodyweight and walking ~150 minutes a week cut new cases by more than
  half over about three years.
- **Sleep.** One night of four hours was enough to make healthy adults
  measurably more insulin resistant the next morning.

The effect of a session fades within one to three days, so frequency beats
heroics: three or four sessions a week plus daily walking does more than one
brutal workout.

## Carbs and insulin: what it is not

- **"Carbs make you fat because they spike insulin."** A rise after a meal is
  normal and temporary. Fat is gained when you eat more energy than you use,
  whatever the macro split; in tightly controlled feeding studies with calories
  matched, cutting carbs did not beat cutting fat for fat loss.
- **"Carbs after training waste the session."** The opposite: muscle is first in
  line after a workout and refills its glycogen, and the window lasts hours, not
  minutes — see [diet quality](/docs/diet-quality).
- **"You can feel insulin resistance."** Sleepiness after meals, cravings or a
  belly are not a diagnosis. It is measured with blood tests — fasting glucose,
  HbA1c, sometimes fasting insulin — and read by a clinician.
- **"A supplement fixes it."** Nothing in a bottle comes close to training,
  walking, sleep and losing excess fat.

## Why lifters care

- **Better-fuelled sessions.** Sensitive muscle refills glycogen quickly, so
  the next session starts full.
- **The waist warns first.** Fat at the waist tracks insulin resistance more
  closely than bodyweight does. A waist growing faster than your lifts during a
  bulk is the surplus going to fat — one more reason for slow bulks and the
  body-fat ceilings in [choosing your phase](/docs/choosing-your-phase).
- **Carbs stay on the menu.** A lean, active, well-slept body handles a
  carb-rich diet well, and carbs are what fuel hard training.

## A short checklist

| Habit             | Target                                                              |
| ----------------- | ------------------------------------------------------------------- |
| Lifting           | 2+ days a week; most programs use 3–5                               |
| Moderate activity | 150–300 min a week, as public-health guidelines advise              |
| Steps             | 7,000–10,000 a day; get up every 30–60 min of sitting               |
| Sleep             | 7–9 h, regular hours                                                |
| Waist             | Under half your height — the [waist-to-height calculator](/tools/waist-to-height-ratio-calculator) checks it |
| Food              | Mostly whole foods, 25 g+ of fiber a day                            |

## Related

- [Diet quality](/docs/diet-quality) — fiber, processing and meal timing.
- [Sleep, deloads & recovery](/docs/sleep) — the lever most people skip.
- [Cardio, steps & NEAT](/docs/cardio-and-neat) — movement outside the gym.
- [Adaptive thermogenesis](/docs/adaptive-thermogenesis) — what else changes in a cut.`,
  },
  {
    id: 'fat-loss-myths',
    category: 'nutrition',
    title: 'Fat-loss myths',
    tags: [
      'myths',
      'fasted cardio',
      'somatotypes',
      'starvation mode',
      'obesity',
      'carbs',
      'homeostasis',
    ],
    body: `Most fat-loss advice that sounds precise is a short-window observation
stretched into a rule. The body balances itself over days, not minutes, so the
question for any claim is always the same: what happens over 24 hours, and
what happens to the total deficit?

## Fasted cardio does not burn more fat

Forty minutes of cardio burns about the same energy — say ~400 kcal — whether
you ate first or not. Fasted, with less carbohydrate on hand, the session does
draw a bigger share of that energy from fat. That is where the myth starts, and
where it stops being true:

| What was measured                      | What studies found                         |
| -------------------------------------- | ------------------------------------------ |
| Fat burned during the session          | More when fasted                           |
| Fat burned over 24 hours, in a lab     | From no difference to slightly more fasted |
| Body fat after weeks, calories matched | No difference                              |

Burning fat as fuel on a given day is not the same as losing stored fat over
weeks: the body stores and releases fat all day long, and what decides the
balance is the daily deficit — burn 2,000 and eat 2,000 and you hold; eat
1,700–1,800 and you lose. Cardio helps because it raises the burn, and it
helps exactly as much fed or fasted. Train fasted if you enjoy it; train fed if
that buys you a better session.

## Somatotypes are not a plan

Ectomorph, mesomorph and endomorph describe a snapshot of fat and muscle on a
frame, and both change as you train and eat well: the overweight beginner
called an endomorph reads as a mesomorph a few years later. No diet "for your
type" has held up in trials. The full story is in
[body types](/docs/somatotypes).

## "Starvation mode" does not stop fat loss

Eating very little does not make the body cling to fat. A real deficit always
draws on stored energy. Adaptation makes a long or steep deficit smaller — a
smaller body, less movement, a thriftier metabolism — and a steep one costs
more muscle, sleep and mood, but it never turns a deficit into fat gain. When
the scale stalls on very little food, the usual causes are water hiding the
loss or a food log that drifted. See
[adaptive thermogenesis](/docs/adaptive-thermogenesis).

## No single nutrient causes obesity

Fat was the villain in the 1950s; today it is carbohydrate. Blaming one
nutrient is simplistic — excess weight is multifactorial, and the same six
factors keep showing up together.

| Factor                  | What it does                                           |
| ----------------------- | ------------------------------------------------------ |
| Sedentarism             | Fewer steps, lower burn; society is built for it       |
| Ultra-processed food    | Calorie-dense, low satiety — you eat more and stay hungry |
| Stress                  | Worse sleep, more appetite, a plan that slips          |
| Poor sleep              | Higher insulin resistance and hunger the next day      |
| Under-hydration         | Lower energy for the day and the session               |
| Caloric excess          | The one that closes the loop — with sedentarism, the combination that drives weight up |

In an active life — 8,000–10,000 steps, three or four sessions a week — no
single food is "bad". Fix the six together and carbs stop being a problem.

> **Tip:** When a rule promises a shortcut, ask what it does to the 24-hour deficit. If the answer is "nothing", it is a preference, not a lever.

## Related

- [Hydration & steps](/docs/hydration) — two of the six factors, made concrete.
- [Sleep](/docs/sleep) — the recovery side of the same list.
- [Breaking a plateau](/docs/breaking-a-plateau) — the levers that actually move the deficit.
- [Adaptive thermogenesis](/docs/adaptive-thermogenesis) — what a long diet really does to your burn.
- [Diet quality](/docs/diet-quality) — what to do about ultra-processed food.`,
  },
];
