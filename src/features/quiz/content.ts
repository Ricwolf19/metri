import type { QuizArea } from './areas';

/**
 * The knowledge quiz bank: one question per (area, level), bilingual copy
 * beside the data (content-module convention — these are not UI strings).
 * Levels run basic (1) → pro (4); `answer` is the index into `options`.
 */

type Localized = { en: string; es: string };

export type QuizQuestion = {
  area: QuizArea;
  level: 1 | 2 | 3 | 4;
  prompt: Localized;
  options: Localized[];
  answer: number;
  why: Localized;
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    area: 'nutrition',
    level: 1,
    prompt: { en: 'What is a calorie?', es: '¿Qué es una caloría?' },
    options: [
      { en: 'A unit of energy', es: 'Una unidad de energía' },
      { en: 'A type of fat cell', es: 'Un tipo de célula grasa' },
      { en: 'A vitamin', es: 'Una vitamina' },
      { en: 'A sugar molecule', es: 'Una molécula de azúcar' },
    ],
    answer: 0,
    why: {
      en: 'A calorie is the energy needed to warm 1 g of water by 1 °C; food labels count kilocalories. It measures energy, not a substance in the food.',
      es: 'Una caloría es la energía necesaria para calentar 1 g de agua 1 °C; las etiquetas cuentan kilocalorías. Mide energía, no una sustancia del alimento.',
    },
  },
  {
    area: 'nutrition',
    level: 2,
    prompt: {
      en: 'About how much protein per kg of body weight suits most lifters?',
      es: '¿Cuánta proteína por kg de peso le va bien a la mayoría que entrena?',
    },
    options: [
      { en: '0.3 g/kg', es: '0,3 g/kg' },
      { en: '1.6 g/kg', es: '1,6 g/kg' },
      { en: '6 g/kg', es: '6 g/kg' },
      { en: 'Protein does not matter', es: 'La proteína no importa' },
    ],
    answer: 1,
    why: {
      en: 'Around 1.6 g/kg a day covers muscle gain for most lifters; more rarely adds anything, and far less leaves recovery short.',
      es: 'Alrededor de 1,6 g/kg al día cubre la ganancia muscular de la mayoría; más rara vez suma algo y mucho menos se queda corto para recuperarse.',
    },
  },
  {
    area: 'nutrition',
    level: 3,
    prompt: {
      en: 'Carbohydrates are stored in muscle mainly as…',
      es: 'Los carbohidratos se almacenan en el músculo principalmente como…',
    },
    options: [
      { en: 'Amino acids', es: 'Aminoácidos' },
      { en: 'Ketone bodies', es: 'Cuerpos cetónicos' },
      { en: 'Glycogen', es: 'Glucógeno' },
      { en: 'Triglycerides', es: 'Triglicéridos' },
    ],
    answer: 2,
    why: {
      en: 'Muscle stores carbohydrate as glycogen, a chain of glucose it burns quickly during hard sets. Triglycerides are how fat is stored.',
      es: 'El músculo guarda los carbohidratos como glucógeno, una cadena de glucosa que quema rápido en series intensas. Los triglicéridos son la reserva de grasa.',
    },
  },
  {
    area: 'nutrition',
    level: 4,
    prompt: {
      en: '"Energy availability" measures…',
      es: 'La "disponibilidad de energía" mide…',
    },
    options: [
      { en: 'Calories eaten in a day', es: 'Las calorías comidas en un día' },
      {
        en: 'Energy left after training, relative to lean mass',
        es: 'La energía que queda tras entrenar, respecto a la masa magra',
      },
      { en: 'How awake you feel', es: 'Qué despierto te sientes' },
      { en: 'The glycemic index of a meal', es: 'El índice glucémico de una comida' },
    ],
    answer: 1,
    why: {
      en: 'Energy availability is intake minus training expenditure, per kg of lean mass. Too low for too long and recovery, hormones and performance suffer.',
      es: 'La disponibilidad energética es lo que comes menos lo que gastas entrenando, por kg de masa magra. Si queda baja mucho tiempo, sufren la recuperación, las hormonas y el rendimiento.',
    },
  },
  {
    area: 'training',
    level: 1,
    prompt: { en: 'In the gym, a "set" is…', es: 'En el gimnasio, una "serie" es…' },
    options: [
      { en: 'A group of reps before resting', es: 'Un grupo de repeticiones antes de descansar' },
      { en: 'A week of workouts', es: 'Una semana de entrenamientos' },
      { en: 'A machine setting', es: 'Un ajuste de máquina' },
      { en: 'A warm-up stretch', es: 'Un estiramiento de calentamiento' },
    ],
    answer: 0,
    why: {
      en: 'A set is a run of consecutive reps followed by rest. Programs count work in sets, so the set is the basic unit of training volume.',
      es: 'Una serie es un bloque de repeticiones seguidas antes de descansar. Los programas cuentan el trabajo en series: es la unidad básica del volumen.',
    },
  },
  {
    area: 'training',
    level: 2,
    prompt: { en: '"RIR 2" on a set means…', es: '"RIR 2" en una serie significa…' },
    options: [
      { en: '2 reps done', es: '2 repeticiones hechas' },
      { en: '2 reps left in reserve', es: '2 repeticiones en reserva' },
      { en: 'Rest 2 minutes', es: 'Descansar 2 minutos' },
      { en: '2 exercises combined', es: '2 ejercicios combinados' },
    ],
    answer: 1,
    why: {
      en: 'RIR means reps in reserve: stopping at RIR 2 leaves two clean reps you could still have done. It lets you set effort without going to failure.',
      es: 'RIR son las repeticiones en reserva: parar en RIR 2 deja dos repeticiones limpias que aún podías hacer. Permite fijar el esfuerzo sin llegar al fallo.',
    },
  },
  {
    area: 'training',
    level: 3,
    prompt: {
      en: 'Progressive overload is…',
      es: 'La sobrecarga progresiva es…',
    },
    options: [
      { en: 'Switching programs every week', es: 'Cambiar de rutina cada semana' },
      { en: 'Training to failure every set', es: 'Llegar al fallo en cada serie' },
      {
        en: 'Gradually increasing the demand over time',
        es: 'Aumentar la demanda poco a poco con el tiempo',
      },
      { en: 'Deloading every session', es: 'Hacer descarga en cada sesión' },
    ],
    answer: 2,
    why: {
      en: 'The body adapts to what it is asked to do, so the demand has to rise over time: more load, more reps or more sets, a little at a time.',
      es: 'El cuerpo se adapta a lo que se le pide, así que la exigencia tiene que subir con el tiempo: más carga, más repeticiones o más series, poco a poco.',
    },
  },
  {
    area: 'training',
    level: 4,
    prompt: {
      en: 'Why do submaximal sets estimate 1RM more reliably than very high-rep sets?',
      es: '¿Por qué las series submáximas estiman el 1RM mejor que las de muchas repeticiones?',
    },
    options: [
      {
        en: 'High-rep sets fatigue technique before strength',
        es: 'En las series largas la técnica se fatiga antes que la fuerza',
      },
      { en: 'High reps build no strength', es: 'Las repeticiones altas no dan fuerza' },
      { en: '1RM math only works below 5 reps', es: 'El cálculo del 1RM solo sirve bajo 5 repes' },
      {
        en: 'They do not — both are equally reliable',
        es: 'No es así: ambas son igual de fiables',
      },
    ],
    answer: 0,
    why: {
      en: 'Long sets end when breathing and technique give out, not strength, so the estimate drifts. Sets of about 3–8 reps near failure track 1RM more closely.',
      es: 'Las series largas terminan cuando fallan el aire y la técnica, no la fuerza, así que la estimación se desvía. Series de unas 3–8 repeticiones cerca del fallo siguen mejor el 1RM.',
    },
  },
  {
    area: 'body',
    level: 1,
    prompt: { en: 'BMI is calculated from…', es: 'El IMC se calcula con…' },
    options: [
      { en: 'Weight and height', es: 'Peso y altura' },
      { en: 'Body fat and muscle', es: 'Grasa y músculo' },
      { en: 'Waist and neck', es: 'Cintura y cuello' },
      { en: 'Age and sex only', es: 'Solo edad y sexo' },
    ],
    answer: 0,
    why: {
      en: 'BMI is weight in kg divided by height in metres squared. It ignores body composition, so a muscular lifter can read as overweight.',
      es: 'El IMC es el peso en kg dividido entre la altura en metros al cuadrado. Ignora la composición corporal: alguien musculoso puede salir con sobrepeso.',
    },
  },
  {
    area: 'body',
    level: 2,
    prompt: {
      en: 'A growing waist mostly tracks…',
      es: 'Una cintura creciente sobre todo refleja…',
    },
    options: [
      { en: 'Bone density', es: 'Densidad ósea' },
      { en: 'Abdominal fat gain', es: 'Ganancia de grasa abdominal' },
      { en: 'Muscle in the arms', es: 'Músculo en los brazos' },
      { en: 'Water in the skin', es: 'Agua en la piel' },
    ],
    answer: 1,
    why: {
      en: 'Most of what the waist gains or loses is abdominal fat, which is why the tape at the waist is a useful check alongside the scale.',
      es: 'Casi todo lo que gana o pierde la cintura es grasa abdominal; por eso la cinta en la cintura es un buen control junto a la báscula.',
    },
  },
  {
    area: 'body',
    level: 3,
    prompt: {
      en: 'The Navy method estimates body fat from…',
      es: 'El método Navy estima la grasa corporal con…',
    },
    options: [
      { en: 'A skinfold caliper only', es: 'Solo un pliegue cutáneo' },
      { en: 'An electrical impedance scan', es: 'Un escáner de impedancia eléctrica' },
      { en: 'A blood test', es: 'Un análisis de sangre' },
      {
        en: 'Tape measurements (height, neck, waist…)',
        es: 'Medidas con cinta (altura, cuello, cintura…)',
      },
    ],
    answer: 3,
    why: {
      en: 'The Navy method estimates body fat from height and tape circumferences (neck and waist, plus hips for women). No caliper, scan or blood test involved.',
      es: 'El método Navy estima la grasa con la altura y medidas de cinta (cuello y cintura, más cadera en mujeres). Sin plicómetro, escáner ni análisis de sangre.',
    },
  },
  {
    area: 'body',
    level: 4,
    prompt: {
      en: 'Why can the scale go up while fat goes down?',
      es: '¿Por qué puede subir la báscula mientras baja la grasa?',
    },
    options: [
      { en: 'It cannot — the scale is exact', es: 'No puede: la báscula es exacta' },
      {
        en: 'Muscle and stored fuel add non-fat weight (water, glycogen)',
        es: 'El músculo y el combustible almacenado añaden peso que no es grasa (agua, glucógeno)',
      },
      { en: 'Fat always weighs more than muscle', es: 'La grasa siempre pesa más que el músculo' },
      { en: 'Scales drift upward over time', es: 'Las básculas suben solas con el tiempo' },
    ],
    answer: 1,
    why: {
      en: 'New muscle, stored glycogen and the water it holds all weigh something. The scale can rise while fat falls, which is why the waist is read alongside it.',
      es: 'El músculo nuevo, el glucógeno y el agua que retiene también pesan. La báscula puede subir mientras la grasa baja; por eso se lee junto a la cintura.',
    },
  },
  {
    area: 'fundamentals',
    level: 1,
    prompt: { en: 'The point of a warm-up is to…', es: 'El objetivo del calentamiento es…' },
    options: [
      { en: 'Burn calories', es: 'Quemar calorías' },
      {
        en: 'Prepare tissues and the nervous system',
        es: 'Preparar los tejidos y el sistema nervioso',
      },
      { en: 'Stretch every muscle to the max', es: 'Estirar cada músculo al máximo' },
      { en: 'Make you sweat', es: 'Hacerte sudar' },
    ],
    answer: 1,
    why: {
      en: 'A warm-up raises tissue temperature and primes the nervous system for the loads ahead. Burning calories or stretching to the limit is not the goal.',
      es: 'El calentamiento sube la temperatura de los tejidos y prepara al sistema nervioso para las cargas que vienen. Quemar calorías o estirar al máximo no es el objetivo.',
    },
  },
  {
    area: 'fundamentals',
    level: 2,
    prompt: {
      en: 'DOMS — delayed onset muscle soreness — comes from…',
      es: 'El DOMS — dolor muscular de aparición tardía — viene de…',
    },
    options: [
      { en: 'Lactic acid stuck in the muscle', es: 'Ácido láctico atrapado en el músculo' },
      {
        en: 'Unaccustomed loading the body is not used to',
        es: 'Un esfuerzo al que el cuerpo no está acostumbrado',
      },
      { en: 'Not enough stretching after', es: 'No estirar después' },
      { en: 'A pulled muscle', es: 'Una distensión muscular' },
    ],
    answer: 1,
    why: {
      en: 'DOMS follows loading the body is not used to, especially lowering phases. Lactic acid clears within an hour, so it cannot explain soreness days later.',
      es: 'Las agujetas aparecen tras cargas a las que el cuerpo no está acostumbrado, sobre todo en la fase de bajada. El ácido láctico se elimina en una hora; no explica el dolor días después.',
    },
  },
  {
    area: 'fundamentals',
    level: 3,
    prompt: {
      en: '"Training to failure" means…',
      es: '"Entrenar al fallo" significa…',
    },
    options: [
      { en: 'Training until sick', es: 'Entrenar hasta marearte' },
      {
        en: 'No more reps possible with good form',
        es: 'No puedes hacer más repeticiones con buena técnica',
      },
      { en: 'Skipping the warm-up', es: 'Saltarte el calentamiento' },
      { en: 'Finishing the program', es: 'Terminar la rutina' },
    ],
    answer: 1,
    why: {
      en: 'Failure is the rep you cannot complete with good form. It is RIR 0: useful now and then, costly in fatigue if every set goes there.',
      es: 'El fallo es la repetición que ya no puedes completar con buena técnica. Es RIR 0: útil de vez en cuando, caro en fatiga si todas las series llegan ahí.',
    },
  },
  {
    area: 'fundamentals',
    level: 4,
    prompt: {
      en: 'Why do deloads (easier weeks) exist?',
      es: '¿Por qué existen las semanas de descarga?',
    },
    options: [
      { en: 'To learn new exercises', es: 'Para aprender ejercicios nuevos' },
      {
        en: 'Because muscles need a week of rest',
        es: 'Porque los músculos necesitan una semana de descanso',
      },
      {
        en: 'Fatigue fades faster than fitness, so capacity rebounds',
        es: 'La fatiga se disipa antes que la forma, así la capacidad se recupera',
      },
      { en: 'They are only for beginners', es: 'Son solo para principiantes' },
    ],
    answer: 2,
    why: {
      en: 'Fatigue builds and fades faster than fitness. An easier week lets it clear while the fitness stays, so performance rebounds afterwards.',
      es: 'La fatiga se acumula y se disipa más rápido que la forma física. Una semana más ligera la deja bajar mientras la forma se mantiene, y el rendimiento repunta después.',
    },
  },
];
