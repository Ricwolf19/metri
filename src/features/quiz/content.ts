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
  },
];
