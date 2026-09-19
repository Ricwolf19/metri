import type { DocSection } from '../../types';

export const training: DocSection[] = [
  {
    id: 'progressive-overload',
    category: 'training',
    title: 'Progressive overload',
    tags: ['progressive overload', 'hypertrophy', 'strength', 'programming', 'ramp-up', 'logging'],
    body: `Muscle and strength only grow when you ask the body to do more than it is used
to. That is **progressive overload**: a gradual, sustained rise in training demand
over time. Everything else is detail.

## Ways to add load

You do not only progress by adding weight. In rough priority:

1. **Add reps** at the same weight.
2. **Add weight** once you hit the top of your rep range.
3. **Add sets** (more weekly volume).
4. **Improve technique / range of motion.**
5. **Reduce rest** or move closer to failure.

> **Tip:** Pick *one* lever per block. Trying to add weight, reps and sets at once is how you stall and get sore for no reason.

## Find the weight with ramp-up sets

Never walk up to a working weight cold. Ramp-up (warm-up) sets do two jobs: they
warm the joints and they tell you what today's working weight is. Each one stays
far from failure — roughly **10 reps in reserve** — and none of them count as
volume.

| Ramp-up set | Load (of working weight) |
| ----------- | ------------------------ |
| 1           | ~20%                     |
| 2           | ~40%                     |
| 3           | ~60%                     |
| 4           | ~80%                     |
| Working set | 100%                     |

If the 80% set feels heavier than usual, take a little off the working weight
today — the ramp already told you. On a new exercise, the ramp is also how you
discover the right weight in the first place.

## Straight sets vs descending sets

| Scheme          | Example | Weight                               |
| --------------- | ------- | ------------------------------------ |
| Straight sets   | 3×8     | shave ~5% each set to keep hitting 8 |
| Descending sets | 8-6-4   | same weight; fatigue drops the reps  |

With straight sets, holding the weight gets you 8, then 7, then 6. Trimming ~5%
per set keeps every set on target. With descending sets the drop *is* the plan, so
the weight stays put.

## Double progression

A simple, durable scheme for hypertrophy:

- Choose a rep range, e.g. **8–12**.
- Keep the weight until you hit **12 reps on all sets**.
- Then add the smallest increment and drop back toward 8.

## The logging loop

You cannot overload what you do not measure. Log **weight × reps** for every set,
then beat that entry next session: same weight with one more rep, or a little more
weight at the same reps. Overshot the target (14 where 12 were planned)? Nudge the
weight up. Fell short? Nudge it down. Keeping the log at all tends to improve
performance by itself. Use the [1RM calculator](/tools/1rm-calculator) to compare
hard sets across different rep ranges.

## Adjust slowly

The body responds better to small week-to-week changes than to big ones. Change the
plan — exercises, sets, rep ranges — only after a **real plateau of 3–4 weeks**, not
after one bad session.

## When to back off

Progress is not linear. When performance drops for 2–3 sessions in a row despite
decent sleep and food, the problem is usually fatigue, not the plan: take a lighter
**deload** week — see [sleep, deloads & recovery](/docs/sleep) — then resume.
Fatigue masks fitness; a deload reveals it.

Related: [intensity & RIR](/docs/training-intensity),
[volume & frequency](/docs/volume-frequency),
[how a program works](/docs/how-a-program-works).`,
  },
  {
    id: 'training-intensity',
    category: 'training',
    title: 'Intensity, RIR & proximity to failure',
    tags: ['intensity', 'rir', 'failure', 'tension', 'effort'],
    body: `How close a set gets to failure decides whether it counts. Mechanical tension is
the main driver of muscle growth, and tension peaks in the last hard reps of a
set. **RIR (reps in reserve)** is how you measure that closeness.

## What RIR means

RIR is the number of reps you could still do before failing. "RIR 2" means you stop
two reps short of your limit.

Worked example: **4×4 at RIR 2–3** means a weight you could lift **6–7 times**, but
you stop at 4 and leave 2–3 in the tank.

| Prescription | Weight you could do | Reps you do |
| ------------ | ------------------- | ----------- |
| 4×4 RIR 2–3  | 6–7                 | 4           |
| 4×6 RIR 3–4  | 9–10                | 6           |
| 3×8 RIR 1–2  | 9–10                | 8           |
| 4×12         | 12 (to failure)     | 12          |

> **Tip:** No RIR stated means the set goes to technical failure. "4×12" reads as "4×12 to failure".

## Ramping intensity across a block

A common 4-week block trims RIR every week, so intensity rises as you adapt:

| Week | Sets                              |
| ---- | --------------------------------- |
| 1    | 4×6 RIR 3–4                       |
| 2    | 4×6 RIR 2–3                       |
| 3    | 4×6 RIR 1–2                       |
| 4    | 1×6 RIR 0 (failure) + 3×6 RIR 3–4 |

In week 4, after the failure set, drop to a weight you could do **7–8 reps** with
so the remaining sets genuinely land at RIR 3–4. Between sets, shaving ~5% is fine
whenever fatigue pushes you closer to failure than prescribed.

## Technical vs absolute failure

- **Technical failure:** you cannot do another rep *with the same technique* —
  form starts to break. This is where a working set ends.
- **Absolute failure:** the weight will not move at all, form aside. Rarely worth
  the fatigue or the injury risk, especially on compounds.

## Beginners: everything to technical failure

Beginners systematically misjudge RIR — they feel 1–2 reps out when they are 5.
Until your sense of effort calibrates (months, not weeks), take every working set
to technical failure. A set stopped at 15 that could have reached 20 was a warm-up,
not a stimulus.

## 3–5 RIR is wasted work

A set that ends with 3–5 reps left produces little fatigue, but also little
result: the fibers that grow are recruited in the hard final reps. Either push the
set or accept it as a warm-up. The only exception is a planned sub-maximal week in
a ramp like the one above — and even there the block ends at failure.

## Adjusting the weight

Beat the prescribed reps at the prescribed RIR? Raise the weight slightly next
week. Fell short? Lower it a little. That is the whole loop — see
[progressive overload](/docs/progressive-overload).

Related: [volume & frequency](/docs/volume-frequency),
[technique](/docs/lifting-technique), [glossary](/docs/glossary).`,
  },
  {
    id: 'volume-frequency',
    category: 'training',
    title: 'Volume, frequency & rest',
    tags: ['volume', 'frequency', 'sets', 'hypertrophy', 'rest', 'density'],
    body: `Volume is how many hard sets a muscle gets per week; frequency is how many
sessions those sets are spread across; density is how much rest sits between them.
The three interact, and the first is the one that drives growth.

## Volume: 10–20 hard sets per muscle per week

| Weekly sets per muscle | Meaning                                |
| ---------------------- | -------------------------------------- |
| under 10               | Maintenance, or a deload               |
| 10–20                  | The evidence-backed productive range   |
| over 20                | Only if you recover and keep improving |

A "hard set" is one close to failure (see [intensity](/docs/training-intensity)).
Ramp-up sets do not count. The range is not a cliff — 8 or 22 sets still do
something — but recovery, and whether your numbers keep climbing, tells you where
you sit. More is not better; *better* is better: more weight, or more reps at the
same weight.

## Frequency: how to spread it

- Several studies find **2 sessions per muscle per week** best for growth.
- Others find that, at **equal weekly volume**, 1, 2 or 3 sessions perform the same
  (12 chest sets on one day ≈ 4 sets on three days).
- Practical rule: **split when one day is too much**. If the last six of sixteen
  quad sets in one session are junk, move them to a second day.

| Weekly sets | Sessions | Sets per session |
| ----------- | -------- | ---------------- |
| 10          | 1–2      | 5–10             |
| 16          | 2        | 8                |
| 20          | 2–3      | 7–10             |

## Density: rest enough to lift heavy

Short rests reduce the load you can move, and load is what creates tension. Do not
build a program on 30–60 s rests, circuits or supersets.

| Exercise type                           | Rest between sets |
| --------------------------------------- | ----------------- |
| Compounds (squat, press, row, deadlift) | ~3 min            |
| Accessories (curls, extensions, raises) | ~2 min            |
| Abs, calves, back extensions            | ~1.5 min          |

> **Tip:** Let the rest timer in the workout screen run — it counts down and then names the next set, so you rest fully without losing track.

## Training days per week

Cap it at **2 consecutive training days**, then rest one. Three days (Mon / Wed /
Fri) or four (Mon–Tue / Thu–Fri) both fit. Training three days a week is not "a
beginner thing": weekly volume, set intensity and exercise selection matter far
more than how many days you show up.

Related: [progressive overload](/docs/progressive-overload),
[how a program works](/docs/how-a-program-works),
[sleep & deloads](/docs/sleep).`,
  },
  {
    id: 'lifting-technique',
    category: 'training',
    title: 'Technique: ROM, tempo & setup',
    tags: ['technique', 'rom', 'tut', 'tempo', 'form', 'setup'],
    body: `Technique decides whether the load lands on the muscle or on a joint. It also
keeps your log honest: a rep only counts as progress if it was done the same way
as last time.

## Priority order

When something has to give, give in this order — the top matters most:

| Priority | Lever       | Rule                                        |
| -------- | ----------- | ------------------------------------------- |
| 1        | Intensity   | Take working sets close to failure          |
| 2        | Volume      | 10–20 hard sets per muscle per week         |
| 3        | Technique   | Load only what you can lift with clean form |
| 4        | ROM         | Full range, always                          |
| 5        | TUT / tempo | ~3 s eccentric, fast concentric             |

Intensity and volume are the stimulus. Technique, range and tempo are how you
deliver it without injury — and how you keep progress measurable.

## ROM: full range, never traded

More range means more muscle worked. A half squat because the bar got heavy is not
a heavier squat; it is a different exercise with worse numbers. Never trade range
for more weight or more reps.

## Tempo and time under tension

- **Eccentric (lowering): ~3 seconds**, under control.
- **Concentric (lifting): as fast as you can** while staying controlled.
- **TUT per set: 20–40 s** is the productive window for hypertrophy.

With rep ranges above 6, controlling the descent already puts you there — no
metronome needed. TUT is the least important of the five levers; do not chase it.

## Same setup, every session

Stance width, grip, bar position and depth are part of the exercise. If they
change between sessions, your numbers stop being comparable: 100 kg with a wider
stance and a shallower squat is not progress over 95 kg done well. Fix your setup
once and repeat it. Filming a set now and then is the easiest way to catch drift.

> **Tip:** Write the setup in the exercise notes (grip, stance, seat height) so it survives a break or a change of gym.

## Technique and injury

A poor position — shoulders rolled forward on a press, a rounded lower back on a
row — stalls the load and shifts stress onto tissues that adapt more slowly than
muscle. Technique is what lets intensity keep rising for years.

Related: [progressive overload](/docs/progressive-overload),
[intensity & RIR](/docs/training-intensity), [glossary](/docs/glossary).`,
  },
  {
    id: 'how-a-program-works',
    category: 'training',
    title: 'How a program works',
    tags: ['program', 'blocks', 'splits', 'schedule', 'logging', 'exercise order'],
    body: `A program is a plan you repeat for a few weeks while the numbers move. Most
strength-and-size programs share the same shape, and metri is built around it.

## The shape of a program

| Part           | What it is                                 | In metri |
| -------------- | ------------------------------------------ | -------- |
| Block          | ~4 weeks under one prescription            | Phase    |
| Side (A/B/C/D) | One training day                           | Split    |
| Column         | One week of that side                      | Week     |
| Row            | One exercise with sets × reps (and RIR)    | Exercise |

A 3-day program has three splits. Monday runs split A, Wednesday B, Friday C, and
the next week moves every split to its next column. A block ends when you have
done every column of every split; the next block changes the prescription (or a
few exercises), not the whole plan.

## How to run a session

1. Warm up with ramp-up sets — they do not count as working sets.
2. Do **every set of an exercise before moving on** to the next one.
3. **Keep the exercise order.** A movement done first performs better than the same
   movement done third; reorder and your numbers become incomparable.
4. No supersets, tri-sets or circuits: rest fully so the load stays heavy.
5. Log **weight and reps for every set** — including the ones you missed.

> **Tip:** The rest timer starts when you finish a set and names the next one, so you never lose the thread between exercises.

## Scheduling the week

- **Max 2 consecutive training days.** Four days means Mon–Tue + Thu–Fri or
  Tue–Wed + Fri–Sat.
- Time of day does not matter; train when you can be consistent.
- Assign each split a weekday when you start the program. The home screen then
  knows which split is next, and only those days count against your streak.

## The numbers are a guide

The reps on the sheet are a target, not a law. Getting 10 where 8 were written, or
7, changes nothing — what matters is that the set was truly hard. Adjust the weight
next week so you land near the prescription: overshoot → a little more weight;
undershoot → a little less. See [intensity & RIR](/docs/training-intensity).

## Change exercises rarely

The body adapts to a specific movement. Swap an exercise and you spend weeks
re-learning it before it builds anything. Keep a movement until it stops
progressing; change **a few exercises every 4–6 months**, never the whole list.

## In metri

- A **program** holds one or more **phases** (blocks of N weeks, 4 by default).
- Each phase has **splits** (sessions); each split lists exercises with a
  prescription per week (sets, reps or a rep range, RIR, rest).
- **Starting** a program enrolls you in a copy and asks for a schedule: the weekday
  and time each split runs.
- The workout screen walks the exercises in order, logs every set and runs the
  rest timer with the rest you set per exercise.

Related: [progressive overload](/docs/progressive-overload),
[volume, frequency & rest](/docs/volume-frequency),
[technique](/docs/lifting-technique).`,
  },
];
