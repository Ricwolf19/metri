import type { Locale } from '@/i18n';

/**
 * The pool metri's daily tips draw from — a content module, not an i18n dict:
 * these are editorial copy that rotates, not UI labels (same split as
 * `features/docs/content` and `exercise-content.ts`).
 *
 * Voice: metri's own — agnostic, concrete, no coach or brand names, no
 * promises. One idea per tip, readable on a lock screen.
 *
 * The rotation is deterministic (slot × weekday), so a week of notifications
 * never repeats a tip. That needs one entry per (slot, weekday) pair at the
 * highest frequency: keep both pools at `max(TIP_FREQUENCIES) × 7` entries or
 * more, which `tips.test.ts` enforces.
 */
export type Tip = { title: string; body: string };

const EN: Tip[] = [
  {
    title: 'Progression beats intensity',
    body: 'Adding a rep or a small plate over time drives more growth than going all-out on one session.',
  },
  {
    title: 'Log the set you actually did',
    body: 'A missed rep is data, not a failure. Honest numbers are what make next week’s plan work.',
  },
  {
    title: 'Rest is part of the set',
    body: 'Cutting rest short lowers the load you can handle. On heavy compounds, take the full 2–3 minutes.',
  },
  {
    title: 'RIR keeps you honest',
    body: 'RIR 2 means you could have done two more reps with clean form — not two more at any cost.',
  },
  {
    title: 'Warm up the movement, not just the body',
    body: 'Two or three ramping sets on the first exercise prepare the joints and the technique at once.',
  },
  {
    title: 'Protein is a daily total',
    body: 'Spreading it across meals is easier than chasing a perfect window after training.',
  },
  {
    title: 'Sleep is the cheapest recovery',
    body: 'Most of the adaptation happens while you sleep. Short nights show up as missed reps.',
  },
  {
    title: 'Technique before load',
    body: 'If the range of motion shortens as weight goes up, the extra plate is not training the muscle.',
  },
  {
    title: 'Track bodyweight as a trend',
    body: 'Day-to-day swings are water and food. The weekly average is the number worth reading.',
  },
  {
    title: 'A missed day is just a day',
    body: 'Consistency is the sum of months. Restart on the next scheduled split, not on Monday.',
  },
  {
    title: 'Same bar path, same result',
    body: 'Repeat the setup — grip width, bench angle, seat height — so the numbers compare week to week.',
  },
  {
    title: 'Hydration moves the bar too',
    body: 'A couple of percent down on fluids is enough to make a normal session feel heavy.',
  },
  {
    title: 'Not every set needs to hurt',
    body: 'Back-off sets exist to add quality volume once the top set has done the hard work.',
  },
  {
    title: 'Soreness is not a score',
    body: 'It tracks novelty more than progress. The logbook tells you whether the work landed.',
  },
  {
    title: 'Change one thing at a time',
    body: 'Swapping exercise, load and rest at once leaves you with no idea what worked.',
  },
  {
    title: 'Deload on purpose',
    body: 'Planned easy weeks let fatigue drain while the skill stays. They buy the next hard block.',
  },
  {
    title: 'Control the way down',
    body: 'The lowering half builds as much as the lift. Rushing it gives away free reps.',
  },
  {
    title: 'Breathe and brace',
    body: 'Air in, ribs down, brace as if about to be pushed — that is what keeps the spine neutral.',
  },
  {
    title: 'Small plates are still progress',
    body: 'Going up 1–2 kg is how a lift keeps moving once the fast beginner gains are gone.',
  },
  {
    title: 'Train the weak link',
    body: 'The muscle you avoid is usually the one capping the lift you care about.',
  },
  {
    title: 'Finish the session you planned',
    body: 'The last exercise of the day counts the same as the first — and it is the one most often skipped.',
  },
  {
    title: 'Range of motion is free volume',
    body: 'A full stretch under load trains more muscle than a heavier partial rep.',
  },
  {
    title: 'Water before the last set',
    body: 'Even mild dehydration costs reps on long sessions. Sip through the workout, not after.',
  },
  {
    title: 'Two hard sets beat five easy ones',
    body: 'Sets taken close to failure drive the adaptation. Junk volume only adds fatigue.',
  },
  {
    title: 'Warm up the heavy lift, not the whole gym',
    body: 'Ramp the first compound of the day. The rest of the session is already warm.',
  },
  {
    title: 'Your plan survives a bad day',
    body: 'Lower the load, keep the sets, log it. A reduced session still counts as a session.',
  },
  {
    title: 'Grip fails before the back does',
    body: 'On heavy pulls, straps let the target muscle finish the set instead of your hands.',
  },
  {
    title: 'Compare weeks, not sessions',
    body: 'One flat workout means little. The week-over-week line is the one that tells the story.',
  },
];

const ES: Tip[] = [
  {
    title: 'La progresión gana a la intensidad',
    body: 'Sumar una rep o un disco pequeño con el tiempo construye más que reventarte en una sesión.',
  },
  {
    title: 'Registra la serie que hiciste',
    body: 'Una rep perdida es dato, no fracaso. Con números honestos el plan de la próxima semana funciona.',
  },
  {
    title: 'El descanso es parte de la serie',
    body: 'Recortarlo baja la carga que puedes mover. En básicos pesados, toma los 2–3 minutos completos.',
  },
  {
    title: 'El RIR te mantiene honesto',
    body: 'RIR 2 es que podías hacer dos reps más con técnica limpia — no dos más como sea.',
  },
  {
    title: 'Calienta el movimiento, no solo el cuerpo',
    body: 'Dos o tres series progresivas en el primer ejercicio preparan articulaciones y técnica a la vez.',
  },
  {
    title: 'La proteína es un total diario',
    body: 'Repartirla entre comidas es más fácil que perseguir la ventana perfecta después de entrenar.',
  },
  {
    title: 'Dormir es la recuperación más barata',
    body: 'La adaptación ocurre mientras duermes. Las noches cortas aparecen como reps que no salen.',
  },
  {
    title: 'Técnica antes que carga',
    body: 'Si el rango se acorta cuando sube el peso, ese disco extra no está entrenando el músculo.',
  },
  {
    title: 'Sigue el peso como tendencia',
    body: 'Las variaciones del día son agua y comida. El promedio semanal es el número que vale leer.',
  },
  {
    title: 'Un día perdido es solo un día',
    body: 'La constancia es la suma de meses. Retoma en el siguiente split, no el lunes.',
  },
  {
    title: 'Mismo setup, mismo resultado',
    body: 'Repite agarre, ángulo del banco y altura del asiento para que los números se puedan comparar.',
  },
  {
    title: 'La hidratación también mueve la barra',
    body: 'Un par de puntos porcentuales de menos bastan para que una sesión normal se sienta pesada.',
  },
  {
    title: 'No toda serie tiene que doler',
    body: 'Las series de back-off existen para sumar volumen de calidad tras la serie top.',
  },
  {
    title: 'Las agujetas no son una nota',
    body: 'Miden novedad más que progreso. El registro te dice si el trabajo sirvió.',
  },
  {
    title: 'Cambia una cosa a la vez',
    body: 'Si cambias ejercicio, carga y descanso juntos, no sabrás qué fue lo que funcionó.',
  },
  {
    title: 'Descarga a propósito',
    body: 'Las semanas suaves planeadas drenan la fatiga y conservan la técnica. Pagan el siguiente bloque.',
  },
  {
    title: 'Controla la bajada',
    body: 'La fase excéntrica construye tanto como subir. Dejarla caer regala reps gratis.',
  },
  {
    title: 'Respira y aprieta',
    body: 'Aire dentro, costillas abajo, aprieta como si fueran a empujarte: así la espalda se mantiene neutra.',
  },
  {
    title: 'Los discos pequeños también son progreso',
    body: 'Subir 1–2 kg es como un levantamiento sigue avanzando cuando se acaban las ganancias rápidas.',
  },
  {
    title: 'Entrena el eslabón débil',
    body: 'El músculo que evitas suele ser el que limita el levantamiento que te importa.',
  },
  {
    title: 'Termina la sesión que planeaste',
    body: 'El último ejercicio cuenta igual que el primero — y es el que más veces se salta.',
  },
  {
    title: 'El rango completo es volumen gratis',
    body: 'Un estiramiento completo bajo carga entrena más músculo que una repetición parcial más pesada.',
  },
  {
    title: 'Agua antes de la última serie',
    body: 'Una deshidratación leve ya cuesta repeticiones en sesiones largas. Bebe durante, no al final.',
  },
  {
    title: 'Dos series duras valen más que cinco suaves',
    body: 'Las series cerca del fallo provocan la adaptación. El volumen de relleno solo suma fatiga.',
  },
  {
    title: 'Calienta el levantamiento pesado, no todo el gimnasio',
    body: 'Haz las series de aproximación en el primer básico. El resto de la sesión ya llega caliente.',
  },
  {
    title: 'Tu plan sobrevive a un mal día',
    body: 'Baja la carga, mantén las series y regístralo. Una sesión reducida sigue contando.',
  },
  {
    title: 'El agarre falla antes que la espalda',
    body: 'En tirones pesados, las cinchas dejan que termine la serie el músculo objetivo y no las manos.',
  },
  {
    title: 'Compara semanas, no sesiones',
    body: 'Un entrenamiento plano dice poco. La línea de semana a semana es la que cuenta la historia.',
  },
];

const POOL: Record<Locale, Tip[]> = { en: EN, es: ES };

/** Stable pick: slot × weekday never repeats inside a week. */
export const tipFor = (locale: Locale, slot: number, weekday: number): Tip => {
  const pool = POOL[locale] ?? EN;
  return pool[(slot * 7 + (weekday - 1)) % pool.length];
};

/**
 * When the day's tips land. Spread across waking hours, and the same slot keeps
 * its hour as the count changes so the rhythm stays recognizable.
 */
export const TIP_SLOTS: Record<number, { hour: number; minute: number }[]> = {
  1: [{ hour: 10, minute: 0 }],
  2: [
    { hour: 10, minute: 0 },
    { hour: 19, minute: 0 },
  ],
  3: [
    { hour: 9, minute: 0 },
    { hour: 14, minute: 0 },
    { hour: 20, minute: 0 },
  ],
  4: [
    { hour: 8, minute: 0 },
    { hour: 12, minute: 0 },
    { hour: 16, minute: 0 },
    { hour: 20, minute: 30 },
  ],
};

export const TIP_FREQUENCIES = [1, 2, 3, 4];
