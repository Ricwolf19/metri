import type { DocSection } from '../../types';

export const app: DocSection[] = [
  {
    id: 'app-guide',
    category: 'app',
    title: 'Using the app: modules & tips',
    tags: ['app', 'guide', 'home', 'train', 'progress', 'settings', 'widget'],
    body: `The app has five tabs at the bottom and a profile behind your avatar. This guide walks
through each one, in the order you will meet them, and ends with the small habits that
make daily use faster.

## Home

Home is your dashboard. It shows the **week strip** (the last weeks as a row of days, with
today highlighted) and any banner that needs your attention: a catch-up question when a
planned training day went unlogged, an invitation to add the home screen widget, or a note
about local mode.

Below that are **quick actions**: shortcuts to the tools you use most. There are none by
default. Tap **Customize** to pin calculators, photos, the plan screen or anything else.

## Train

Train is where programs live. **Ready-made plans** come with the app; **your programs**
are the ones you build or import. A program is a tree:

| Level | What it holds |
| --- | --- |
| **Phase** | A block of weeks with one goal (for example, strength, then volume) |
| **Split** | One session in the week: Push, Pull, Legs, or AM / PM |
| **Exercise** | Sets, rep range, RIR target, rest time |

In the editors, **long-press a row and drag** to reorder phases, splits or exercises.
Structure changes (add, delete, reorder) are saved right away; text and numbers are saved
when you tap Save.

Tap **Start** on a program and the app validates it first (every phase needs splits, every
split needs exercises). Then it asks for a **weekday and time per split**; later phases copy
the first one until you change them. This schedule drives your reminders and your
consistency calendar. Only one program is active at a time; switching replaces it, and
abandoning keeps every workout you logged.

### The workout screen

Each exercise shows its planned sets and last week's numbers. For each set you log
**weight × reps**, optionally the **RIR** you had left, and whether you went to
**failure**. Add an extra set when the plan is not enough. When you finish, a summary shows
volume, working sets, duration and new PRs.

After a set the **rest timer** starts. You can add **+30 s**, **+1 min** or **+2 min**,
or skip it. On Android it also posts a lock-screen notification with a **live countdown**
and **Skip**, **+30 s** and **+1 min** buttons, so you can leave the phone on the bench.
Tapping the notification brings you back to the next set. When the rest ends, the
notification changes to "Rest over".

## Progress

The **consistency calendar** shows one dot per day: **lime** means trained, **red** means a
planned day you missed, **gray** means rest. Only planned days can break a streak; unplanned
days are neutral. Tap any day to open the **day detail sheet** with every set you logged and
a **Share this day** button that renders a card you can post or save. You can also mark a
past day by hand from that sheet.

Progress also tracks **body weight** (with your BMR and TDEE from the calculators) and
**progress photos**, which you can compare side by side. Photos stay on the device.

## Explore

Explore holds every **calculator** and every **guide**, grouped by topic. Search by name or
by tag. Calculators can save their result to your profile, so Home and Progress pick it up.

## Profile & settings

Tap your avatar. Here you set:

- **Units**: kg or lb.
- **Clock**: 12-hour or 24-hour.
- **Date format**: system, day/month/year, month/day/year, year-month-day, short month, or full.
- **Appearance**: system, light or dark. **Language**: English or Spanish.
- **Reminders & notifications**, one switch per event: daily check-in, training time,
  weigh-in, calories. Training time follows your active program's schedule.
- **Your plan**: export and import (with an account), and the AI prompt for building an
  import file.
- **Account**: create one, sign out, or see where the password is managed.

## Practical tips

- **Irreversible actions need a hold.** Delete, abandon and discard buttons fill up while
  you press; release early and nothing happens.
- **Leaving an editor with changes** asks Save & leave, Discard or Cancel. Nothing is lost
  by accident.
- **The Android widget** shows your streak and next session on the home screen. Long-press
  the home screen, open Widgets and add metri.
- **Reminders follow the schedule** you set when you started the program. Change the
  weekday or time in the program editor and the reminders move with it.
- **Left a session open?** The app asks whether to save it as completed or discard it the
  next time you return.

Related: [What the icons and links mean](/docs/app-conventions),
[FAQ](/docs/app-faq), [How a program works](/docs/how-a-program-works).`,
  },
  {
    id: 'app-conventions',
    category: 'app',
    title: 'What the icons and links mean',
    tags: ['app', 'icons', 'ui', 'conventions', 'colors'],
    body: `The app uses a small set of visual signals and sticks to them everywhere. Once you
know them, you never have to guess what a tap will do.

## Buttons and links

| Signal | Meaning |
| --- | --- |
| **Lime button** | The one primary action on this screen. There is never more than one. |
| **Lime underlined text** | Tappable knowledge: "Read more", "Read the guide". Opens a doc. |
| **Red press-and-hold button** | Irreversible. Hold until the fill completes; release early to cancel. |
| **Outlined or gray button** | A secondary action: cancel, skip, edit. |
| **Read more after "…"** | Long text is clamped. Tap to expand it in place or open the full doc. |

## The top bar

| Icon | Meaning |
| --- | --- |
| **Book** | Opens the guide for the screen you are on. |
| **Question mark** | Quick answers and the Send feedback button. |
| **Flask** | You are on the beta build. Tap to see what is new. |
| **Ring around the avatar** | Cloud sync status. Only appears with Premium sync. |

The ring colours: **green** means everything is backed up, **blue** means syncing right
now, **gray** means offline with changes queued, **red** means the last sync failed. Tap
the avatar to see details and recent activity.

## Calendar and week strip

| Colour | Meaning |
| --- | --- |
| **Lime** | You trained that day. |
| **Red** | A planned training day you did not log. |
| **Gray** | Rest day, planned or marked by you. |
| **Empty** | Nothing recorded. Unplanned days never count against you. |

Tap any day to open its detail sheet.

## Layout signals

| Element | Meaning |
| --- | --- |
| **Small mono uppercase label** | A section header. Groups the cards below it. |
| **Chips** | Filters or tags: weekdays, muscle groups, equipment. Tap to toggle. |
| **Drag handle on a bottom sheet** | Drag down to close; tap to expand. |
| **Drag handle on a list row** | Long-press the row, then drag to reorder. |
| **Chevron at the edge of a list** | There is more; scroll to see it. |
| **Toast at the bottom** | Confirmation of a save, delete, start or abandon. It goes away on its own. |

## Motion

Nothing bounces. Dialogs fade, sheets rise briefly, press feedback is instant. If something
animates for longer than a blink, it is telling you to wait (for example, while a workout
is being saved).

Related: [Using the app: modules & tips](/docs/app-guide), [FAQ](/docs/app-faq).`,
  },
  {
    id: 'app-faq',
    category: 'app',
    title: 'FAQ',
    tags: ['app', 'faq', 'plans', 'premium', 'offline', 'data', 'feedback'],
    body: `Short answers to the questions that come up most. For a tour of each screen, read
[Using the app: modules & tips](/docs/app-guide).

## Web and app

**What is the difference between metri.info and the app?**
The web has every calculator and guide, free and without signing up, plus your optional
account (email, password, plan). The app is for daily training: logging sets, the rest
timer, the consistency calendar, progress photos and reminders. One account works on both.

**Does the app work offline?**
Yes, fully. The database lives on your phone and every screen reads from it. Sync, when
you have it, runs in the background whenever there is a connection.

## Plans

**What does Free include?**
Everything: programs, logging, calculators, guides, calendar, photos, reminders. No account
is needed. A free account adds export/import and restores your profile if you reinstall.

**What does Premium add?**
Automatic cloud sync and backup, so your training is safe and identical across devices.
It needs a free account first. During the beta, access is granted on request.

**I started without an account. Can I create one later?**
Yes. Signing in adopts the local profile you already have; nothing is copied or duplicated.

## Your data

**Where does my data live and what leaves the device?**
Everything is stored on the phone. Without Premium nothing leaves it. With Premium, your
training data (programs, workouts, sets, adherence, body metrics) syncs to your account.
Photos and reminders never leave the device in any mode. Error reports carry only an account
id, never personal data.

**How do export and import work?**
Export creates one JSON file with your programs, sessions, sets and adherence history.
Import reads that file and adds its rows to your account with fresh ids, so importing the
same file twice duplicates it. Both need a free account. The **AI prompt** on the same
screen is a ready-made text: paste it into any assistant, describe your training history,
and it returns a valid import file.

**What does the ring around my avatar mean?**
It is the sync indicator and only appears with Premium. Green is backed up, blue is
syncing, gray is offline with changes queued, red means the last sync failed. Tap the
avatar for details. Sync failures are otherwise silent by design.

## The beta build

**Why an APK instead of the Play Store?**
metri is in open beta. Shipping the APK directly lets updates reach you the same day
without a store review, and most updates arrive over the air without reinstalling.

**Why is there no iOS version?**
Apple requires TestFlight for betas, and that step is not prepared yet. The code already
runs on iOS, so it will follow once the beta stabilises.

## Everyday use

**How do rest notifications behave when the phone is locked?**
On Android the rest timer posts a notification with a live countdown drawn by the system,
so it keeps ticking with the app in the background or the screen off. It has **Skip**,
**+30 s** and **+1 min** buttons that work from the lock screen, and tapping it brings you
back to the next set. When time is up it turns into "Rest over".

**How do I change language, date format or clock format?**
Open your profile from the avatar. Language, Appearance, Time format and Date format are
all there and apply instantly.

**How do I send feedback?**
Open the quick answers (the question mark in the top bar) and tap **Send feedback**. It
goes straight to the team and shapes what ships next.

Related: [What the icons and links mean](/docs/app-conventions),
[What is metri?](/docs/welcome).`,
  },
];
