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
  'sumo-deadlift': {
    es: {
      summary:
        'Peso muerto sumo: **pies anchos y puntas hacia fuera**, manos por dentro de las rodillas y torso más vertical que en el convencional. Cue principal: tensa la barra y **separa el suelo con los pies** — es empujar, no tirar.',
      setup: [
        'Postura ancha, bastante más abierta que los hombros, con las **puntas de los pies hacia fuera**; las espinillas quedan casi verticales y pegadas a la barra.',
        'Agarra la barra con las **manos por dentro de las rodillas**, con los brazos colgando rectos.',
        'Cadera **más baja que en el convencional** y torso más vertical: saca pecho, saca nalga y mantén la espalda neutra antes de mover nada.',
        'Las **rodillas siguen la línea de los pies**: abre la cadera hacia fuera y no dejes que se metan hacia dentro.',
        'Calzado plano o descalzo, igual que en el convencional.',
      ],
      execution: [
        '**Tensa la barra** primero: haz fuerza sin que se despegue del suelo hasta notar todo el cuerpo rígido.',
        'Piensa en **separar el suelo** con los pies, empujando hacia fuera y hacia abajo; cadera y pecho suben a la vez.',
        'Cuando la barra pasa la rodilla, lleva la cadera hacia la barra y termina de pie, sin inclinarte hacia atrás.',
        'Baja por el mismo camino: primero cadera atrás, y las rodillas se flexionan cuando la barra ya las ha pasado.',
      ],
      mistakes: [
        '**Rodillas hacia dentro** al despegar: pierdes fuerza y cargas la rodilla; empuja las rodillas hacia las puntas de los pies.',
        '**Cadera que sube antes que el pecho**: convierte el sumo en un convencional mal hecho; tensa más y sé más deliberado al empujar.',
        '**Tirar con los brazos** o con la espalda en lugar de empujar el suelo.',
        '**Postura demasiado ancha** para tu movilidad de cadera: si no puedes mantener las espinillas verticales y la espalda neutra, cierra un poco los pies.',
      ],
      notes: [
        'Recorrido más corto y más trabajo de cuádriceps y aductores que el convencional; suele ir mejor a gente con fémur largo o poca movilidad para mantener la espalda neutra desde abajo. Elige el que te deje empujar con mejor técnica.',
      ],
    },
    en: {
      summary:
        'Sumo deadlift: **wide stance, toes out**, hands inside the knees and a more upright torso than the conventional pull. Main cue: tension the bar and **push the floor apart** with your feet — it is pushing, not pulling.',
      setup: [
        'Wide stance, well beyond shoulder width, with the **toes pointing out**; the shins end up almost vertical and against the bar.',
        'Grip the bar with the **hands inside the knees**, arms hanging straight.',
        'Hips **lower than in the conventional deadlift** and torso more vertical: chest out, butt out, neutral back before anything moves.',
        'The **knees track the toes**: open the hips outward and never let the knees cave in.',
        'Flat shoes or barefoot, same as the conventional pull.',
      ],
      execution: [
        '**Tension the bar** first: apply force without lifting it off the floor until the whole body feels rigid.',
        'Think about **spreading the floor apart** with your feet, pushing out and down; hips and chest rise together.',
        'Once the bar passes the knees, drive the hips to the bar and finish standing tall, without leaning back.',
        'Lower along the same path: hips back first, knees bending only once the bar has passed them.',
      ],
      mistakes: [
        '**Knees caving in** off the floor: you lose force and load the knee; push the knees toward the toes.',
        '**Hips shooting up before the chest**: it turns the sumo into a badly done conventional; tension more and be more deliberate as you push.',
        '**Pulling with the arms** or the back instead of pushing the floor.',
        '**A stance too wide** for your hip mobility: if you cannot keep the shins vertical and the back neutral, bring the feet in a little.',
      ],
      notes: [
        'Shorter range and more quad and adductor work than the conventional pull; it tends to suit people with long femurs or limited mobility to hold a neutral back from the floor. Pick whichever lets you push with better technique.',
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
  'hammer-curl': {
    es: {
      summary:
        'Curl martillo: flexión de codo con **agarre neutro** (palmas enfrentadas). Cue principal: codos pegados al costado, **extensión completa abajo** y subida sin balanceo.',
      setup: [
        'De pie o sentado, con una mancuerna en cada mano y las palmas mirando hacia el cuerpo, como si sostuvieras un martillo.',
        'Codos a los lados del torso, ligeramente por delante de la cadera, y hombros atrás; esa posición no cambia durante la serie.',
      ],
      execution: [
        'Sube la mancuerna flexionando solo el codo hasta que el antebrazo quede casi vertical; la muñeca no gira en ningún momento.',
        'Baja controlando hasta **estirar del todo** el brazo antes de la siguiente repetición.',
        'Puedes alternar brazos o subir los dos a la vez; lo importante es que cada rep sea completa.',
      ],
      mistakes: [
        '**Balancear el torso** o impulsar con la cadera: le quitas trabajo al bíceps y al braquial.',
        '**Adelantar los codos** al subir: convierte el curl en una elevación frontal de hombro.',
        '**Bajar a medias**: sin extensión completa pierdes la parte del recorrido que más carga el braquiorradial.',
      ],
      notes: [
        'El agarre neutro reparte el trabajo entre bíceps, braquial y braquiorradial, por eso suele permitir algo más de peso que el curl con barra. Buena opción cuando el curl supinado molesta la muñeca.',
      ],
    },
    en: {
      summary:
        'Hammer curl: elbow flexion with a **neutral grip** (palms facing each other). Main cue: elbows pinned to your sides, **full extension at the bottom** and no swinging on the way up.',
      setup: [
        'Standing or seated, a dumbbell in each hand with the palms facing your body, as if holding a hammer.',
        'Elbows at the sides of the torso, slightly ahead of the hips, shoulders back; that position does not change during the set.',
      ],
      execution: [
        'Curl by bending only the elbow until the forearm is almost vertical; the wrist never rotates.',
        'Lower under control until the arm is **fully straight** before the next rep.',
        'Alternate arms or curl both at once; what matters is that every rep is complete.',
      ],
      mistakes: [
        '**Swinging the torso** or driving with the hips: it takes work away from the biceps and brachialis.',
        '**Letting the elbows drift forward** on the way up: it turns the curl into a front raise.',
        '**Stopping halfway down**: without full extension you lose the part of the range that loads the brachioradialis most.',
      ],
      notes: [
        'The neutral grip shares the work between biceps, brachialis and brachioradialis, which is why it usually allows a bit more weight than the barbell curl. A good option when supinated curls bother the wrist.',
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
  'machine-chest-press': {
    es: {
      summary:
        'Press de pecho en máquina: el mismo patrón que el press de banca con la trayectoria guiada. Cue principal: **escápulas juntas y pecho fuera** contra el respaldo, y **codos debajo de las manos** en todo el recorrido.',
      setup: [
        '**Altura del asiento**: las agarraderas quedan a la altura de la parte media del pecho, no a la altura de los hombros.',
        '**Escápulas contra el respaldo**: júntalas y saca pecho igual que en cualquier press; esa posición no cambia en toda la serie.',
        'Pies firmes en el suelo o en la plataforma para empujar desde una base estable.',
      ],
      execution: [
        'Empuja hasta **casi extender los codos**, sin bloquearlos ni despegar las escápulas del respaldo.',
        'Baja **controlando** hasta que las manos queden a la altura del pecho, donde sientas estiramiento sin dolor.',
        'Los **codos viajan debajo de las manos**, algo por debajo de la línea de los hombros, nunca abiertos a 90 grados.',
      ],
      mistakes: [
        '**Adelantar los hombros** al empujar: el pecho pierde tensión y el hombro carga el trabajo.',
        '**Asiento demasiado bajo o alto**: las manos quedan a la altura del hombro o del abdomen y deja de ser un press horizontal.',
        '**Recorrido corto** con mucho peso: baja completo y ajusta la carga.',
      ],
      notes: [
        'Útil para llevar el pecho **al fallo con seguridad** después de los presses libres, o cuando no hay quien te asista.',
      ],
    },
    en: {
      summary:
        'Machine chest press: the same pattern as the bench press with a guided path. Main cue: **shoulder blades together and chest out** against the backrest, and **elbows under the hands** through the whole range.',
      setup: [
        '**Seat height**: the handles sit at mid-chest height, not at shoulder height.',
        '**Shoulder blades against the backrest**: bring them together and push the chest out like in any press; that position does not change during the set.',
        'Feet firmly on the floor or the platform so you push from a stable base.',
      ],
      execution: [
        'Press until the elbows are **almost extended**, without locking them or letting the shoulder blades leave the backrest.',
        'Lower **under control** until the hands are at chest height, where you feel a stretch without pain.',
        'The **elbows travel under the hands**, slightly below the shoulder line, never flared to 90 degrees.',
      ],
      mistakes: [
        '**Pushing the shoulders forward** as you press: the chest loses tension and the shoulder takes over.',
        '**Seat too low or too high**: the hands end up at shoulder or belly height and it stops being a horizontal press.',
        '**Short range** with heavy weight: lower all the way and adjust the load.',
      ],
      notes: [
        'Useful to take the chest **to failure safely** after the free-weight presses, or when nobody can spot you.',
      ],
    },
  },
  'dumbbell-fly': {
    es: {
      summary:
        'Aperturas con mancuernas en banco plano para pecho. Cue principal: **codos ligeramente flexionados y fijos**, abre en arco amplio y junta las mancuernas **con el pecho, no con los brazos**.',
      setup: [
        'Acostado en banco plano, **escápulas juntas y pecho fuera**, pies firmes en el suelo.',
        'Mancuernas arriba sobre el pecho con las **palmas enfrentadas** y una ligera flexión de codo que se mantiene toda la serie.',
      ],
      execution: [
        'Abre los brazos **en arco** bajando controlando hasta sentir estiramiento en el pecho, con las mancuernas a la altura del pecho.',
        'Sube por el mismo arco pensando en **juntar los codos**, no las manos; el pecho hace el trabajo.',
        'Arriba no choques las mancuernas: detente justo antes para no perder tensión.',
      ],
      mistakes: [
        '**Convertirlo en press**: flexionar los codos al subir para mover más peso.',
        '**Bajar de más** con los brazos rectos: sobrecarga el hombro; el estiramiento se siente en el pecho, no en la articulación.',
        '**Usar demasiado peso**: este ejercicio se trabaja con cargas ligeras y recorrido completo.',
      ],
      notes: [
        'Es un ejercicio de **estiramiento y contracción**; ideal como complemento de los presses, no como sustituto.',
      ],
    },
    en: {
      summary:
        'Dumbbell fly on a flat bench for the chest. Main cue: **elbows slightly bent and fixed**, open in a wide arc and bring the dumbbells together **with the chest, not the arms**.',
      setup: [
        'Lying on a flat bench, **shoulder blades together and chest out**, feet firmly on the floor.',
        'Dumbbells up over the chest with the **palms facing each other** and a slight elbow bend that stays the same the whole set.',
      ],
      execution: [
        'Open the arms **in an arc**, lowering under control until you feel a stretch in the chest, with the dumbbells at chest height.',
        'Come back up along the same arc thinking about **bringing the elbows together**, not the hands; the chest does the work.',
        "Don't clash the dumbbells at the top: stop just before so you don't lose tension.",
      ],
      mistakes: [
        '**Turning it into a press**: bending the elbows on the way up to move more weight.',
        '**Going too deep** with straight arms: it overloads the shoulder; the stretch is felt in the chest, not in the joint.',
        '**Using too much weight**: this exercise is done with light loads and full range of motion.',
      ],
      notes: [
        'It is a **stretch and contraction** exercise; ideal as a complement to the presses, not a replacement.',
      ],
    },
  },
  'cable-fly': {
    es: {
      summary:
        'Aperturas en polea, de pie. Cue principal: **codos casi fijos**, torso estable con un pie adelante, y las manos se juntan al frente **apretando el pecho** al final del recorrido.',
      setup: [
        '**Altura de las poleas**: a la altura del hombro para el pecho medio; más altas dirigen a la parte baja, más bajas a la parte alta.',
        'Da un paso al frente con un pie para **estabilizar el torso** e inclínate ligeramente hacia adelante.',
        'Escápulas juntas y pecho fuera; los codos con una **ligera flexión** que no cambia.',
      ],
      execution: [
        'Abre los brazos controlando hasta sentir el estiramiento en el pecho, sin que los hombros se adelanten.',
        'Cierra en arco hasta que las manos se junten o se crucen delante del esternón, con una **contracción de un segundo**.',
        'Vuelve **lento**: la polea mantiene tensión en todo el recorrido, aprovéchala.',
      ],
      mistakes: [
        '**Doblar los codos** al cerrar: lo convierte en un press y el pecho pierde trabajo.',
        '**Balancear el torso** para mover el peso: la carga es ligera y el movimiento sale solo del hombro.',
        '**Adelantar los hombros** al final: encoge el pecho en lugar de contraerlo.',
      ],
      notes: [
        'La tensión constante de la polea lo hace ideal para **series altas y al fallo** al final del entrenamiento de pecho.',
      ],
    },
    en: {
      summary:
        'Standing cable fly. Main cue: **elbows almost fixed**, stable torso with one foot forward, and the hands meet in front **squeezing the chest** at the end of the range.',
      setup: [
        '**Pulley height**: at shoulder height for the mid chest; higher targets the lower chest, lower targets the upper chest.',
        'Step forward with one foot to **stabilize the torso** and lean slightly forward.',
        'Shoulder blades together and chest out; the elbows keep a **slight bend** that does not change.',
      ],
      execution: [
        'Open the arms under control until you feel the stretch in the chest, without letting the shoulders roll forward.',
        'Close in an arc until the hands meet or cross in front of the sternum, with a **one-second squeeze**.',
        'Return **slowly**: the cable keeps tension through the whole range, use it.',
      ],
      mistakes: [
        '**Bending the elbows** as you close: it turns into a press and the chest loses work.',
        '**Swinging the torso** to move the weight: the load is light and the movement comes only from the shoulder.',
        '**Rolling the shoulders forward** at the end: it hunches the chest instead of contracting it.',
      ],
      notes: [
        'The constant cable tension makes it ideal for **high-rep sets to failure** at the end of a chest workout.',
      ],
    },
  },
  'lateral-raise': {
    es: {
      summary:
        'Elevaciones laterales con mancuernas para el deltoides medio. Cue principal: sube los brazos **ligeramente por delante del cuerpo**, con **codos algo flexionados**, hasta la altura del hombro y baja controlando.',
      setup: [
        'De pie o sentado, mancuernas a los lados, **hombros atrás y abajo** y una ligera flexión de codo que no cambia.',
        'Una **ligera inclinación del torso hacia adelante** ayuda a que el trabajo caiga en el deltoides medio.',
      ],
      execution: [
        'Sube los brazos ligeramente por delante del cuerpo hasta la **altura del hombro**, con el **codo liderando** el movimiento, no la mano.',
        'Arriba, la mano no queda más alta que el codo y la palma mira al suelo.',
        'Baja **controlando** sin dejar caer las mancuernas al costado; no pierdas la tensión abajo.',
      ],
      mistakes: [
        '**Impulsar con el torso o las rodillas**: el peso es ligero y el movimiento sale solo del hombro.',
        '**Encoger los hombros** al subir: el trapecio roba el trabajo; hombros abajo.',
        '**Subir muy por encima del hombro**: no aporta más al deltoides y se va al trapecio.',
      ],
      notes: [
        'Es un ejercicio de **peso ligero y repeticiones altas**; si tienes que balancear, el peso es demasiado.',
      ],
    },
    en: {
      summary:
        'Dumbbell lateral raise for the side delts. Main cue: raise the arms **slightly in front of the body**, with **elbows slightly bent**, up to shoulder height and lower under control.',
      setup: [
        'Standing or seated, dumbbells at your sides, **shoulders back and down** and a slight elbow bend that does not change.',
        'A **slight forward lean of the torso** helps the work land on the side delt.',
      ],
      execution: [
        'Raise the arms slightly in front of the body up to **shoulder height**, with the **elbow leading** the movement, not the hand.',
        'At the top, the hand is never higher than the elbow and the palm faces the floor.',
        "Lower **under control** without dropping the dumbbells to your sides; don't lose tension at the bottom.",
      ],
      mistakes: [
        '**Driving with the torso or the knees**: the weight is light and the movement comes only from the shoulder.',
        '**Shrugging the shoulders** on the way up: the traps steal the work; shoulders down.',
        '**Raising well above the shoulder**: it adds nothing for the delt and shifts the work to the traps.',
      ],
      notes: [
        'It is a **light weight, high rep** exercise; if you have to swing, the weight is too much.',
      ],
    },
  },
  'cable-lateral-raise': {
    es: {
      summary:
        'Elevaciones laterales en polea baja a una mano. Cue principal: la polea da **tensión constante desde abajo**, así que sube el codo hasta el hombro **sin impulso** y baja lento.',
      setup: [
        '**Polea en la posición más baja**, con el asa en la mano contraria al lado de la torre.',
        'Colócate de lado a la torre y **sujétate con la mano libre** para mantener el torso quieto.',
        'El cable cruza por delante del cuerpo; empieza con la mano a la altura de la cadera opuesta.',
      ],
      execution: [
        'Sube el brazo ligeramente por delante del cuerpo hasta la **altura del hombro**, liderando con el codo.',
        'Mantén una ligera flexión de codo y **el hombro abajo**; no encojas al subir.',
        'Baja **controlando** todo el recorrido, aprovechando la tensión que la polea mantiene abajo.',
      ],
      mistakes: [
        '**Inclinar el torso** hacia la torre para ayudarte: sujétate y mantén el cuerpo vertical.',
        '**Girar la mano** hacia arriba al final: la palma mira al suelo.',
        '**Demasiado peso**: si el codo se dobla o el torso se mueve, baja la carga.',
      ],
      notes: [
        'Alternativa a las mancuernas cuando quieres **tensión en la parte baja** del recorrido, donde la mancuerna casi no carga.',
      ],
    },
    en: {
      summary:
        'Single-arm lateral raise from a low pulley. Main cue: the cable gives **constant tension from the bottom**, so raise the elbow to shoulder height **without momentum** and lower slowly.',
      setup: [
        '**Pulley at the lowest position**, with the handle in the hand opposite to the tower.',
        'Stand sideways to the tower and **hold on with the free hand** to keep the torso still.',
        'The cable crosses in front of the body; start with the hand at the opposite hip.',
      ],
      execution: [
        'Raise the arm slightly in front of the body up to **shoulder height**, leading with the elbow.',
        "Keep a slight elbow bend and **the shoulder down**; don't shrug on the way up.",
        'Lower **under control** through the whole range, using the tension the cable keeps at the bottom.',
      ],
      mistakes: [
        '**Leaning the torso** toward the tower to help: hold on and keep the body upright.',
        '**Turning the hand** upward at the end: the palm faces the floor.',
        '**Too much weight**: if the elbow bends or the torso moves, lower the load.',
      ],
      notes: [
        'Alternative to dumbbells when you want **tension at the bottom** of the range, where the dumbbell barely loads.',
      ],
    },
  },
  'rear-delt-fly': {
    es: {
      summary:
        'Aperturas para el deltoides posterior, inclinado con mancuernas. Cue principal: **torso casi paralelo al suelo**, codos ligeramente flexionados y abre los brazos **hacia los lados**, no hacia atrás.',
      setup: [
        'Inclínate desde la cadera con la **espalda neutra** hasta el torso casi paralelo al suelo, o siéntate en el borde de un banco con el pecho sobre los muslos.',
        'Mancuernas colgando debajo del pecho con las **palmas enfrentadas** y una ligera flexión de codo.',
      ],
      execution: [
        'Abre los brazos **hacia los lados** en arco hasta que queden a la altura del hombro, liderando con los codos.',
        'Mantén las **escápulas sin retraer** del todo: el movimiento es del hombro, no de la espalda.',
        'Baja controlando sin dejar caer las mancuernas ni perder la posición del torso.',
      ],
      mistakes: [
        '**Enderezar el torso** al subir el peso: el trabajo se va al trapecio y a la espalda.',
        '**Llevar los brazos hacia atrás** en lugar de a los lados: se convierte en un remo.',
        '**Demasiado peso**: el deltoides posterior es pequeño; balancear no lo hace crecer más.',
      ],
      notes: [
        'Puedes hacerlo en la **máquina de aperturas invertidas** con la misma técnica: codos altos y brazos hacia los lados.',
      ],
    },
    en: {
      summary:
        'Bent-over dumbbell fly for the rear delts. Main cue: **torso almost parallel to the floor**, elbows slightly bent, and open the arms **out to the sides**, not backward.',
      setup: [
        'Hinge from the hips with a **neutral back** until the torso is almost parallel to the floor, or sit on the edge of a bench with the chest over the thighs.',
        'Dumbbells hanging below the chest with the **palms facing each other** and a slight elbow bend.',
      ],
      execution: [
        'Open the arms **out to the sides** in an arc until they reach shoulder height, leading with the elbows.',
        'Keep the **shoulder blades from fully retracting**: the movement comes from the shoulder, not the back.',
        'Lower under control without dropping the dumbbells or losing the torso position.',
      ],
      mistakes: [
        '**Straightening the torso** as you raise the weight: the work shifts to the traps and the back.',
        '**Pulling the arms backward** instead of out to the sides: it turns into a row.',
        "**Too much weight**: the rear delt is a small muscle; swinging won't make it grow more.",
      ],
      notes: [
        'You can do it on the **reverse fly machine** with the same technique: elbows high and arms out to the sides.',
      ],
    },
  },
  'machine-shoulder-press': {
    es: {
      summary:
        'Press de hombro en máquina. Cue principal: la misma postura que en cualquier press — **escápulas juntas y pecho al cielo** — con **recorrido completo** hasta la altura del hombro.',
      setup: [
        '**Altura del asiento**: las agarraderas quedan a la altura del hombro o un poco más abajo en el punto de inicio.',
        'Espalda apoyada, **escápulas ligeramente retraídas** y pecho arriba; no te hundas en el respaldo.',
        'Pies firmes en el suelo para no perder estabilidad al empujar.',
      ],
      execution: [
        'Empuja hasta **casi extender** los codos sin bloquearlos ni encoger los hombros arriba.',
        'Baja **controlando** hasta la altura del hombro o el máximo que la máquina permita sin dolor.',
        'Los codos van **debajo de las manos**, ligeramente por delante del torso (plano escapular).',
      ],
      mistakes: [
        '**Medios recorridos**: bajar solo a la altura de la oreja porque el peso es alto.',
        '**Arquear la espalda** despegándola del respaldo: el press se vuelve inclinado y la lumbar carga.',
        '**Encoger los hombros** al empujar: el trapecio roba el trabajo al deltoides.',
      ],
      notes: [
        'Buena opción para llevar el hombro **al fallo con seguridad** o cuando la estabilidad limita los presses libres.',
      ],
    },
    en: {
      summary:
        'Machine shoulder press. Main cue: the same posture as in any press — **shoulder blades together and chest to the sky** — with **full range of motion** down to shoulder height.',
      setup: [
        '**Seat height**: the handles sit at shoulder height or a little lower at the starting point.',
        "Back supported, **shoulder blades slightly retracted** and chest up; don't sink into the backrest.",
        "Feet firmly on the floor so you don't lose stability when pressing.",
      ],
      execution: [
        'Press until the elbows are **almost extended**, without locking them or shrugging the shoulders at the top.',
        'Lower **under control** to shoulder height or as far as the machine allows without pain.',
        'The elbows stay **under the hands**, slightly in front of the torso (scapular plane).',
      ],
      mistakes: [
        '**Half reps**: lowering only to ear height because the weight is high.',
        '**Arching the back** off the backrest: the press becomes an incline and the lower back takes the load.',
        '**Shrugging the shoulders** as you press: the traps steal the work from the delts.',
      ],
      notes: [
        'A good option to take the shoulders **to failure safely** or when stability limits the free-weight presses.',
      ],
    },
  },
  pullover: {
    es: {
      summary:
        'Pullover con mancuerna acostado en banco: lleva el peso **por detrás de la cabeza** con los codos casi fijos y vuelve sobre el pecho. Cue principal: el movimiento sale **del hombro**, no del codo.',
      setup: [
        'Acostado a lo largo del banco, pies firmes en el suelo y **cadera baja**; también puedes cruzarte con solo la espalda alta apoyada.',
        'Sostén una mancuerna con **ambas manos** en forma de rombo bajo el disco superior, brazos casi extendidos sobre el pecho.',
      ],
      execution: [
        'Baja el peso en arco **por detrás de la cabeza** controlando, con una ligera flexión de codo que no cambia.',
        'Baja solo hasta donde sientas **estiramiento en dorsal y pecho** sin que la lumbar se arquee de más.',
        'Vuelve por el mismo arco hasta que la mancuerna quede **sobre el pecho**, no sobre la cara.',
      ],
      mistakes: [
        '**Doblar los codos** al bajar: lo convierte en una extensión de tríceps.',
        '**Arquear la lumbar** para bajar más: mantén el abdomen firme y el rango que tu hombro permita.',
        '**Demasiado peso**: es un ejercicio de estiramiento; si no controlas la bajada, baja la carga.',
      ],
      notes: [
        'Trabaja dorsal y pecho a la vez; según dónde lo sientas, encaja en el día de espalda o en el de pecho.',
      ],
    },
    en: {
      summary:
        'Dumbbell pullover lying on a bench: bring the weight **behind the head** with the elbows almost fixed and return over the chest. Main cue: the movement comes **from the shoulder**, not the elbow.',
      setup: [
        'Lying along the bench, feet firmly on the floor and **hips low**; you can also lie across it with only the upper back supported.',
        'Hold one dumbbell with **both hands** in a diamond shape under the top plate, arms almost extended over the chest.',
      ],
      execution: [
        'Lower the weight in an arc **behind the head** under control, with a slight elbow bend that does not change.',
        'Go only as far as you feel a **stretch in the lats and chest** without over-arching the lower back.',
        'Return along the same arc until the dumbbell is **over the chest**, not over the face.',
      ],
      mistakes: [
        '**Bending the elbows** on the way down: it turns into a triceps extension.',
        '**Arching the lower back** to go deeper: keep the abs braced and the range your shoulder allows.',
        "**Too much weight**: it is a stretch exercise; if you can't control the descent, lower the load.",
      ],
      notes: [
        'It works the lats and chest at the same time; depending on where you feel it, it fits on back day or chest day.',
      ],
    },
  },
  'machine-row': {
    es: {
      summary:
        'Remo en máquina con apoyo de pecho. Cue principal: **pecho pegado al apoyo**, tira con los **codos hacia atrás** y junta las escápulas al final sin levantar el torso.',
      setup: [
        '**Altura del asiento**: las agarraderas quedan a la altura del pecho medio y el apoyo justo bajo el esternón.',
        'Elige el agarre según el objetivo: **neutro** cerrado para el dorsal, **prono** ancho con codos abiertos para la espalda alta.',
        'Pies firmes en la plataforma y brazos extendidos al inicio, dejando que las escápulas se adelanten un poco.',
      ],
      execution: [
        'Tira llevando los **codos hacia atrás** hasta que las manos queden junto al torso, sin despegar el pecho del apoyo.',
        'Al final, **junta las escápulas** y aguanta un segundo.',
        'Vuelve **controlando** hasta extender del todo los brazos y sentir el estiramiento en el dorsal.',
      ],
      mistakes: [
        '**Despegar el pecho del apoyo** para tirar más: el peso es demasiado.',
        '**Tirar con los brazos** encogiendo los hombros: los codos van atrás, los hombros abajo.',
        '**Recorrido corto**: extiende del todo entre repeticiones.',
      ],
      notes: [
        'El apoyo de pecho quita la lumbar de la ecuación, ideal para **ir al fallo** sin que la espalda baja limite.',
      ],
    },
    en: {
      summary:
        'Chest-supported machine row. Main cue: **chest pinned to the pad**, pull with the **elbows back** and squeeze the shoulder blades at the end without lifting the torso.',
      setup: [
        '**Seat height**: the handles sit at mid-chest height and the pad rests just below the sternum.',
        'Pick the grip by goal: close **neutral** for the lats, wide **pronated** with flared elbows for the upper back.',
        'Feet firmly on the platform and arms extended at the start, letting the shoulder blades drift forward a little.',
      ],
      execution: [
        'Pull driving the **elbows back** until the hands are next to the torso, without the chest leaving the pad.',
        'At the end, **squeeze the shoulder blades together** and hold for a second.',
        'Return **under control** until the arms are fully extended and you feel the stretch in the lats.',
      ],
      mistakes: [
        '**Lifting the chest off the pad** to pull more: the weight is too much.',
        '**Pulling with the arms** while shrugging: elbows go back, shoulders stay down.',
        '**Short range**: fully extend between reps.',
      ],
      notes: [
        'The chest pad takes the lower back out of the equation, ideal for **going to failure** without the lower back limiting you.',
      ],
    },
  },
  'dumbbell-row': {
    es: {
      summary:
        'Remo a una mano con mancuerna apoyado en banco. Cue principal: **espalda neutra y torso quieto**, tira con el **codo hacia la cadera** y baja hasta estirar por completo.',
      setup: [
        'Apoya la **rodilla y la mano del mismo lado** en el banco; el otro pie firme en el suelo y la mancuerna en la mano libre.',
        'Torso casi paralelo al suelo, **espalda neutra** y cabeza en línea con la columna.',
      ],
      execution: [
        'Tira llevando el **codo hacia la cadera**, pegado al cuerpo, hasta que la mancuerna llegue al costado.',
        'Arriba, deja que la escápula se retraiga y **aguanta un segundo**.',
        'Baja **controlando** hasta estirar del todo el brazo, dejando que el hombro baje un poco al final.',
      ],
      mistakes: [
        '**Girar el torso** para subir el peso: los hombros quedan paralelos al suelo toda la serie.',
        '**Tirar hacia el hombro** con el codo abierto: el trabajo se va al deltoides posterior y al trapecio.',
        '**Recorrido corto** con mucho peso: baja completo y ajusta la carga.',
      ],
      notes: [
        'Al ser unilateral, permite **igualar los dos lados** y usar el agarre neutro, más cómodo para el hombro.',
      ],
    },
    en: {
      summary:
        'One-arm dumbbell row supported on a bench. Main cue: **neutral back and still torso**, pull with the **elbow toward the hip** and lower until the arm is fully stretched.',
      setup: [
        'Rest the **knee and hand of the same side** on the bench; the other foot firmly on the floor and the dumbbell in the free hand.',
        'Torso almost parallel to the floor, **neutral back** and head in line with the spine.',
      ],
      execution: [
        'Pull driving the **elbow toward the hip**, close to the body, until the dumbbell reaches your side.',
        'At the top, let the shoulder blade retract and **hold for a second**.',
        'Lower **under control** until the arm is fully stretched, letting the shoulder drop a little at the end.',
      ],
      mistakes: [
        '**Twisting the torso** to raise the weight: the shoulders stay parallel to the floor the whole set.',
        '**Pulling toward the shoulder** with a flared elbow: the work shifts to the rear delt and the traps.',
        '**Short range** with heavy weight: lower all the way and adjust the load.',
      ],
      notes: [
        'Being unilateral, it lets you **even out both sides** and use the neutral grip, which is easier on the shoulder.',
      ],
    },
  },
  'seated-cable-row': {
    es: {
      summary:
        'Remo sentado en polea baja (Gironda). Cue principal: **torso vertical y quieto**, tira con los **codos hacia atrás** llevando el agarre al abdomen y junta las escápulas al final.',
      setup: [
        'Sentado con las **rodillas ligeramente flexionadas** y los pies firmes en la plataforma.',
        'Agarre neutro cerrado (triángulo) por defecto; con barra y agarre prono ancho los codos van más abiertos.',
        'Espalda neutra, **pecho fuera** y brazos extendidos al inicio.',
      ],
      execution: [
        'Tira llevando los **codos hacia atrás** hasta que el agarre toque el abdomen bajo.',
        'Al final, **junta las escápulas** y saca pecho; aguanta un segundo.',
        'Vuelve **controlando** hasta extender los brazos, dejando que las escápulas se adelanten para estirar el dorsal.',
        'El torso puede inclinarse un poco al estirar y volver a la vertical al tirar, pero **no se balancea** para mover el peso.',
      ],
      mistakes: [
        '**Balancear el torso** hacia atrás para tirar: la lumbar carga y el dorsal trabaja menos.',
        '**Encoger los hombros** al tirar: los hombros van abajo, los codos atrás.',
        '**Curvar la espalda** en la fase de estiramiento: espalda neutra durante toda la serie.',
      ],
    },
    en: {
      summary:
        'Seated low-pulley row (Gironda). Main cue: **upright, still torso**, pull with the **elbows back** bringing the handle to the belly and squeeze the shoulder blades at the end.',
      setup: [
        'Seated with the **knees slightly bent** and the feet firmly on the platform.',
        'Close neutral grip (V-handle) by default; with a bar and a wide pronated grip the elbows flare more.',
        'Neutral back, **chest out** and arms extended at the start.',
      ],
      execution: [
        'Pull driving the **elbows back** until the handle touches the lower belly.',
        'At the end, **squeeze the shoulder blades together** and push the chest out; hold for a second.',
        'Return **under control** until the arms are extended, letting the shoulder blades drift forward to stretch the lats.',
        'The torso may lean a little forward on the stretch and return to vertical on the pull, but it **never swings** to move the weight.',
      ],
      mistakes: [
        '**Swinging the torso** back to pull: the lower back takes the load and the lats work less.',
        '**Shrugging the shoulders** as you pull: shoulders go down, elbows go back.',
        '**Rounding the back** in the stretch phase: neutral back through the whole set.',
      ],
    },
  },
  't-bar-row': {
    es: {
      summary:
        'Remo T con barra anclada o en máquina. Cue principal: **espalda neutra con el torso inclinado** unos 45 grados, tira con los **codos hacia atrás** llevando el peso al pecho bajo y baja controlando.',
      setup: [
        'Pies a la anchura de los hombros a los lados de la barra, **rodillas ligeramente flexionadas**.',
        'Inclínate desde la cadera con la espalda neutra hasta unos 45 grados; el torso **no cambia** de ángulo durante la serie.',
        'El agarre neutro cerrado lleva más al dorsal; el agarre prono ancho abre los codos y carga la espalda alta.',
      ],
      execution: [
        'Tira llevando los **codos hacia atrás** hasta que el peso toque la parte baja del pecho.',
        'Al final, **junta las escápulas** y aguanta un segundo sin enderezar el torso.',
        'Baja **controlando** hasta extender del todo los brazos y sentir el estiramiento en el dorsal.',
      ],
      mistakes: [
        '**Enderezar el torso** para subir el peso: es un remo, no un peso muerto.',
        '**Curvar la espalda**: si no puedes mantenerla neutra, baja la carga.',
        '**Recorrido corto** por discos grandes que chocan con el pecho: usa discos pequeños.',
      ],
      notes: [
        'Si la versión libre carga la lumbar, la **máquina con apoyo de pecho** te deja ir al fallo con la misma técnica.',
      ],
    },
    en: {
      summary:
        'T-bar row with a landmine bar or on the machine. Main cue: **neutral back with the torso leaning** about 45 degrees, pull with the **elbows back** bringing the weight to the lower chest and lower under control.',
      setup: [
        'Feet at shoulder width on either side of the bar, **knees slightly bent**.',
        'Hinge from the hips with a neutral back to about 45 degrees; the torso angle **does not change** during the set.',
        'A close neutral grip shifts more to the lats; a wide pronated grip flares the elbows and loads the upper back.',
      ],
      execution: [
        'Pull driving the **elbows back** until the weight touches the lower chest.',
        'At the end, **squeeze the shoulder blades together** and hold for a second without straightening the torso.',
        'Lower **under control** until the arms are fully extended and you feel the stretch in the lats.',
      ],
      mistakes: [
        '**Straightening the torso** to raise the weight: it is a row, not a deadlift.',
        "**Rounding the back**: if you can't keep it neutral, lower the load.",
        '**Short range** because big plates hit the chest: use smaller plates.',
      ],
      notes: [
        'If the free version loads the lower back, the **chest-supported machine** lets you go to failure with the same technique.',
      ],
    },
  },
  'hack-squat': {
    es: {
      summary:
        'Hack squat en máquina para cuádriceps. Cue principal: **espalda y cadera pegadas al respaldo**, baja todo lo que puedas controlando y sube empujando con todo el pie.',
      setup: [
        '**Pies** a la anchura de los hombros en la parte media de la plataforma; más bajos cargan más el cuádriceps, más altos el glúteo.',
        'Hombros bajo las almohadillas, **espalda y cadera pegadas al respaldo** en todo momento.',
        'Puntas de los pies ligeramente hacia fuera y las rodillas siguiendo esa línea.',
      ],
      execution: [
        'Baja **controlando** todo lo que tu movilidad permita sin que la cadera se despegue del respaldo.',
        'Sube empujando con **todo el pie**, sin bloquear las rodillas arriba.',
        'Las **rodillas siguen la línea de los pies**; no dejes que se metan hacia dentro.',
      ],
      mistakes: [
        '**Despegar la cadera** del respaldo abajo: la lumbar se curva; reduce el rango o sube un poco los pies.',
        '**Rodillas hacia dentro** al subir: empuja las rodillas hacia las puntas de los pies.',
        '**Recorrido corto** con mucho peso: baja completo y ajusta la carga.',
      ],
      notes: [
        'Alternativa a la sentadilla cuando la técnica o la movilidad limitan, o para **llevar el cuádriceps al fallo** con seguridad.',
      ],
    },
    en: {
      summary:
        'Machine hack squat for the quads. Main cue: **back and hips pinned to the backrest**, lower as far as you can under control and come up pushing through the whole foot.',
      setup: [
        '**Feet** at shoulder width in the middle of the platform; lower loads the quads more, higher loads the glutes more.',
        'Shoulders under the pads, **back and hips pinned to the backrest** at all times.',
        'Toes pointing slightly out and the knees tracking that line.',
      ],
      execution: [
        'Lower **under control** as far as your mobility allows without the hips leaving the backrest.',
        'Come up pushing through the **whole foot**, without locking the knees at the top.',
        "The **knees track the toes**; don't let them cave in.",
      ],
      mistakes: [
        '**Hips leaving the backrest** at the bottom: the lower back rounds; shorten the range or move the feet a little higher.',
        '**Knees caving in** on the way up: push the knees toward the toes.',
        '**Short range** with heavy weight: lower all the way and adjust the load.',
      ],
      notes: [
        'An alternative to the squat when technique or mobility limit you, or to **take the quads to failure** safely.',
      ],
    },
  },
  'bulgarian-split-squat': {
    es: {
      summary:
        'Sentadilla búlgara: sentadilla a una pierna con el pie trasero elevado en un banco. Cue principal: el **peso en la pierna delantera**, torso estable y baja hasta que el muslo quede paralelo o más.',
      setup: [
        'Pie trasero apoyado sobre un **banco a la altura de la rodilla** o algo más bajo, con el empeine o la punta del pie.',
        'Pie delantero lo bastante adelante para que, al bajar, la **rodilla no se pase mucho de la punta del pie** y el talón no se despegue.',
        'Mancuernas a los lados; torso ligeramente inclinado hacia adelante y espalda neutra.',
      ],
      execution: [
        'Baja **controlando** flexionando la rodilla delantera hasta que el muslo quede paralelo al suelo o la rodilla trasera casi toque.',
        'Sube empujando con **todo el pie delantero**, sin ayudarte con el pie trasero.',
        'La **rodilla sigue la línea del pie**; no la dejes irse hacia dentro.',
        'Haz todas las repeticiones de una pierna antes de cambiar.',
      ],
      mistakes: [
        '**Empujar con la pierna trasera**: solo apoya; el trabajo lo hace la delantera.',
        '**Pie delantero muy cerca del banco**: el talón se despega y la rodilla carga de más.',
        '**Perder el equilibrio** por exceso de peso: domina el movimiento con el peso corporal primero.',
      ],
      notes: [
        'Torso más vertical carga más el cuádriceps; con más inclinación, glúteo e isquios. Grábate para comprobar el rango.',
      ],
    },
    en: {
      summary:
        'Bulgarian split squat: a single-leg squat with the rear foot elevated on a bench. Main cue: **weight on the front leg**, stable torso and lower until the thigh is parallel or deeper.',
      setup: [
        'Rear foot resting on a **bench at knee height** or a bit lower, on the instep or the toes.',
        "Front foot far enough forward so that, as you lower, the **knee doesn't travel far past the toes** and the heel stays down.",
        'Dumbbells at your sides; torso leaning slightly forward and neutral back.',
      ],
      execution: [
        'Lower **under control** bending the front knee until the thigh is parallel to the floor or the rear knee almost touches.',
        'Come up pushing through the **whole front foot**, without helping with the rear foot.',
        "The **knee tracks the foot**; don't let it cave in.",
        'Do all the reps on one leg before switching.',
      ],
      mistakes: [
        '**Pushing with the rear leg**: it only supports; the front leg does the work.',
        '**Front foot too close to the bench**: the heel lifts and the knee takes too much load.',
        '**Losing balance** from too much weight: master the movement with body weight first.',
      ],
      notes: [
        'A more upright torso loads the quads more; more forward lean, the glutes and hamstrings. Film yourself to check the range.',
      ],
    },
  },
  'preacher-curl': {
    es: {
      summary:
        'Curl Scott en banco predicador. Cue principal: **axilas pegadas al borde del banco**, extensión casi completa abajo controlando y subida sin despegar los brazos del apoyo.',
      setup: [
        '**Altura del asiento**: las axilas apoyan justo sobre el borde superior de la almohadilla y la parte trasera del brazo queda pegada.',
        'Barra EZ, barra recta o mancuerna; agarre a la anchura de los hombros con las **palmas hacia arriba**.',
        'Pecho fuera y hombros atrás; el torso no se inclina sobre el banco.',
      ],
      execution: [
        'Baja **controlando** hasta casi extender del todo el codo, sin soltar la tensión abajo.',
        'Sube flexionando solo el codo hasta que el antebrazo quede vertical y **aprieta arriba** un segundo.',
        'Los **brazos no se despegan** de la almohadilla en ningún momento.',
      ],
      mistakes: [
        '**Levantar los codos** de la almohadilla al subir: los hombros entran y el bíceps pierde trabajo.',
        '**Bajar a golpe** con el brazo extendido: la posición de estiramiento es donde más carga hay; controla.',
        '**Muñecas dobladas** hacia atrás: mantenlas rectas o ligeramente flexionadas.',
      ],
      notes: [
        'La almohadilla elimina el impulso y carga mucho el **estiramiento**, por eso suele hacerse con menos peso que el curl con barra.',
      ],
    },
    en: {
      summary:
        'Preacher curl on the preacher bench. Main cue: **armpits pinned to the top edge of the pad**, near-full extension at the bottom under control and no lifting of the arms off the pad on the way up.',
      setup: [
        '**Seat height**: the armpits rest right over the top edge of the pad and the back of the upper arm stays in contact.',
        'EZ bar, straight bar or dumbbell; shoulder-width grip with the **palms facing up**.',
        "Chest out and shoulders back; the torso doesn't lean over the bench.",
      ],
      execution: [
        'Lower **under control** until the elbow is almost fully extended, without releasing the tension at the bottom.',
        'Curl by bending only the elbow until the forearm is vertical and **squeeze at the top** for a second.',
        'The **arms never leave** the pad at any point.',
      ],
      mistakes: [
        '**Lifting the elbows** off the pad on the way up: the shoulders join in and the biceps loses work.',
        '**Dropping into the bottom** with the arm extended: the stretched position carries the most load; control it.',
        '**Wrists bent** backward: keep them straight or slightly flexed.',
      ],
      notes: [
        'The pad removes momentum and heavily loads the **stretch**, which is why it is usually done with less weight than the barbell curl.',
      ],
    },
  },
  'spider-curl': {
    es: {
      summary:
        'Spider curl: curl boca abajo en banco inclinado con los brazos colgando verticales. Cue principal: **brazos perpendiculares al suelo** y sube apretando el bíceps sin mover los codos.',
      setup: [
        'Banco a **unos 45 grados**; acuéstate boca abajo con el pecho apoyado en la parte alta y los pies en el suelo.',
        'Mancuernas o barra EZ colgando **con los brazos verticales**, palmas hacia adelante.',
      ],
      execution: [
        'Sube flexionando solo el codo hasta la **contracción máxima** y aprieta un segundo arriba.',
        'Baja **controlando** hasta extender del todo el brazo, con los codos apuntando al suelo.',
        'Los **codos no se mueven** hacia adelante ni hacia atrás en toda la serie.',
      ],
      mistakes: [
        '**Balancear las mancuernas** para subirlas: aquí no hay impulso posible; baja el peso.',
        '**Adelantar los codos** al subir: el hombro entra y el bíceps pierde tensión arriba.',
        '**Despegar el pecho** del banco: el torso quieto es lo que aísla el bíceps.',
      ],
      notes: [
        'Con el brazo por delante del cuerpo carga más la **parte alta del recorrido** (contracción); complementa al curl inclinado.',
      ],
    },
    en: {
      summary:
        'Spider curl: a curl lying face down on an incline bench with the arms hanging vertically. Main cue: **arms perpendicular to the floor** and curl squeezing the biceps without moving the elbows.',
      setup: [
        'Bench at **about 45 degrees**; lie face down with the chest resting on the top and the feet on the floor.',
        'Dumbbells or EZ bar hanging **with the arms vertical**, palms facing forward.',
      ],
      execution: [
        'Curl by bending only the elbow up to **peak contraction** and squeeze for a second at the top.',
        'Lower **under control** until the arm is fully extended, with the elbows pointing at the floor.',
        'The **elbows never move** forward or backward during the set.',
      ],
      mistakes: [
        '**Swinging the dumbbells** to get them up: there is no momentum possible here; lower the weight.',
        '**Letting the elbows drift forward** on the way up: the shoulder joins in and the biceps loses tension at the top.',
        '**Lifting the chest** off the bench: the still torso is what isolates the biceps.',
      ],
      notes: [
        'With the arm in front of the body it loads the **top of the range** (contraction) more; it complements the incline curl.',
      ],
    },
  },
  'incline-dumbbell-curl': {
    es: {
      summary:
        'Curl con mancuernas en banco inclinado, con los brazos colgando por detrás del torso. Cue principal: **hombros atrás y codos fijos**, extensión completa abajo y subida sin adelantar los codos.',
      setup: [
        'Banco a **45–60 grados**; espalda y cabeza apoyadas, pies firmes en el suelo.',
        'Mancuernas colgando con los **brazos verticales** y detrás de la línea del torso; palmas hacia adelante.',
      ],
      execution: [
        'Sube flexionando solo el codo, **supinando** la mano si empiezas en neutro, hasta la contracción máxima.',
        'Baja **controlando** hasta estirar del todo el brazo; abajo sientes el estiramiento del bíceps.',
        'Los **codos no se adelantan** hacia el torso en ningún momento.',
      ],
      mistakes: [
        '**Adelantar los codos** para subir más: pierdes el estiramiento que da sentido al ejercicio.',
        '**Adelantar los hombros** o despegar la espalda del banco: mantén el apoyo.',
        '**Demasiado peso**: la posición estirada es exigente; baja la carga antes que acortar el recorrido.',
      ],
      notes: [
        'El brazo por detrás del torso carga la **parte baja del recorrido** (estiramiento); complementa al spider curl.',
      ],
    },
    en: {
      summary:
        'Dumbbell curl on an incline bench, with the arms hanging behind the torso. Main cue: **shoulders back and elbows fixed**, full extension at the bottom and no elbow drift on the way up.',
      setup: [
        'Bench at **45–60 degrees**; back and head supported, feet firmly on the floor.',
        'Dumbbells hanging with the **arms vertical** and behind the line of the torso; palms facing forward.',
      ],
      execution: [
        'Curl by bending only the elbow, **supinating** the hand if you start neutral, up to peak contraction.',
        'Lower **under control** until the arm is fully stretched; at the bottom you feel the biceps stretch.',
        'The **elbows never drift forward** toward the torso at any point.',
      ],
      mistakes: [
        '**Letting the elbows drift forward** to curl higher: you lose the stretch that gives the exercise its purpose.',
        '**Rolling the shoulders forward** or lifting the back off the bench: keep the support.',
        '**Too much weight**: the stretched position is demanding; lower the load before shortening the range.',
      ],
      notes: [
        'The arm behind the torso loads the **bottom of the range** (stretch); it complements the spider curl.',
      ],
    },
  },
  'tricep-pushdown': {
    es: {
      summary:
        'Extensiones de tríceps en polea alta. Cue principal: **codos pegados al costado y fijos**, extiende hasta bloquear abajo y sube controlando sin que los codos se adelanten.',
      setup: [
        '**Polea en la posición alta**, con cuerda, barra recta o barra en V.',
        'De pie, un paso atrás de la torre, **ligera inclinación hacia adelante** y pecho fuera.',
        'Codos a los lados del torso, ligeramente por delante de la cadera; esa posición no cambia.',
      ],
      execution: [
        'Extiende los codos hasta **bloquear abajo** y aprieta el tríceps un segundo.',
        'Con cuerda, **separa las manos** al final del recorrido para extender del todo.',
        'Sube **controlando** hasta que el antebrazo pase la horizontal, sin que los codos se muevan.',
      ],
      mistakes: [
        '**Adelantar los codos** al subir el peso: los hombros entran y el tríceps pierde trabajo.',
        '**Inclinar el torso** y empujar con el peso del cuerpo: si pasa, la carga es demasiada.',
        '**Recorrido corto** arriba o sin bloquear abajo: la extensión completa es el ejercicio.',
      ],
      notes: [
        'Cuerda, barra recta o V trabajan el mismo músculo; elige el agarre que **no moleste la muñeca ni el codo**.',
      ],
    },
    en: {
      summary:
        'Triceps pushdown on a high pulley. Main cue: **elbows pinned to your sides and fixed**, extend to lockout at the bottom and return under control without the elbows drifting forward.',
      setup: [
        '**Pulley at the top position**, with a rope, straight bar or V-bar.',
        'Standing one step back from the tower, **slight forward lean** and chest out.',
        'Elbows at the sides of the torso, slightly ahead of the hips; that position does not change.',
      ],
      execution: [
        'Extend the elbows to **lockout at the bottom** and squeeze the triceps for a second.',
        'With a rope, **spread the hands apart** at the end of the range to extend fully.',
        'Return **under control** until the forearm passes horizontal, without the elbows moving.',
      ],
      mistakes: [
        '**Letting the elbows drift forward** as the weight comes up: the shoulders join in and the triceps loses work.',
        '**Leaning the torso** and pushing with body weight: if it happens, the load is too much.',
        '**Short range** at the top or no lockout at the bottom: full extension is the exercise.',
      ],
      notes: [
        "Rope, straight bar or V-bar work the same muscle; pick the attachment that **doesn't bother the wrist or elbow**.",
      ],
    },
  },
  'overhead-tricep-extension': {
    es: {
      summary:
        'Extensión de tríceps con una mancuerna a dos manos por encima de la cabeza. Cue principal: **codos apuntando al techo y cerca de la cabeza**, baja hasta estirar el tríceps y extiende sin mover los brazos.',
      setup: [
        'Sentado con **respaldo** o de pie, pecho fuera, escápulas ligeramente juntas y abdomen firme.',
        'Sostén la mancuerna con **ambas manos** en forma de rombo bajo el disco superior, brazos extendidos sobre la cabeza.',
      ],
      execution: [
        'Baja **controlando** flexionando solo el codo hasta que la mancuerna quede por detrás de la nuca y sientas el estiramiento.',
        'Extiende hasta **casi bloquear** arriba, apretando el tríceps.',
        'Los **codos se mantienen cerca de la cabeza** y apuntando al techo, sin abrirse hacia los lados.',
      ],
      mistakes: [
        '**Abrir los codos** hacia los lados: el hombro entra y el tríceps pierde tensión.',
        '**Arquear la lumbar** para bajar más: mantén el abdomen firme y el rango que el hombro permita.',
        '**Recorrido corto** por exceso de peso: la parte estirada es la que más aporta; baja la carga.',
      ],
      notes: [
        'La posición sobre la cabeza carga la **cabeza larga** del tríceps en estiramiento; si el hombro no permite la posición, usa la polea.',
      ],
    },
    en: {
      summary:
        'Two-hand dumbbell overhead triceps extension. Main cue: **elbows pointing at the ceiling and close to the head**, lower until the triceps stretch and extend without moving the upper arms.',
      setup: [
        'Seated with a **backrest** or standing, chest out, shoulder blades slightly together and abs braced.',
        'Hold the dumbbell with **both hands** in a diamond shape under the top plate, arms extended overhead.',
      ],
      execution: [
        'Lower **under control** bending only the elbow until the dumbbell is behind the neck and you feel the stretch.',
        'Extend to **almost lockout** at the top, squeezing the triceps.',
        'The **elbows stay close to the head** and pointing at the ceiling, without flaring out to the sides.',
      ],
      mistakes: [
        '**Flaring the elbows** out to the sides: the shoulder joins in and the triceps loses tension.',
        '**Arching the lower back** to go deeper: keep the abs braced and the range the shoulder allows.',
        '**Short range** from too much weight: the stretched portion gives the most; lower the load.',
      ],
      notes: [
        "The overhead position loads the **long head** of the triceps under stretch; if the shoulder doesn't allow the position, use the cable.",
      ],
    },
  },
  'cable-overhead-extension': {
    es: {
      summary:
        'Extensión de tríceps en polea por encima de la cabeza, con cuerda. Cue principal: **de espaldas a la torre, codos junto a la cabeza** y extiende hacia adelante sin que se abran.',
      setup: [
        '**Polea baja o media** con la cuerda; agárrala y date la vuelta quedando de espaldas a la torre.',
        'Un pie adelante, **torso inclinado hacia adelante** y abdomen firme; los brazos arrancan flexionados junto a la cabeza.',
      ],
      execution: [
        'Extiende los codos **hacia adelante y arriba** hasta bloquear, separando las manos al final.',
        'Vuelve **controlando** hasta que las manos queden por detrás de la cabeza y sientas el estiramiento.',
        'Los **codos no se abren** ni bajan durante la serie; solo se mueve el antebrazo.',
      ],
      mistakes: [
        '**Abrir los codos** al extender: el hombro entra y el tríceps pierde tensión.',
        '**Perder la inclinación** del torso enderezándote para mover el peso.',
        '**Arquear la lumbar**: abdomen firme y un pie adelante para tener base.',
      ],
      notes: [
        'La polea mantiene **tensión constante** en toda la extensión; es la alternativa a la mancuerna cuando quieres tensión en todo el recorrido.',
      ],
    },
    en: {
      summary:
        'Overhead cable triceps extension with a rope. Main cue: **back to the tower, elbows next to the head** and extend forward without letting them flare.',
      setup: [
        '**Low or mid pulley** with the rope; grab it and turn around so your back faces the tower.',
        'One foot forward, **torso leaning forward** and abs braced; the arms start bent next to the head.',
      ],
      execution: [
        'Extend the elbows **forward and up** to lockout, spreading the hands apart at the end.',
        'Return **under control** until the hands are behind the head and you feel the stretch.',
        'The **elbows never flare** or drop during the set; only the forearm moves.',
      ],
      mistakes: [
        '**Flaring the elbows** as you extend: the shoulder joins in and the triceps loses tension.',
        '**Losing the forward lean** by straightening up to move the weight.',
        '**Arching the lower back**: abs braced and one foot forward for a base.',
      ],
      notes: [
        'The cable keeps **constant tension** through the whole extension; it is the alternative to the dumbbell when you want tension across the full range.',
      ],
    },
  },
  'french-press': {
    es: {
      summary:
        'Press francés con barra EZ o recta por encima de la cabeza, sentado o de pie. Cue principal: **codos apuntando al techo y cerca de la cabeza**, baja la barra por detrás de la nuca controlando y extiende sin abrir los brazos.',
      setup: [
        'Sentado con **respaldo** (o de pie con el abdomen firme), pecho fuera y escápulas ligeramente juntas.',
        'Agarre cerrado, algo más estrecho que los hombros; la **barra EZ** suele ser más cómoda para la muñeca.',
        'Barra extendida sobre la cabeza, brazos verticales.',
      ],
      execution: [
        'Baja **controlando** flexionando solo el codo hasta que la barra quede por detrás de la nuca.',
        'Extiende hasta **casi bloquear** arriba, apretando el tríceps.',
        'Los **codos se mantienen cerca de la cabeza**, sin abrirse ni adelantarse.',
      ],
      mistakes: [
        '**Abrir los codos** hacia los lados: el hombro entra y el tríceps pierde tensión.',
        '**Arquear la lumbar** al bajar: mantén el abdomen firme, sobre todo de pie.',
        '**Bajar a golpe**: la posición estirada es la más exigente; controla.',
      ],
      notes: [
        'Es la versión **de pie o sentado** de la extensión sobre la cabeza; el rompecráneos (acostado) es otro ejercicio del catálogo.',
      ],
    },
    en: {
      summary:
        'French press with an EZ or straight bar overhead, seated or standing. Main cue: **elbows pointing at the ceiling and close to the head**, lower the bar behind the neck under control and extend without flaring the arms.',
      setup: [
        'Seated with a **backrest** (or standing with the abs braced), chest out and shoulder blades slightly together.',
        'Close grip, a bit narrower than the shoulders; the **EZ bar** is usually easier on the wrist.',
        'Bar extended overhead, arms vertical.',
      ],
      execution: [
        'Lower **under control** bending only the elbow until the bar is behind the neck.',
        'Extend to **almost lockout** at the top, squeezing the triceps.',
        'The **elbows stay close to the head**, without flaring or drifting forward.',
      ],
      mistakes: [
        '**Flaring the elbows** out to the sides: the shoulder joins in and the triceps loses tension.',
        '**Arching the lower back** on the way down: keep the abs braced, especially when standing.',
        '**Dropping into the bottom**: the stretched position is the most demanding; control it.',
      ],
      notes: [
        'It is the **standing or seated** version of the overhead extension; the skullcrusher (lying) is a separate exercise in the catalog.',
      ],
    },
  },
  'cable-kickback': {
    es: {
      summary:
        'Kickback de tríceps en polea a una mano. Cue principal: **torso inclinado y brazo pegado al costado**, extiende el codo hacia atrás hasta bloquear y vuelve controlando sin mover el brazo.',
      setup: [
        '**Polea baja** (o a la altura de la cadera), con el asa o directamente el cable en una mano.',
        'Inclínate desde la cadera con **espalda neutra** hasta que el torso quede casi paralelo al suelo; apóyate con la otra mano en la torre.',
        'El **brazo pegado al costado** y paralelo al suelo, con el codo flexionado a 90 grados.',
      ],
      execution: [
        'Extiende el codo **hacia atrás** hasta bloquear el brazo, apretando el tríceps un segundo.',
        'Vuelve **controlando** a los 90 grados; el brazo no baja ni se separa del costado.',
        'Haz todas las repeticiones de un lado antes de cambiar.',
      ],
      mistakes: [
        '**Mover el brazo** (el hombro) para ayudarte: solo se mueve el antebrazo.',
        '**Enderezar el torso** al extender: mantén la inclinación toda la serie.',
        '**Demasiado peso**: es un ejercicio de aislamiento; si el codo baja, reduce la carga.',
      ],
      notes: [
        'La polea mantiene tensión donde la mancuerna la pierde; útil como **remate** al final del trabajo de tríceps.',
      ],
    },
    en: {
      summary:
        'Single-arm cable triceps kickback. Main cue: **torso leaning forward and upper arm pinned to your side**, extend the elbow back to lockout and return under control without moving the upper arm.',
      setup: [
        '**Low pulley** (or at hip height), with the handle or the bare cable in one hand.',
        'Hinge from the hips with a **neutral back** until the torso is almost parallel to the floor; support yourself on the tower with the other hand.',
        'The **upper arm pinned to your side** and parallel to the floor, with the elbow bent to 90 degrees.',
      ],
      execution: [
        'Extend the elbow **backward** to lockout, squeezing the triceps for a second.',
        "Return **under control** to 90 degrees; the upper arm doesn't drop or drift away from your side.",
        'Do all the reps on one side before switching.',
      ],
      mistakes: [
        '**Moving the upper arm** (the shoulder) to help: only the forearm moves.',
        '**Straightening the torso** as you extend: keep the lean the whole set.',
        '**Too much weight**: it is an isolation exercise; if the elbow drops, reduce the load.',
      ],
      notes: [
        'The cable keeps tension where the dumbbell loses it; useful as a **finisher** at the end of the triceps work.',
      ],
    },
  },
};
