/**
 * Where a session's time went — an ESTIMATE, the way fatigue is a model and
 * not a measurement. The app sees three things: when the session started and
 * ended, when each set was checked off, and when the lifter called a rest over
 * (`set_logs.rest_before_seconds`, see `rest-taken.ts`). Ready does not say the
 * set began, and a set's own length is a guess, so every number here is one.
 *
 * Each gap between two checks holds the set just checked (`SET_WORK_SECONDS`),
 * the rest before it (as recorded, else the plan's rest, capped by the gap),
 * an allowance for getting set up — bigger onto another exercise than between
 * two sets of one, biggest before the first set (warm-up) — and whatever is
 * left over, which is idle time. The verdict reads the idle share.
 */

/** One working set under the bar, unrack to rerack: a guess for 6–12 reps. */
export const SET_WORK_SECONDS = 40;
/** Between two sets of one exercise: rerack, change plates, log the set. */
export const SET_CHANGE_ALLOWANCE_SECONDS = 45;
/** Onto another exercise: walk to the station, set it up, load it. */
export const EXERCISE_CHANGE_ALLOWANCE_SECONDS = 3 * 60;
/** From the start to the first set: the warm-up and the first setup. */
export const LEAD_IN_ALLOWANCE_SECONDS = 10 * 60;
/** After the last set, before the session closed: rerack, a last stretch. */
export const WRAP_UP_ALLOWANCE_SECONDS = 5 * 60;
/** An idle share under this is on pace… */
const ON_PACE_IDLE_SHARE = 0.15;
/** …and over this, a lot of the session went unused. */
const LOTS_IDLE_SHARE = 0.3;
/** The longest pause is called out only from this long. */
const LONG_PAUSE_SECONDS = 5 * 60;
/** Too few sets to judge a pace from. */
const MIN_JUDGED_SETS = 3;
/**
 * A set checked this soon after the previous one, with no real rest recorded
 * between them, was logged after the fact: nobody lifts a set in 20 s.
 */
const BATCH_GAP_SECONDS = 20;
/**
 * From this share of batched sets on, the gaps say nothing about rest or idle
 * time (sets logged in bursts leave a run of seconds, then one huge gap).
 */
const BATCHED_SHARE_UNRELIABLE = 0.3;
/** An average rest within this ratio of the plan reads as on plan. */
const REST_ON_PLAN_TOLERANCE = 0.2;

export type TimedSet = {
  exerciseId: string;
  /** Epoch ms the set was checked off. */
  loggedAt: number;
  /** The rest recorded before it; null when none was (older builds, a set after a skip). */
  restBeforeSeconds: number | null;
};

type TimingVerdict = 'onPace' | 'someIdle' | 'lotsIdle';

export type RestComparison = {
  /** Rests the lifter ended or ran into the next set, averaged; null when none was recorded. */
  takenSeconds: number | null;
  /** The plan's rest over the same gaps (every gap when none was recorded). */
  plannedSeconds: number;
  /** How many rests were recorded. */
  measured: number;
  versus: 'shorter' | 'onPlan' | 'longer' | null;
};

/** The longest stretch of idle time, before the set it held up. */
type LongestPause = { exerciseId: string; setNumber: number; seconds: number };

export type SessionTiming = {
  totalSeconds: number;
  /**
   * False when too many sets were logged in bursts (`BATCHED_SHARE_UNRELIABLE`):
   * only the total and the recorded rests mean anything then.
   */
  reliable: boolean;
  batchedSets: number;
  liftingSeconds: number;
  restSeconds: number;
  setupSeconds: number;
  idleSeconds: number;
  /** Idle over everything accounted for, 0–1. */
  idleShare: number;
  /** Start to the first set (warm-up, setup). */
  leadInSeconds: number;
  rest: RestComparison | null;
  longestPause: LongestPause | null;
  /** Null when unreliable or too short to judge. */
  verdict: TimingVerdict | null;
};

const average = (values: readonly number[]): number =>
  values.reduce((sum, v) => sum + v, 0) / values.length;

const restVersus = (taken: number, planned: number): RestComparison['versus'] => {
  if (!(planned > 0)) return null;
  const ratio = taken / planned;
  if (ratio < 1 - REST_ON_PLAN_TOLERANCE) return 'shorter';
  if (ratio > 1 + REST_ON_PLAN_TOLERANCE) return 'longer';
  return 'onPlan';
};

/** Null for a session with no working set: there is no time to split. */
export const sessionTiming = ({
  startedAt,
  endedAt,
  sets: input,
  plannedRestFor,
}: {
  startedAt: number;
  endedAt: number;
  sets: readonly TimedSet[];
  /** The rest the timer runs after a set of this exercise (the session's plan). */
  plannedRestFor: (exerciseId: string) => number;
}): SessionTiming | null => {
  if (!input.length) return null;
  const sets = [...input].sort((a, b) => a.loggedAt - b.loggedAt);
  const totalSeconds = Math.max(0, Math.round((endedAt - startedAt) / 1000));

  let lifting = 0;
  let rest = 0;
  let setup = 0;
  let idle = 0;
  let batched = 0;
  let leadIn = 0;
  let longest: LongestPause | null = null;
  const taken: number[] = [];
  const plannedForTaken: number[] = [];
  const plannedAll: number[] = [];
  const ordinal = new Map<string, number>();

  let prevAt = startedAt;
  let prev: TimedSet | null = null;
  for (const set of sets) {
    const setNumber = (ordinal.get(set.exerciseId) ?? 0) + 1;
    ordinal.set(set.exerciseId, setNumber);
    const gap = Math.max(0, Math.round((set.loggedAt - prevAt) / 1000));
    const work = Math.min(SET_WORK_SECONDS, gap);
    let restHere = 0;
    let allowance = LEAD_IN_ALLOWANCE_SECONDS;
    if (!prev) leadIn = gap;
    else {
      const recorded = set.restBeforeSeconds;
      // A recorded rest this short is the logging, not a rest: the gap decides.
      const isBatched =
        gap < BATCH_GAP_SECONDS && !(recorded != null && recorded >= BATCH_GAP_SECONDS);
      const planned = plannedRestFor(prev.exerciseId);
      const room = gap - work;
      restHere = Math.max(0, Math.min(room, recorded ?? planned));
      if (isBatched) batched += 1;
      else {
        plannedAll.push(planned);
        if (recorded != null) {
          taken.push(restHere);
          plannedForTaken.push(planned);
        }
      }
      allowance =
        set.exerciseId === prev.exerciseId
          ? SET_CHANGE_ALLOWANCE_SECONDS
          : EXERCISE_CHANGE_ALLOWANCE_SECONDS;
    }
    const left = Math.max(0, gap - work - restHere);
    const setupHere = Math.min(allowance, left);
    const idleHere = left - setupHere;
    lifting += work;
    rest += restHere;
    setup += setupHere;
    idle += idleHere;
    if (idleHere > (longest?.seconds ?? 0)) {
      longest = { exerciseId: set.exerciseId, setNumber, seconds: idleHere };
    }
    prevAt = set.loggedAt;
    prev = set;
  }
  const tail = Math.max(0, Math.round((endedAt - prevAt) / 1000));
  const wrapUp = Math.min(WRAP_UP_ALLOWANCE_SECONDS, tail);
  setup += wrapUp;
  idle += tail - wrapUp;

  const accounted = lifting + rest + setup + idle;
  const idleShare = accounted > 0 ? idle / accounted : 0;
  const reliable = batched / sets.length < BATCHED_SHARE_UNRELIABLE;
  const judged = reliable && sets.length >= MIN_JUDGED_SETS && accounted > 0;
  const takenAverage = taken.length ? Math.round(average(taken)) : null;
  const plannedPool = taken.length ? plannedForTaken : plannedAll;

  return {
    totalSeconds,
    reliable,
    batchedSets: batched,
    liftingSeconds: lifting,
    restSeconds: rest,
    setupSeconds: setup,
    idleSeconds: idle,
    idleShare,
    leadInSeconds: leadIn,
    rest: plannedPool.length
      ? {
          takenSeconds: takenAverage,
          plannedSeconds: Math.round(average(plannedPool)),
          measured: taken.length,
          versus: takenAverage == null ? null : restVersus(takenAverage, average(plannedPool)),
        }
      : null,
    longestPause: reliable && longest && longest.seconds >= LONG_PAUSE_SECONDS ? longest : null,
    verdict: judged
      ? idleShare < ON_PACE_IDLE_SHARE
        ? 'onPace'
        : idleShare > LOTS_IDLE_SHARE
          ? 'lotsIdle'
          : 'someIdle'
      : null,
  };
};
