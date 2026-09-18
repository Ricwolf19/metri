import type { Locale } from '@/i18n';

/**
 * Bilingual catalog content. Lives as a content module (CALC_CONTENT pattern),
 * NOT in the i18n dictionaries — these are multi-KB documents and the en/es
 * parity gate should not carry them.
 *
 * `EXERCISE_NAMES` covers every seeded id; `EXERCISE_CONTENT` the exercises
 * with curated technique cues (support movements ship name-only).
 */

export type ExerciseContent = {
  /** One-line TL;DR — the single most important cue. */
  summary: string;
  setup?: string[];
  execution: string[];
  mistakes: string[];
  notes?: string[];
};

export const EXERCISE_NAMES: Record<string, Record<Locale, string>> = {
  // Documented library
  'barbell-back-squat': { es: 'Sentadilla libre', en: 'Squat' },
  'barbell-bench-press': { es: 'Press banca', en: 'Bench Press' },
  'incline-bench-press': { es: 'Press banca inclinado', en: 'Incline Bench Press' },
  'close-grip-bench-press': {
    es: 'Press banca agarre cerrado',
    en: 'Close-Grip Bench Press',
  },
  deadlift: { es: 'Peso muerto convencional', en: 'Conventional Deadlift' },
  'sumo-deadlift': { es: 'Peso muerto sumo', en: 'Sumo Deadlift' },
  'romanian-deadlift': { es: 'Peso muerto rumano', en: 'Romanian Deadlift' },
  'overhead-press': { es: 'Press militar con barra', en: 'Barbell Overhead Press' },
  'seated-dumbbell-press': {
    es: 'Press militar con mancuernas',
    en: 'Dumbbell Overhead Press',
  },
  'lat-pulldown': { es: 'Jalones en polea', en: 'Lat Pulldown' },
  'leg-press': { es: 'Prensa de piernas', en: 'Leg Press' },
  'leg-extension': { es: 'Extensión de cuádriceps', en: 'Leg Extension' },
  'lying-leg-curl': { es: 'Curl femoral', en: 'Leg Curl' },
  'barbell-curl': { es: 'Curl de bíceps con barra', en: 'Barbell Bicep Curl' },
  'hammer-curl': { es: 'Curl martillo', en: 'Hammer Curl' },
  skullcrusher: { es: 'Rompecráneos con mancuernas', en: 'Dumbbell Skullcrusher' },
  'back-extension': { es: 'Extensiones lumbares', en: 'Back Extension' },
  crunch: { es: 'Abdominales', en: 'Crunch' },
  'standing-calf-raise': { es: 'Gemelos', en: 'Calf Raise' },
  // Support movements (preset tables)
  'machine-chest-press': { es: 'Chest press en máquina', en: 'Machine Chest Press' },
  'dumbbell-fly': { es: 'Aperturas con mancuernas', en: 'Dumbbell Fly' },
  'cable-fly': { es: 'Aperturas en polea', en: 'Cable Fly' },
  'lateral-raise': { es: 'Elevaciones laterales', en: 'Lateral Raise' },
  'cable-lateral-raise': {
    es: 'Elevaciones laterales en polea',
    en: 'Cable Lateral Raise',
  },
  'rear-delt-fly': { es: 'Hombro posterior', en: 'Rear Delt Fly' },
  'machine-shoulder-press': {
    es: 'Press militar en máquina',
    en: 'Machine Shoulder Press',
  },
  pullover: { es: 'Pullover', en: 'Pullover' },
  'machine-row': { es: 'Remo en máquina', en: 'Machine Row' },
  'dumbbell-row': { es: 'Remo con mancuernas', en: 'Dumbbell Row' },
  'seated-cable-row': { es: 'Remo Gironda', en: 'Seated Cable Row' },
  't-bar-row': { es: 'Remo T', en: 'T-Bar Row' },
  'hack-squat': { es: 'Hack squat', en: 'Hack Squat' },
  'bulgarian-split-squat': { es: 'Sentadilla búlgara', en: 'Bulgarian Split Squat' },
  'preacher-curl': { es: 'Curl Scott', en: 'Preacher Curl' },
  'spider-curl': { es: 'Spider curl', en: 'Spider Curl' },
  'incline-dumbbell-curl': {
    es: 'Curl inclinado con mancuerna',
    en: 'Incline Dumbbell Curl',
  },
  'tricep-pushdown': { es: 'Extensiones de tríceps en polea', en: 'Tricep Pushdown' },
  'overhead-tricep-extension': {
    es: 'Tríceps tras nuca con mancuerna',
    en: 'Overhead Tricep Extension',
  },
  'cable-overhead-extension': {
    es: 'Tríceps tras nuca en polea',
    en: 'Cable Overhead Extension',
  },
  'french-press': { es: 'Press francés', en: 'French Press' },
  'cable-kickback': { es: 'Kickback en polea', en: 'Cable Kickback' },
};

/** Technique cues per exercise id. */
export const EXERCISE_CONTENT: Record<string, Record<Locale, ExerciseContent>> = {
  'barbell-back-squat': {
    es: {
      summary:
        'Sentadilla con barra libre. El cue más importante: escápulas juntas, pecho fuera y barra apoyada **sobre los trapecios** (nunca sobre la vértebra/cuello); antes de bajar, echa la cadera atrás ("sitting back") manteniendo la columna neutra.',
      setup: [
        '**Movilidad primero**: si el hombro te limita al colocarte debajo de la barra, haz antes la movilidad de hombros (y de piernas) de la plataforma para colocarte cómodo y sin que tire el hombro. Ver movilidad-dia-pierna.',
        '**Agarre**: ni muy ancho ni muy cerrado; un poquito más ancho que la anchura de los hombros. Si agarras demasiado cerrado no podrás juntar bien las escápulas.',
        '**Escápulas**: júntalas (retráelas) todo lo que puedas y saca el pecho. Así el torso se siente "como un bloque" y estás mucho más estable; además tendrás "más carne" donde apoyar la barra y dolerá menos.',
        '**Posición de la barra**: justo encima de los trapecios, **no** encima de una vértebra ni en el cuello.',
        '**Pies**: la anchura y la orientación de las puntas son individuales — busca la posición en la que te sientas más cómodo para bajar. Normalmente las puntas se abren un poco hacia los lados. A las personas altas (~1,90 m) les conviene una posición algo más abierta con las puntas mirando un poco hacia afuera; personas con fémur corto respecto al torso pueden bajar con el torso muy vertical. Que el torso baje más horizontal o más vertical depende de tus palancas/anatomía.',
        '**Calzado**: lo ideal son slippers de powerlifting (muy planos) o directamente descalzo, para estar lo más cerca posible del suelo y tener la máxima estabilidad.',
        '**Respiración**: en sentadilla (y peso muerto) se respira **con la barriga** (diafragma), no con el pecho como en el press de banca. Con cinturón: llena la barriga de aire pegándola contra el cinturón, aprieta sin soltar el aire (apnea), haz la repetición y suelta el aire arriba.',
      ],
      execution: [
        'Antes de empezar a bajar, haz el **"sitting back"**: echa la cadera un poco atrás. No es "sacar nalga" — es echar la cadera atrás manteniendo la posición neutra de la columna.',
        'Con la cadera atrás, empieza a bajar hasta donde puedas y sube.',
        '**Profundidad**: bajar hasta que el fémur esté paralelo al suelo es suficiente. Si por tu anatomía puedes bajar más de forma sencilla, puedes hacerlo; el mínimo es el paralelo.',
        'Secuencia resumida: manos un poco más anchas que los hombros → juntar escápulas → sacar pecho → barra sobre los trapecios → cadera atrás → bajar y subir.',
      ],
      mistakes: [
        '**Ponerse la barra en las vértebras/cuello**: es la razón de que "duelan las cervicales" y de que la gente use el colchoncito. La solución es colocarla sobre los trapecios con las escápulas juntas, no acolchar.',
        '**Calzado con tacón**: al bajar el talón se despega un poco y el peso se va hacia la punta del pie, con tendencia a irse hacia adelante. Descalzo esto puede mejorar.',
        '**Pies muy juntos**: impiden bajar porque la rodilla no puede adelantarse (falta dorsiflexión de tobillo).',
        '**"Sacar nalga"** en vez de echar la cadera atrás: pierdes la posición neutra de la columna.',
        '**Cambiar la posición de los pies entre sesiones**: unos días bajarás más y otros menos y no sabrás por qué. La progresión en cargas tiene que ser **a igualdad de técnica de ejecución**; grabarte constantemente te permite darte cuenta de si estás ejecutando diferente.',
      ],
    },
    en: {
      summary:
        'Squat with a free barbell. The most important cue: shoulder blades together, chest out and the bar resting **on top of the traps** (never on a vertebra/the neck); before descending, push your hips back ("sitting back") while keeping a neutral spine.',
      setup: [
        "**Mobility first**: if your shoulder limits you when getting under the bar, do the platform's shoulder (and leg) mobility work first so you can get in position comfortably and without the shoulder pulling. See mobility-leg-day.",
        "**Grip**: neither very wide nor very narrow; a little wider than shoulder width. If you grip too narrow you won't be able to bring your shoulder blades together properly.",
        '**Shoulder blades**: bring them together (retract them) as much as you can and push your chest out. That way the torso feels "like a block" and you\'re much more stable; you\'ll also have "more meat" to rest the bar on and it will hurt less.',
        '**Bar position**: right on top of the traps, **not** on a vertebra or on the neck.',
        '**Feet**: width and toe angle are individual — find the position where you feel most comfortable descending. Usually the toes point slightly out to the sides. Tall people (~1.90 m) do well with a somewhat wider stance with the toes pointing a bit more outward; people with a short femur relative to the torso can descend with a very upright torso. Whether the torso stays more horizontal or more vertical depends on your levers/anatomy.',
        '**Footwear**: ideally powerlifting slippers (very flat) or directly barefoot, to be as close to the ground as possible and have maximum stability.',
        '**Breathing**: in the squat (and deadlift) you breathe **with your belly** (diaphragm), not with your chest as in the bench press. With a belt: fill your belly with air pushing it against the belt, brace without letting the air out (breath hold), do the rep and release the air at the top.',
      ],
      execution: [
        'Before you start descending, do the **"sitting back"**: push your hips back a little. It\'s not "sticking your butt out" — it\'s pushing the hips back while keeping a neutral spine position.',
        'With the hips back, start descending as far as you can and come back up.',
        '**Depth**: descending until the femur is parallel to the floor is enough. If your anatomy lets you go lower easily, you can; the minimum is parallel.',
        'Summary sequence: hands a little wider than shoulders → bring shoulder blades together → chest out → bar on the traps → hips back → descend and come up.',
      ],
      mistakes: [
        '**Putting the bar on the vertebrae/neck**: this is the reason "the neck hurts" and why people use the foam pad. The solution is to place it on the traps with the shoulder blades together, not to add padding.',
        '**Heeled footwear**: as you descend, the heel lifts slightly and the weight shifts toward the toes, with a tendency to tip forward. Barefoot this can improve.',
        "**Feet too close together**: they prevent you from descending because the knee can't travel forward (lack of ankle dorsiflexion).",
        '**"Sticking your butt out"** instead of pushing the hips back: you lose the neutral spine position.',
        "**Changing your foot position between sessions**: some days you'll go lower and others less and you won't know why. Load progression must be **with identical execution technique**; filming yourself constantly lets you notice whether you're executing differently.",
      ],
    },
  },
  'barbell-bench-press': {
    es: {
      summary:
        'Press de banca para pecho. Lo más importante es la **estabilidad**: las escápulas son "los pies" de este ejercicio — júntalas y deprímelas buscando el pecho al cielo, y baja siempre con el **codo debajo de la barra**, con la barra viajando en diagonal a la altura de los pezones.',
      setup: [
        '**Escápulas = tus pies**: júntalas como si buscaras pellizcar una esquina/canto de una pared y proyecta el pecho hacia arriba todo lo que puedas. Esa posición se sostiene en todo momento.',
        '**Retracción + depresión escapular**: no solo juntar, también retraer y **deprimir** (bajar los hombros), buscando que el pecho vaya "al cielo". Visto de lado se busca ver la máxima cantidad de cuello (alargar el cuello, no encogerse). Es normal un ligero arqueo de la espalda — las curvas fisiológicas se exageran un poco para lograr la postura.',
        '**Puntos de apoyo**: glúteos, escápulas y pies (y las manos en la barra, si quieres verlo como cuatro).',
        '**Empuje de piernas (leg drive)**: apoyado en el banco, empuja el suelo con los pies "como si fueras a chutar un balón" o como en una extensión de piernas — **hacia adelante, no hacia arriba**, para que los glúteos no se despeguen. Esto deja el pecho aún más alto, rota los hombros hacia atrás y expone más el pecho.',
        '**Aprieta con todo el cuerpo**: apretar algo solo con la mano no es lo mismo que apretando todo el cuerpo a la vez — con el cuerpo en bloque tienes más capacidad de expresar fuerza.',
      ],
      execution: [
        '**Rotación de codos**: con la mano izquierda haz la intención de girar en contra de las agujas del reloj y con la derecha en dirección de las agujas del reloj (como si quisieras **doblar la barra**). Así los codos se meten un poco hacia adentro, más pegados al torso, y al bajar quedan **debajo de la barra**.',
        '**Trayectoria**: la barra sube y baja **en diagonal**, más o menos a la altura de los pezones. Los codos van siempre debajo de la barra.',
        '**Recorrido completo** hasta tocar el pecho. Busca la barra con el pecho en todo momento.',
        '**Respiración**: en el press de banca se respira **con el pecho** — llena el pecho de aire, aguántalo, baja, pausa, sube y tira el aire cuando la barra esté arriba.',
        'Si te cuesta controlar el peso, trabaja con **pausas de un segundo** abajo: pausa de un segundo, subes.',
      ],
      mistakes: [
        '**Bajar sin el codo debajo de la barra**: el peso se te va hacia adelante y gastas muchísima energía estabilizando, por lo que levantas menos.',
        '**Tirarse la barra prácticamente al cuello**: no; la barra va en diagonal a la altura de los pezones.',
        '**Hombro adelantado**: hay gente que entrena con el hombro totalmente adelantado y dice "tengo los hombros desarrollados pero el pecho no me crece" — puede que técnicamente no lo esté haciendo bien.',
        '**Tirar solo de brazos y pecho con el resto del cuerpo relajado**: hay que estar en bloque.',
        'Si llevas tiempo sin entrenar o pasas muchas horas en el escritorio, es normal sentirse tieso al principio; con repetición la postura mejora poco a poco.',
      ],
      notes: [
        'El truco para colocar el codo debajo de la barra: piensa en **girar las manos como si quisieras doblar la barra** (mano derecha en dirección de las agujas del reloj, izquierda al contrario). Una vez buscas doblar la barra, al bajar es mucho más fácil que el codo quede debajo.',
      ],
    },
    en: {
      summary:
        'Bench press for chest. The most important thing is **stability**: the shoulder blades are "your feet" in this exercise — bring them together and depress them aiming your chest at the sky, and always lower with the **elbow under the bar**, with the bar traveling diagonally at nipple height.',
      setup: [
        '**Shoulder blades = your feet**: bring them together as if you were trying to pinch the corner/edge of a wall and project your chest upward as much as you can. That position is held at all times.',
        '**Scapular retraction + depression**: not just bringing them together, also retracting and **depressing** them (lowering the shoulders), aiming for the chest to go "to the sky". Seen from the side, you want to show the maximum amount of neck (lengthen the neck, don\'t hunch). A slight arch of the back is normal — the physiological curves are exaggerated a bit to achieve the posture.',
        '**Contact points**: glutes, shoulder blades and feet (and the hands on the bar, if you want to count it as four).',
        '**Leg drive**: supported on the bench, push the floor with your feet "as if you were about to kick a ball" or like in a leg extension — **forward, not upward**, so your glutes don\'t come off the bench. This leaves the chest even higher, rotates the shoulders back and exposes the chest more.',
        '**Squeeze with your whole body**: gripping something with just the hand is not the same as squeezing with the whole body at once — with the body as one block you can express more force.',
      ],
      execution: [
        '**Elbow rotation**: with your left hand, intend to turn counterclockwise and with your right hand clockwise (as if you wanted to **bend the bar**). That way the elbows tuck in a little, closer to the torso, and on the way down they end up **under the bar**.',
        '**Bar path**: the bar goes up and down **diagonally**, roughly at nipple height. The elbows always stay under the bar.',
        '**Full range of motion** down to touching the chest. Reach for the bar with your chest at all times.',
        '**Breathing**: in the bench press you breathe **with your chest** — fill your chest with air, hold it, lower, pause, press up and blow the air out when the bar is at the top.',
        'If you struggle to control the weight, work with **one-second pauses** at the bottom: one-second pause, then press up.',
      ],
      mistakes: [
        '**Lowering without the elbow under the bar**: the weight drifts forward and you spend a huge amount of energy stabilizing, so you lift less.',
        '**Bringing the bar practically to your neck**: no; the bar travels diagonally at nipple height.',
        '**Shoulder pushed forward**: some people train with the shoulder completely forward and say "my shoulders are developed but my chest won\'t grow" — maybe they\'re technically not doing it right.',
        '**Pulling only with arms and chest while the rest of the body is relaxed**: you have to be one solid block.',
        "If you haven't trained in a while or you spend many hours at a desk, it's normal to feel stiff at first; with repetition the posture gradually improves.",
      ],
      notes: [
        "The trick to placing the elbow under the bar: think about **turning your hands as if you wanted to bend the bar** (right hand clockwise, left hand the opposite way). Once you try to bend the bar, it's much easier for the elbow to end up underneath on the way down.",
      ],
    },
  },
  'incline-bench-press': {
    es: {
      summary:
        'Press inclinado para trabajar la parte alta del pecho. Se ejecuta igual que cualquier otro press: escápulas juntas, pecho sacado, barra que viaja **en diagonal a la altura de los pezones** y **codo debajo de la barra** en todo momento.',
      setup: [
        'Juntar un poquito las escápulas (igual que en el resto de preses) y **sacar pecho sin exagerar**.',
        'Agarrar la barra a la anchura que te resulte más o menos cómoda.',
        'Empujar un poquito los pies para mantener el pecho elevado.',
        'La postura buscada: pecho bastante hacia arriba, expuesto, y hombros un poquito "escondidos".',
      ],
      execution: [
        'Llevar la barra más o menos **a la altura de los pezones** y subir.',
        'La barra **sube y baja en diagonal**.',
        'El **codo tiene que estar más o menos debajo de la barra**.',
        'Al bajar: hombro, codo y muñeca están **en línea**, y codo y barra deberían estar en línea. Desde ahí, subir.',
      ],
      mistakes: [],
    },
    en: {
      summary:
        "Incline press to work the upper chest. It's executed just like any other press: shoulder blades together, chest out, bar traveling **diagonally at nipple height** and **elbow under the bar** at all times.",
      setup: [
        'Bring the shoulder blades together a little (same as in all the other presses) and **push the chest out without exaggerating**.',
        'Grip the bar at the width that feels more or less comfortable to you.',
        'Push a little with your feet to keep the chest elevated.',
        'The posture you\'re after: chest fairly high, exposed, and shoulders a little "hidden".',
      ],
      execution: [
        'Bring the bar more or less **to nipple height** and press up.',
        'The bar **goes up and down diagonally**.',
        'The **elbow has to be more or less under the bar**.',
        'On the way down: shoulder, elbow and wrist are **in line**, and elbow and bar should be in line. From there, press up.',
      ],
      mistakes: [],
    },
  },
  'close-grip-bench-press': {
    es: {
      summary:
        'Variante del press de banca con agarre mucho más estrecho, enfocada en el **tríceps**. Cue principal: al bajar, los **codos quedan pegados al cuerpo** y el codo se flexiona mucho más.',
      setup: [
        'La posición es **igual que en todos los preses**: juntar las escápulas, sacar pecho y empujar un poquito los pies para tener el pecho lo más expuesto posible arriba.',
        '**Agarre**: bastante más estrecho que en el press de banca normal — un poquito más ancho que la anchura de los hombros, un pelín.',
      ],
      execution: [
        'Bajar llevando la barra **a la parte baja del pecho** más o menos, y subir.',
        'Al bajar, los **codos quedan pegados al cuerpo** (en el press banca normal no quedan tan pegados).',
        'Buscar una **muy buena flexión de codo** para que trabaje más el tríceps.',
      ],
      mistakes: [],
      notes: [
        'Al estar el agarre mucho más estrecho, el codo se flexiona mucho más y, por tanto, **trabaja mucho más el tríceps**: es un ejercicio enfocado en el tríceps.',
      ],
    },
    en: {
      summary:
        'Bench press variant with a much narrower grip, focused on the **triceps**. Main cue: on the way down, the **elbows stay close to the body** and the elbow flexes much more.',
      setup: [
        'The position is **the same as in all the presses**: bring the shoulder blades together, chest out and push a little with your feet so the chest is as exposed as possible up top.',
        '**Grip**: considerably narrower than in the normal bench press — a little wider than shoulder width, just a touch.',
      ],
      execution: [
        'Lower the bar **to the lower part of the chest** more or less, and press up.',
        "On the way down, the **elbows stay close to the body** (in the normal bench press they don't stay as close).",
        'Look for a **very good elbow flexion** so the triceps works more.',
      ],
      mistakes: [],
      notes: [
        "With the grip much narrower, the elbow flexes much more and therefore **the triceps works much more**: it's an exercise focused on the triceps.",
      ],
    },
  },
  deadlift: {
    es: {
      summary:
        'Peso muerto clásico/convencional. Cue principal: saca pecho, saca nalga, **tensa la barra** (haz un poco de fuerza sin que se despegue del suelo) y luego **empuja el suelo con los pies** — es empujar, no tirar.',
      setup: [
        'La barra tiene que estar **totalmente pegada a la espinilla** antes de despegar del suelo.',
        'Abajo, antes de empezar a subir: **saca nalga y saca pecho** para tener la **espalda neutra**, y mantén esa posición.',
        'Rota los codos un poco hacia adentro, sacando pecho, buscando pegar la barra a la espinilla.',
        'El hombro queda **un poquito adelantado sobre la barra**.',
        '**Calzado**: hazlo **descalzo o con un zapato completamente plano** (tipo Converse o slipper de powerlifting). Un calzado con "taco" deja la barra más lejos y hace que cueste más, sobre todo en personas altas (p. ej. de 1,90 m).',
      ],
      execution: [
        '**Tensar la barra**: saca pecho, saca nalga y, antes de subir, haz un poco de fuerza — "empezar a levantar unos pocos kilos" sin que la barra se despegue. Ya estás tenso (de 50 kg, al tensar ya estás levantando unos 20).',
        'Entonces **empuja el suelo con los pies** y piensa en **hundir el suelo**; lo primero que sube es el pecho.',
        '**Es empujar, no tirar.**',
        'Tienes que **bajar y subir por el mismo sitio**.',
        'En la bajada: cuando la barra pasa las rodillas, es cuando se flexionan (no antes).',
      ],
      mistakes: [
        '**Tirar de espalda / empezar con los brazos flexionados**: hay que tensar primero la barra y empujar el suelo; no "dar un tirón".',
        '**Adelantar la rodilla en la bajada** antes de que la barra pase la rodilla: la flexión de rodilla llega cuando la barra ya la ha pasado.',
        '**Curvar la espalda al bajar**: suele ser falta de propiocepción de la posición del cuerpo; se corrige a base de repetir, repetir y repetir.',
        '**Ponerse más peso del que puedes mover** ("porque creo que soy un crack"): al empujar, primero sube la cadera y acabas subiendo todo de espalda, muchas veces con la espalda totalmente curvada. Si ves que sube primero la cadera, sé mucho más consciente al empujar.',
      ],
      notes: [
        'El **peso muerto piernas rígidas** no está en ninguna rutina y la mayoría de la gente no lo puede hacer bien (no se flexiona nada la rodilla; es puramente de isquio). Con el peso muerto rumano es más que suficiente para hacerlo bien.',
      ],
    },
    en: {
      summary:
        "Classic/conventional deadlift. Main cue: chest out, butt out, **tension the bar** (pull a little without it leaving the floor) and then **push the floor with your feet** — it's pushing, not pulling.",
      setup: [
        'The bar must be **completely against your shin** before it leaves the floor.',
        'At the bottom, before starting to lift: **butt out and chest out** to have a **neutral back**, and hold that position.',
        'Rotate the elbows slightly inward, chest out, trying to keep the bar against the shin.',
        'The shoulder sits **slightly ahead of the bar**.',
        '**Footwear**: do it **barefoot or with a completely flat shoe** (Converse-style or powerlifting slippers). Heeled footwear leaves the bar farther away and makes it harder, especially for tall people (e.g. 1.90 m).',
      ],
      execution: [
        '**Tensioning the bar**: chest out, butt out and, before lifting, apply a little force — "start lifting a few kilos" without the bar leaving the floor. You\'re already tense (out of 50 kg, tensioning alone already lifts about 20).',
        'Then **push the floor with your feet** and think about **sinking the floor**; the first thing that rises is the chest.',
        "**It's pushing, not pulling.**",
        'You have to **go down and come up along the same path**.',
        "On the way down: when the bar passes the knees, that's when they bend (not before).",
      ],
      mistakes: [
        '**Pulling with the back / starting with bent arms**: you have to tension the bar first and push the floor; don\'t "yank it".',
        '**Pushing the knee forward on the way down** before the bar passes the knee: the knee bend comes when the bar has already passed it.',
        "**Rounding the back on the way down**: usually a lack of proprioception of body position; it's corrected by repeating, repeating and repeating.",
        '**Loading more weight than you can move** ("because I think I\'m a beast"): when you push, the hips rise first and you end up lifting everything with your back, often with the back completely rounded. If you see the hips rising first, be much more deliberate when pushing.',
      ],
      notes: [
        "The **stiff-leg deadlift** isn't in any routine and most people can't do it well (the knee doesn't bend at all; it's purely hamstrings). The Romanian deadlift is more than enough to do it well.",
      ],
    },
  },
  'romanian-deadlift': {
    es: {
      summary:
        'Peso muerto enfocado en glúteos e isquios/femorales (los erectores de la columna trabajan de forma isométrica). Cue principal: **echar la cadera atrás** con la barra rozando las espinillas y bajar solo hasta donde tu movilidad lo permita **sin curvar nunca la espalda**.',
      setup: [
        '**Pies** más o menos a la anchura de los hombros.',
        'Mejor **sacar la barra desde un sitio elevado**, como un rack.',
        '**Agarre** a la anchura de los hombros más o menos. Con agarre prono doble tu capacidad de agarre es limitada: con mucho peso se te va a abrir. Mejor **agarre mixto** para mayor capacidad de agarre; y si más adelante el agarre te limita, como no compites, puedes incluso usar **straps**.',
        '**Cabeza en línea con la columna** (sobre todo si eres principiante).',
        'Este ejercicio **necesita bastante movilidad de cadera** (isquios, glúteos, etc.); si no, fácilmente se curva la parte lumbar.',
      ],
      execution: [
        'Baja pensando en **echar la cadera atrás**: la rodilla **no** va hacia adelante ni se flexiona hacia adelante; es prácticamente la cadera la que va atrás en todo momento. Lo único que se mueve es la cadera.',
        '**Rodilla siempre en línea con el tobillo.**',
        'El peso va **siempre rozando las espinillas**: bajas rozando las espinillas, echando la cadera atrás, y cuando ya no puedes bajar más, subes.',
        'Baja **lento**, controlando.',
        'Antes de empezar a bajar, haz como una **retroversión pélvica** (piensa "saca nalga") y ahí empieza a bajar.',
        'Baja solo **hasta donde te deje tu movilidad y flexibilidad sin curvar nunca la espalda**: espalda neutra. El ejercicio funciona por **estiramiento y luego contracción**: lo que se estira son los isquios, la parte de atrás de la pierna y los glúteos.',
        'Lo que vas a sentir es la parte de atrás de la pierna **estirándose muchísimo**.',
      ],
      mistakes: [
        '**Pensar que hay que bajar hasta abajo aunque se curve la espalda**: no es cierto. Curvar el lumbar no es lesivo, pero si bajas curvando la espalda los isquios **no se estiran más y por tanto no trabajan más** — la espalda trabaja de forma isométrica y no se tiene que mover de la posición neutra.',
        '**Flexionar la rodilla al bajar**: le estás quitando trabajo a los músculos de atrás, que es lo que interesa en este ejercicio.',
        '**Bajar con el peso separado de las espinillas**: se carga toda la parte lumbar; con el peso pegado, el trabajo va mucho más a los isquios y la espalda sufre muchísimo menos.',
      ],
      notes: [
        '**Progresión de recorrido**: si al principio no puedes bajar mucho por falta de elasticidad, no te preocupes — semana a semana, con el **mismo peso**, intenta hacer un poquito más de recorrido. Con las semanas podrás bajar más y más.',
        '**Con más peso puedes bajar más**, porque el propio peso te obliga; con poco peso cuesta más llegar abajo.',
        '**Grábate** para saber cuánto recorrido estás haciendo e ir mejorándolo poco a poco.',
        'Mejorar la elasticidad **sin estar bajo carga no se extrapola al ejercicio**: si quieres mejorar tu rango de movimiento en un ejercicio, tienes que hacerlo con el mismo ejercicio.',
      ],
    },
    en: {
      summary:
        'Deadlift focused on glutes and hamstrings (the spinal erectors work isometrically). Main cue: **push the hips back** with the bar brushing the shins and lower only as far as your mobility allows **without ever rounding the back**.',
      setup: [
        '**Feet** more or less at shoulder width.',
        'Better to **take the bar from an elevated spot**, like a rack.',
        "**Grip** at shoulder width more or less. With a double overhand grip your grip capacity is limited: with heavy weight it's going to open up. Better a **mixed grip** for greater grip capacity; and if later on your grip limits you, since you don't compete, you can even use **straps**.",
        "**Head in line with the spine** (especially if you're a beginner).",
        'This exercise **requires quite a lot of hip mobility** (hamstrings, glutes, etc.); otherwise the lower back easily rounds.',
      ],
      execution: [
        "Lower thinking about **pushing the hips back**: the knee does **not** travel forward nor bend forward; it's practically the hips that go back the whole time. The only thing that moves is the hips.",
        '**Knee always in line with the ankle.**',
        "The weight **always brushes the shins**: you lower brushing the shins, pushing the hips back, and when you can't go any lower, you come up.",
        'Lower **slowly**, controlling.',
        'Before you start lowering, do something like a **posterior pelvic tilt** (think "butt out") and start descending from there.',
        'Lower only **as far as your mobility and flexibility allow without ever rounding the back**: neutral back. The exercise works through **stretch and then contraction**: what stretches is the hamstrings, the back of the leg and the glutes.',
        "What you're going to feel is the back of the leg **stretching enormously**.",
      ],
      mistakes: [
        "**Thinking you have to go all the way down even if the back rounds**: that's not true. Rounding the lower back isn't injurious, but if you lower while rounding the back the hamstrings **don't stretch more and therefore don't work more** — the back works isometrically and must not move from the neutral position.",
        "**Bending the knee on the way down**: you're taking work away from the muscles at the back, which is the whole point of this exercise.",
        '**Lowering with the weight away from the shins**: the whole lower back gets loaded; with the weight close, the work goes much more to the hamstrings and the back suffers far less.',
      ],
      notes: [
        "**Range-of-motion progression**: if at first you can't go very low for lack of flexibility, don't worry — week after week, with the **same weight**, try to do a little more range. Over the weeks you'll be able to go lower and lower.",
        "**With more weight you can go lower**, because the weight itself forces you; with little weight it's harder to reach the bottom.",
        "**Film yourself** to know how much range you're doing and improve it little by little.",
        "Improving flexibility **without being under load doesn't carry over to the exercise**: if you want to improve your range of motion in an exercise, you have to do it with that same exercise.",
      ],
    },
  },
  'overhead-press': {
    es: {
      summary:
        'Press militar con barra, con el banco un puntito inclinado. Cue principal: escápulas juntas y pecho al cielo, y al bajar los **codos siempre debajo de la barra** — se logra haciendo la intención de **girar las manos** como si quisieras doblar la barra.',
      setup: [
        'Pon el banco **un puntito inclinado**, para tener una mejor posición y mejor estabilidad a la hora de apoyarte.',
        'Apoya las **escápulas (homoplatos)** y ten el **pecho proyectado hacia adelante**.',
        'La posición vista por detrás: como si quisieras **pellizcar un canto de una pared con las escápulas** y luego **subir el pecho hacia el cielo**. Es la posición que se adopta no solo en este ejercicio, sino **en todos los preses** (pecho, hombro, etc.).',
        '**Agarre**: ni muy ancho ni muy cerrado — un intermedio para que, al bajar, tengas más o menos el **codo debajo de la muñeca**.',
      ],
      execution: [
        'Lleva el peso **a la clavícula** y sube. **Recorrido completo**: clavícula y subimos.',
        'Para que los codos vayan debajo de la barra: haz la intención de **girar con la mano izquierda al contrario de las agujas del reloj y con la derecha en dirección de las agujas del reloj**. Así, al bajar, los codos van debajo de la barra.',
      ],
      mistakes: [
        '**Bajar con el codo abierto / sin el codo debajo de la barra**: error súper común en el press militar. El peso se te va hacia adelante y gastas muchísima energía estabilizándolo, por lo que podrás levantar muchísimo menos peso.',
      ],
      notes: [
        'El error del codo es común **en todos los preses** (militar, inclinado, banca): si no tienes el codo debajo de la barra, el peso se va hacia adelante y levantas menos. Lo correcto es bajar con el codo justo debajo de la barra para ser más eficiente.',
        '**Tip**: cuando tengas la barra, piensa que con la mano derecha vas a girar en la dirección de las agujas del reloj y con la otra mano al revés; al hacer la intención de girar, el codo solito se va hacia adelante (debajo de la barra).',
      ],
    },
    en: {
      summary:
        'Barbell overhead press, with the bench inclined a tiny bit. Main cue: shoulder blades together and chest to the sky, and on the way down the **elbows always under the bar** — achieved by intending to **turn your hands** as if you wanted to bend the bar.',
      setup: [
        'Set the bench **inclined a tiny bit**, to have a better position and better stability when bracing yourself.',
        'Rest on your **shoulder blades (scapulae)** and keep the **chest projected forward**.',
        "The position seen from behind: as if you wanted to **pinch the edge of a wall with your shoulder blades** and then **raise the chest toward the sky**. It's the position you adopt not only in this exercise, but **in all the presses** (chest, shoulder, etc.).",
        '**Grip**: neither very wide nor very narrow — an in-between so that, on the way down, you have the **elbow more or less under the wrist**.',
      ],
      execution: [
        'Bring the weight **to the collarbone** and press up. **Full range of motion**: collarbone and up we go.',
        'To get the elbows under the bar: intend to **turn with your left hand counterclockwise and with your right hand clockwise**. That way, on the way down, the elbows go under the bar.',
      ],
      mistakes: [
        "**Lowering with the elbow flared / without the elbow under the bar**: a super common error in the overhead press. The weight drifts forward and you spend a huge amount of energy stabilizing it, so you'll be able to lift much less weight.",
      ],
      notes: [
        "The elbow error is common **in all the presses** (overhead, incline, bench): if you don't have the elbow under the bar, the weight drifts forward and you lift less. The correct thing is to lower with the elbow right under the bar to be more efficient.",
        "**Tip**: when you have the bar, think that with your right hand you're going to turn clockwise and with the other hand the opposite way; when you intend to turn, the elbow moves forward by itself (under the bar).",
      ],
    },
  },
  'seated-dumbbell-press': {
    es: {
      summary:
        'Press militar de hombro con mancuernas. Cue principal: postura compacta (escápulas un poco retraídas, pecho hacia el cielo) y **recorrido completo**, bajando hasta que la mancuerna toque el hombro.',
      setup: [
        '**Muy buena postura en el banco**: no estar con los hombros adelantados ni con las escápulas completamente abiertas.',
        'Escápulas **un poquito retraídas**, sacar un poco de pecho e incluso **llevar el pecho hacia el cielo**: así te sentirás mucho más compacto en el ejercicio.',
        'Una vez tienes la postura, **rota un poquito el codo hacia atrás** y ya agarras el peso.',
        'La mancuerna no va ni totalmente de frente ni totalmente de lado: un **intermedio que se llama plano escapular**.',
      ],
      execution: [
        '**Recorrido completo**: subir y bajar **hasta que la mancuerna toque el hombro**. Subir y bajar, recorrido completo.',
      ],
      mistakes: [
        '**Hacer medios recorridos** (como se ve mucho en redes sociales): hay que hacer recorrido completo, porque es lo mejor en todos los aspectos, sea cual sea tu meta.',
      ],
    },
    en: {
      summary:
        'Dumbbell shoulder overhead press. Main cue: compact posture (shoulder blades slightly retracted, chest toward the sky) and **full range of motion**, lowering until the dumbbell touches the shoulder.',
      setup: [
        '**Very good posture on the bench**: not with the shoulders pushed forward nor with the shoulder blades completely spread apart.',
        "Shoulder blades **slightly retracted**, push the chest out a bit and even **bring the chest toward the sky**: that way you'll feel much more compact in the exercise.",
        'Once you have the posture, **rotate the elbow slightly backward** and then grab the weight.',
        'The dumbbell goes neither completely to the front nor completely to the side: an **in-between called the scapular plane**.',
      ],
      execution: [
        '**Full range of motion**: press up and lower **until the dumbbell touches the shoulder**. Up and down, full range of motion.',
      ],
      mistakes: [
        "**Doing half reps** (as seen a lot on social media): you have to do the full range of motion, because it's the best thing in every respect, whatever your goal is.",
      ],
    },
  },
  'lat-pulldown': {
    es: {
      summary:
        'Jalones para trabajar el dorsal, con distintos agarres (supino, neutro, prono) que son muy similares entre sí. Cue principal: **llevar la polea a la parte alta del pecho**, sin irte hacia adelante, con recorrido completo.',
      setup: [
        'Hay diferentes tipos de jalones según el agarre: **Supino**: con las manos mirando hacia ti. **Neutro**. **Prono**: con la palma de la mano mirando hacia adelante.',
        'Cuando en la rutina ponga **agarre estrecho**, sería un **agarre neutro**.',
      ],
      execution: [
        '**Llevar la polea a la parte alta del pecho**, sea cual sea el agarre.',
        '**No irte hacia adelante**: buscamos trabajar el dorsal, y el dorsal trabaja dentro de un rango de ángulo concreto.',
        'Lo más importante: hacer una **buena técnica**, **ir al fallo**, dar todo de ti en cada serie y **recorrido completo**.',
      ],
      mistakes: [],
      notes: [
        'Entre agarre neutro y supino **no hay diferencia en cuanto al dorsal**; la diferencia en el **bíceps** es menor y poco relevante.',
      ],
    },
    en: {
      summary:
        'Pulldowns to work the lats, with different grips (supinated, neutral, pronated) that are very similar to each other. Main cue: **bring the bar to the upper chest**, without leaning forward, with full range of motion.',
      setup: [
        'There are different types of pulldowns depending on the grip: **Supinated**: with the hands facing toward you. **Neutral**. **Pronated**: with the palm of the hand facing forward.',
        'When the routine says **close grip**, that means a **neutral grip**.',
      ],
      execution: [
        '**Bring the bar to the upper part of the chest**, whatever the grip.',
        "**Don't lean forward**: we want to work the lats, and the lats work within a specific angle range.",
        'The most important thing: use **good technique**, **go to failure**, give your all in every set and use **full range of motion**.',
      ],
      mistakes: [],
      notes: [
        "Between neutral and supinated grip **there's no difference as far as the lats go**; the difference in the **biceps** is minor and of little relevance.",
      ],
    },
  },
  'leg-press': {
    es: {
      summary:
        'Prensa (puedes usar cualquier prensa). Cue principal: **sacar nalga y pecho en todo momento** para no levantar la nalga del banco, y bajar todo lo que puedas controlando el peso.',
      setup: [
        '**Anchura de los pies**: a la anchura de los hombros o un poquito más — así podrás bajar más. Tener los pies muy juntos hace que puedas bajar menos.',
        'Si buscas el máximo recorrido, puedes **probar diferentes anchuras de pies** para encontrar con cuál bajas todo lo que puedas.',
      ],
      execution: [
        '**Siempre sacando nalga y pecho** en todo momento del ejercicio.',
        '**Bajar todo lo que podamos**, controlando el peso.',
        '**Subir lo más rápido que podamos**.',
      ],
      mistakes: [
        '**Levantar la nalga del banco**: error típico. Al levantar la nalga se curva el lumbar; se evita estando siempre sacando nalga y pecho.',
        '**Pies muy juntos**: limitan cuánto puedes bajar.',
      ],
    },
    en: {
      summary:
        "Leg press (you can use any leg press machine). Main cue: **butt out and chest out at all times** so you don't lift your butt off the seat, and lower as far as you can while controlling the weight.",
      setup: [
        "**Foot width**: at shoulder width or a little more — that way you'll be able to go lower. Having the feet very close together means you can go less low.",
        "If you're after maximum range of motion, you can **try different foot widths** to find the one with which you go down as far as you can.",
      ],
      execution: [
        '**Always with butt out and chest out** at every moment of the exercise.',
        '**Lower as far as we can**, controlling the weight.',
        '**Come up as fast as we can**.',
      ],
      mistakes: [
        "**Lifting the butt off the seat**: typical error. When you lift the butt the lower back rounds; it's avoided by always keeping butt out and chest out.",
        '**Feet very close together**: they limit how low you can go.',
      ],
    },
  },
  'leg-extension': {
    es: {
      summary:
        'Extensión de piernas para cuádriceps. Cue principal: **recorrido completo**, controlando la bajada y subiendo lo más rápido que puedas.',
      setup: ['**Agárrate bien de los soportes** de la máquina.'],
      execution: [
        '**Recorrido completo**.',
        '**Controla la bajada** y **sube lo más rápido que puedas** — esto es muy importante para sacarle el máximo partido al ejercicio.',
      ],
      mistakes: [
        '**Hacer recorrido corto**: incorrecto.',
        '**Hacerlo muy rápido, con recorrido corto y con prisa**: error bastante típico; tiene que ser recorrido completo, controlando la bajada.',
      ],
    },
    en: {
      summary:
        'Leg extension for the quadriceps. Main cue: **full range of motion**, controlling the descent and coming up as fast as you can.',
      setup: ["**Hold on tight to the machine's supports**."],
      execution: [
        '**Full range of motion**.',
        '**Control the descent** and **come up as fast as you can** — this is very important to get the most out of the exercise.',
      ],
      mistakes: [
        '**Doing a short range of motion**: incorrect.',
        '**Doing it very fast, with a short range of motion and in a rush**: a fairly typical error; it has to be full range of motion, controlling the descent.',
      ],
    },
  },
  'lying-leg-curl': {
    es: {
      summary:
        'Ejercicio sencillo para femorales. Cue principal: **no levantar la nalga** al subir el peso, para que el trabajo se concentre en la parte de atrás de la pierna.',
      execution: [
        'Intenta subir el peso **sin levantar la nalga**, para que el trabajo se concentre lo máximo posible en toda la parte de detrás de la pierna (isquios, etc.).',
        '**Controla la bajada** y **sube lo más rápido que puedas**.',
      ],
      mistakes: [
        '**Levantar la nalga** durante la subida: error muy típico; hay que intentar que no se levante.',
      ],
    },
    en: {
      summary:
        "Simple exercise for the hamstrings. Main cue: **don't lift your butt** when raising the weight, so the work concentrates on the back of the leg.",
      execution: [
        'Try to raise the weight **without lifting your butt**, so the work concentrates as much as possible on the whole back of the leg (hamstrings, etc.).',
        '**Control the descent** and **come up as fast as you can**.',
      ],
      mistakes: [
        '**Lifting the butt** during the way up: a very typical error; you have to try not to let it rise.',
      ],
    },
  },
  'barbell-curl': {
    es: {
      summary:
        'Curl con barra: una flexión de codo sencilla. Cue principal: **extensión completa abajo y subida completa**, sin inercias; baja controlando y sube rápido.',
      execution: [
        'Es simplemente una **flexión de codo**: baja **hasta estirar por completo** y sube **todo lo que puedas**.',
        '**Bajamos controlando, subimos rápido.** Bajamos controlando, subimos rápido, y así.',
        '**Nada de vaivenes ni bajar a medias**: tiene que ser extensión completa.',
        '**No hagas inercias**: lo único que haces es quitarle trabajo al músculo.',
      ],
      mistakes: [],
      notes: [
        'Cuando llevas mucho peso (más de la mitad de tu peso corporal), es **normal que al tirar te vayas un poquito hacia atrás**. Muy diferente es, desde un principio, hacer la intención de inercia para poder levantar más peso.',
      ],
    },
    en: {
      summary:
        'Barbell curl: a simple elbow flexion. Main cue: **full extension at the bottom and a full rise**, with no momentum; lower under control and come up fast.',
      execution: [
        "It's simply an **elbow flexion**: lower **until fully extended** and come up **as far as you can**.",
        '**We lower under control, we come up fast.** We lower under control, we come up fast, and so on.',
        '**No swinging and no lowering halfway**: it has to be full extension.',
        "**Don't use momentum**: all you do is take work away from the muscle.",
      ],
      mistakes: [],
      notes: [
        "When you're handling a lot of weight (more than half your body weight), it's **normal to lean back a little as you pull**. Very different is, from the start, intending to use momentum to be able to lift more weight.",
      ],
    },
  },
  skullcrusher: {
    es: {
      summary:
        'Press francés con mancuernas para tríceps: flexión y extensión de codo llevando las mancuernas **a los lados de la cabeza**. Cue principal: las **escápulas son tus pies** en este ejercicio — júntalas y saca pecho para estar estable y tirar con más fuerza.',
      setup: [
        'Igual que en los preses, las **escápulas (homoplatos) son tus pies** en este ejercicio: te dan estabilidad para tirar con más fuerza.',
        '**Junta las escápulas y saca un poco de pecho**: estarás más estable y podrás tirar con mucha más fuerza.',
        'No estés con las escápulas completamente separadas y los hombros adelantados: te crea mucha más inestabilidad.',
      ],
      execution: [
        'Lleva las mancuernas **a los lados de tu cabeza**. Y ya está.',
        'Se trata de una **flexión y extensión de codo** para trabajar el tríceps.',
      ],
      mistakes: [],
      notes: [
        '**Si te duele un poco el codo** al hacer este ejercicio, puedes **abrirte un poco más los codos** y hacerlo de esa forma, ya que evita bastante el dolor. Si no te duele, hazlo de la forma normal.',
      ],
    },
    en: {
      summary:
        'Dumbbell French press for the triceps: elbow flexion and extension bringing the dumbbells **to the sides of the head**. Main cue: the **shoulder blades are your feet** in this exercise — bring them together and push your chest out to be stable and pull with more force.',
      setup: [
        'Just like in the presses, the **shoulder blades (scapulae) are your feet** in this exercise: they give you stability to pull with more force.',
        "**Bring the shoulder blades together and push the chest out a bit**: you'll be more stable and able to pull with much more force.",
        "Don't be with the shoulder blades completely apart and the shoulders pushed forward: it creates much more instability.",
      ],
      execution: [
        "Bring the dumbbells **to the sides of your head**. And that's it.",
        "It's an **elbow flexion and extension** to work the triceps.",
      ],
      mistakes: [],
      notes: [
        "**If your elbow hurts a little** when doing this exercise, you can **open your elbows out a bit more** and do it that way, since it avoids the pain quite a bit. If it doesn't hurt, do it the normal way.",
      ],
    },
  },
  'back-extension': {
    es: {
      summary:
        'Hiperextensiones para trabajar glúteo y toda la parte de detrás de la pierna. Cue principal: **mantener la espalda neutra** — no curvarla por completo — bajando lento todo lo que puedas y subiendo rápido.',
      execution: [
        '**Mantén la espalda neutra** durante todo el ejercicio.',
        '**Baja lento** y **baja todo lo que puedas**.',
        'Si hace falta **usar peso, usa peso**.',
        '**Sube lo más rápido que puedas.**',
        'Resumen del ritmo: controlamos la bajada hasta donde podamos, y luego subimos.',
      ],
      mistakes: [
        '**Curvar la espalda por completo**: hay que intentar no hacerlo, porque le quita trabajo a los músculos que queremos trabajar (la parte de atrás de la pierna, isquios y glúteos).',
      ],
    },
    en: {
      summary:
        "Hyperextensions to work the glutes and the whole back of the leg. Main cue: **keep the back neutral** — don't round it completely — lowering slowly as far as you can and coming up fast.",
      execution: [
        '**Keep the back neutral** throughout the exercise.',
        '**Lower slowly** and **lower as far as you can**.',
        'If you need to **use weight, use weight**.',
        '**Come up as fast as you can.**',
        'Rhythm summary: we control the descent as far as we can, and then we come up.',
      ],
      mistakes: [
        '**Rounding the back completely**: you have to try not to do it, because it takes work away from the muscles we want to work (the back of the leg, hamstrings and glutes).',
      ],
    },
  },
  crunch: {
    es: {
      summary:
        '**Abdomen**: crunch en polea desde arriba — lo único que se mueve es el abdomen, como si quisieras llevar el esternón a la pelvis.',
      setup: ['Se hace **con polea desde arriba**, normalmente agarrando una **cuerda**.'],
      execution: [
        'Haz el **crunch con todo el peso que podamos**, trabajando pesado.',
        '**Lo único que se mueve es el abdomen**: encoges, luego extiendes; encoges, extiendes.',
        'Es **como si quisiéramos llevar el esternón a la pelvis** — ese es el trabajo del abdomen.',
      ],
      mistakes: [],
    },
    en: {
      summary:
        '**Abs**: cable crunch from above — the only thing that moves is the abs, as if you wanted to bring the sternum to the pelvis.',
      setup: ["It's done **with a cable from above**, usually gripping a **rope**."],
      execution: [
        'Do the **crunch with all the weight we can**, working heavy.',
        '**The only thing that moves is the abs**: you crunch, then extend; crunch, extend.',
        "It's **as if we wanted to bring the sternum to the pelvis** — that's the job of the abs.",
      ],
      mistakes: [],
    },
  },
  'standing-calf-raise': {
    es: {
      summary:
        '**Gemelos**: baja todo lo que puedas, haz una **pausa de un segundo abajo** y sube todo lo que puedas.',
      setup: [
        'Se pueden hacer **de pie o en máquina** (sería lo mismo), o incluso **agarrando un disco con una mano**.',
      ],
      execution: [
        '**Baja todo lo que puedas y sube todo lo que puedas.**',
        'Cuando estés abajo, haz una **pausa de un segundo** y luego sube: pausa de un segundo, subimos; un segundo, subimos.',
      ],
      mistakes: [],
      notes: [
        'Tenemos un **tendón muy fuerte** que hace **como de tirachinas**: si no haces la pausa, es posible que te ayudes de la inercia que da el tendón y eso le quite trabajo al músculo. La pausa de un segundo abajo lo evita.',
      ],
    },
    en: {
      summary:
        '**Calves**: lower as far as you can, do a **one-second pause at the bottom** and come up as far as you can.',
      setup: [
        'They can be done **standing or on a machine** (it would be the same), or even **holding a plate with one hand**.',
      ],
      execution: [
        '**Lower as far as you can and come up as far as you can.**',
        "When you're at the bottom, do a **one-second pause** and then come up: one-second pause, up we go; one second, up we go.",
      ],
      mistakes: [],
      notes: [
        "We have a **very strong tendon** that acts **like a slingshot**: if you don't do the pause, it's possible you'll help yourself with the momentum the tendon gives and that takes work away from the muscle. The one-second pause at the bottom avoids that.",
      ],
    },
  },
};
