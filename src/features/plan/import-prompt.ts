import type { Locale } from '@/i18n';

/** LLM prompt that interviews the user and emits a valid import file. Kept out of the i18n dictionaries:
 * a multi-KB document, not a UI string, and the en/es parity gate should not carry it. */

const SKELETON = `{
  "app": "metri",
  "exportVersion": 2,
  "exportedAt": 0,
  "profile": {
    "displayName": "string|null", "sex": "male|female|null", "age": 0,
    "heightCm": 0, "weightKg": 0,
    "activityLevel": "sedentary|light|moderate|active|very_active|null",
    "bodyFatPct": 0
  },
  "data": {
    "exercises": [{ "id": "ex-1", "name": "string", "category": "chest|back|legs|shoulders|arms|core|full_body|cardio", "equipment": "barbell|dumbbell|machine|cable|bodyweight|kettlebell|other" }],
    "programs": [{ "id": "prog-1", "name": "string", "description": "string" }],
    "routines": [{ "id": "rout-1", "programId": "prog-1", "name": "string", "orderIndex": 0, "weeks": 4 }],
    "workoutDays": [{ "id": "day-1", "routineId": "rout-1", "name": "string", "orderIndex": 0 }],
    "workoutDayExercises": [{ "id": "slot-1", "workoutDayId": "day-1", "exerciseId": "ex-1", "orderIndex": 0, "restSeconds": 120 }],
    "weekConfigs": [{ "id": "wc-1", "workoutDayExerciseId": "slot-1", "weekNumber": 1, "sets": 3, "reps": 8 }],
    "userPrograms": [{ "id": "up-1", "programId": "prog-1", "status": "active", "currentWeek": 1 }],
    "workoutLogs": [{ "id": "log-1", "userId": "me", "userProgramId": "up-1", "workoutDayId": "day-1", "status": "completed", "startedAt": "ISO-8601", "completedAt": "ISO-8601", "durationSeconds": 3600 }],
    "setLogs": [{ "id": "set-1", "workoutLogId": "log-1", "exerciseId": "ex-1", "setNumber": 1, "weightKg": 100, "reps": 8, "isWarmup": false }],
    "trainingDays": [{ "id": "td-1", "userId": "me", "date": "YYYY-MM-DD", "status": "trained|rest|skipped", "skipReason": "sick|busy|travel|injury|fatigue|deload|other|null" }],
    "reminders": []
  }
}`;

const RULES_EN = `Rules:
- Output ONLY the JSON document, no prose, no markdown fences.
- "exportVersion" must be exactly 2. "exportedAt" is epoch milliseconds.
- Ids are any unique strings; keep references consistent (a setLog's "exerciseId" must match an exercise "id"). The app regenerates all ids on import, so their shape does not matter.
- Weights in kg, heights in cm. Dates: "date" fields are local "YYYY-MM-DD"; timestamps are ISO-8601 or epoch-ms.
- Arrays may be empty; omit what the user does not have. Never invent history the user did not describe.`;

const RULES_ES = `Reglas:
- Devuelve SOLO el documento JSON, sin prosa ni bloques markdown.
- "exportVersion" debe ser exactamente 2. "exportedAt" es epoch en milisegundos.
- Los ids son cadenas unicas cualesquiera; manten las referencias consistentes (el "exerciseId" de un setLog debe coincidir con el "id" de un exercise). La app regenera todos los ids al importar.
- Pesos en kg, alturas en cm. Fechas: los campos "date" son "YYYY-MM-DD" local; los timestamps son ISO-8601 o epoch-ms.
- Los arrays pueden ir vacios; omite lo que el usuario no tenga. Nunca inventes historial que el usuario no haya descrito.`;

export const buildImportPrompt = (locale: Locale): string =>
  locale === 'es'
    ? `Eres un asistente que genera un archivo de importacion para Metri (app de entrenamiento). Entrevistame sobre mi historial: mis programas y rutinas, ejercicios, dias que entreno, pesos y repeticiones por sesion, y mis datos corporales. Cuando tengas suficiente informacion, genera el JSON siguiendo exactamente este esqueleto y reglas.\n\n${RULES_ES}\n\nEsqueleto:\n${SKELETON}`
    : `You are an assistant that generates an import file for Metri (a training app). Interview me about my history: my programs and routines, exercises, training days, weights and reps per session, and my body metrics. Once you have enough information, produce the JSON following exactly this skeleton and rules.\n\n${RULES_EN}\n\nSkeleton:\n${SKELETON}`;
