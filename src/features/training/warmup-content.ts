import type { WarmupStep } from '@/db/schema';
import type { Locale } from '@/i18n';

/**
 * Bilingual copy for the seeded warm-up and mobility routines — a content
 * module, not an i18n dict (AGENTS.md#conventions): these are editorial
 * routines that happen to ship with the app, and the user's own routines carry
 * their own text.
 *
 * The structure follows RAMP — Raise, Activate, Mobilise, Potentiate — the
 * standard warm-up frame in strength coaching: get warm, wake the muscles that
 * do the work, move the joints the lift needs, then ramp into the load.
 * Static stretching belongs after the session, not before: held stretches
 * before lifting reduce force output.
 */
export type WarmupCopy = {
  name: string;
  description: string;
  steps: WarmupStep[];
};

const WARMUP_IDS = ['warmup-general', 'warmup-upper', 'warmup-lower', 'mobility-daily'] as const;

type WarmupId = (typeof WARMUP_IDS)[number];

const WARMUP_KIND: Record<WarmupId, 'warmup' | 'mobility'> = {
  'warmup-general': 'warmup',
  'warmup-upper': 'warmup',
  'warmup-lower': 'warmup',
  'mobility-daily': 'mobility',
};

const EN: Record<WarmupId, WarmupCopy> = {
  'warmup-general': {
    name: 'General warm-up',
    description: 'Ten minutes that work before any session: raise, activate, mobilise, then ramp.',
    steps: [
      { name: 'Easy cardio — bike, row or incline walk', detail: '5 min, conversational' },
      { name: 'Band pull-apart', detail: '2 × 15' },
      { name: 'Glute bridge', detail: '2 × 12' },
      { name: 'Dead bug', detail: '2 × 8 per side' },
      { name: 'Hip and ankle circles', detail: '30 s each' },
      {
        name: 'Ramp sets on the first exercise',
        detail: '2 sets: ~40% then ~80% of the work load',
      },
    ],
  },
  'warmup-upper': {
    name: 'Upper-body warm-up',
    description: 'For pressing and pulling days: shoulders and mid-back before the first bar.',
    steps: [
      { name: 'Easy cardio — row or bike', detail: '4 min' },
      { name: 'Band pull-apart', detail: '2 × 15' },
      { name: 'Shoulder dislocates with a band or stick', detail: '2 × 10' },
      { name: 'Scapular push-up', detail: '2 × 10' },
      { name: 'Thoracic rotation on all fours', detail: '6 per side' },
      { name: 'Ramp sets on the first press or pull', detail: '2 sets: ~40% then ~80%' },
    ],
  },
  'warmup-lower': {
    name: 'Lower-body warm-up',
    description: 'For squat and hinge days: hips, knees and ankles before the load.',
    steps: [
      { name: 'Easy cardio — bike', detail: '5 min' },
      { name: 'Glute bridge', detail: '2 × 12' },
      { name: 'Bodyweight squat, slow', detail: '2 × 10' },
      { name: 'Ankle rock against a wall', detail: '10 per side' },
      { name: '90/90 hip switch', detail: '8 per side' },
      { name: 'Ramp sets on the first squat or hinge', detail: '2–3 sets: empty bar, ~40%, ~80%' },
    ],
  },
  'mobility-daily': {
    name: 'Mobility — after training or rest days',
    description:
      'Held stretches belong here, not before lifting: they cost force if you do them first.',
    steps: [
      { name: 'Cat–cow', detail: '10 slow cycles' },
      { name: 'Hip flexor stretch (half kneeling)', detail: '45 s per side' },
      { name: 'Hamstring stretch, hips hinged', detail: '45 s per side' },
      { name: 'Doorway chest stretch', detail: '45 s per side' },
      { name: '90/90 hip hold', detail: '45 s per side' },
      { name: 'Calf stretch against a wall', detail: '45 s per side' },
    ],
  },
};

const ES: Record<WarmupId, WarmupCopy> = {
  'warmup-general': {
    name: 'Calentamiento general',
    description:
      'Diez minutos que sirven para cualquier sesión: elevar, activar, movilizar y luego subir carga.',
    steps: [
      { name: 'Cardio suave — bici, remo o caminata inclinada', detail: '5 min, pudiendo hablar' },
      { name: 'Band pull-apart', detail: '2 × 15' },
      { name: 'Puente de glúteo', detail: '2 × 12' },
      { name: 'Dead bug', detail: '2 × 8 por lado' },
      { name: 'Círculos de cadera y tobillo', detail: '30 s cada uno' },
      {
        name: 'Series de aproximación en el primer ejercicio',
        detail: '2 series: ~40% y luego ~80% de la carga de trabajo',
      },
    ],
  },
  'warmup-upper': {
    name: 'Calentamiento de tren superior',
    description: 'Para días de empuje y jalón: hombros y espalda alta antes de la primera barra.',
    steps: [
      { name: 'Cardio suave — remo o bici', detail: '4 min' },
      { name: 'Band pull-apart', detail: '2 × 15' },
      { name: 'Dislocaciones de hombro con banda o palo', detail: '2 × 10' },
      { name: 'Flexión escapular', detail: '2 × 10' },
      { name: 'Rotación torácica en cuadrupedia', detail: '6 por lado' },
      {
        name: 'Series de aproximación en el primer press o jalón',
        detail: '2 series: ~40% y ~80%',
      },
    ],
  },
  'warmup-lower': {
    name: 'Calentamiento de tren inferior',
    description: 'Para días de sentadilla y bisagra: cadera, rodilla y tobillo antes de la carga.',
    steps: [
      { name: 'Cardio suave — bici', detail: '5 min' },
      { name: 'Puente de glúteo', detail: '2 × 12' },
      { name: 'Sentadilla sin peso, lenta', detail: '2 × 10' },
      { name: 'Movilidad de tobillo contra la pared', detail: '10 por lado' },
      { name: 'Cambio 90/90 de cadera', detail: '8 por lado' },
      {
        name: 'Series de aproximación en la primera sentadilla o bisagra',
        detail: '2–3 series: barra vacía, ~40%, ~80%',
      },
    ],
  },
  'mobility-daily': {
    name: 'Movilidad — después de entrenar o en descanso',
    description:
      'Los estiramientos sostenidos van aquí, no antes de levantar: hacerlos primero te cuesta fuerza.',
    steps: [
      { name: 'Gato–camello', detail: '10 ciclos lentos' },
      { name: 'Estiramiento de flexor de cadera (media rodilla)', detail: '45 s por lado' },
      { name: 'Estiramiento de isquios con cadera en bisagra', detail: '45 s por lado' },
      { name: 'Estiramiento de pecho en el marco de la puerta', detail: '45 s por lado' },
      { name: 'Sostenido 90/90 de cadera', detail: '45 s por lado' },
      { name: 'Estiramiento de gemelo contra la pared', detail: '45 s por lado' },
    ],
  },
};

const COPY: Record<Locale, Record<WarmupId, WarmupCopy>> = { en: EN, es: ES };

const isSeeded = (id: string): id is WarmupId => (WARMUP_IDS as readonly string[]).includes(id);

/** Localized copy for a seeded routine; a user's own routine passes through. */
export const warmupCopy = (
  routine: { id: string; name: string; description: string | null; steps: WarmupStep[] },
  locale: Locale,
): WarmupCopy =>
  isSeeded(routine.id)
    ? COPY[locale][routine.id]
    : { name: routine.name, description: routine.description ?? '', steps: routine.steps };

/** The seed writes the EN copy as the neutral base (same rule as preset programs). */
export const warmupSeeds = () =>
  WARMUP_IDS.map((id, index) => ({
    id,
    kind: WARMUP_KIND[id],
    orderIndex: index,
    ...EN[id],
  }));
