import { eq, inArray, isNull, and } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  bodyMetrics,
  exercises,
  programs,
  progressPhotos,
  reminders,
  routines,
  setLogs,
  trainingDays,
  userPrograms,
  users,
  weekConfigs,
  workoutDayExercises,
  workoutDays,
  workoutLogs,
} from '@/db/schema';

const EXPORT_VERSION = 3;

/** Everything the user owns as one JSON document. Identity/entitlement fields and device paths are
 * excluded; ids ship for in-file integrity and are regenerated on import.
 *
 * `progressPhotos` carries **metadata only** (the image files never leave the device, and the
 * on-disk paths are meaningless elsewhere). It ships so the weight/date timeline is extractable —
 * it is deliberately absent from IMPORT_TABLES, since a row without its file is unusable. */
export const buildExport = (userId: string) => {
  const [u] = db.select().from(users).where(eq(users.id, userId)).all();

  // Enrolled trees are tagged with the enrollment id at every level; custom
  // authored templates hang off `programs.userId` with NULL userProgramId.
  const ups = db.select().from(userPrograms).where(eq(userPrograms.userId, userId)).all();
  const upIds = ups.map((p) => p.id);

  const ownPrograms = [
    ...db
      .select()
      .from(programs)
      .where(and(eq(programs.userId, userId), isNull(programs.userProgramId)))
      .all(),
    ...(upIds.length
      ? db.select().from(programs).where(inArray(programs.userProgramId, upIds)).all()
      : []),
  ];
  const programIds = ownPrograms.map((p) => p.id);

  const ownRoutines = programIds.length
    ? db.select().from(routines).where(inArray(routines.programId, programIds)).all()
    : [];
  const routineIds = ownRoutines.map((r) => r.id);

  const ownDays = routineIds.length
    ? db.select().from(workoutDays).where(inArray(workoutDays.routineId, routineIds)).all()
    : [];
  const dayIds = ownDays.map((d) => d.id);

  const ownSlots = dayIds.length
    ? db
        .select()
        .from(workoutDayExercises)
        .where(inArray(workoutDayExercises.workoutDayId, dayIds))
        .all()
    : [];
  const slotIds = ownSlots.map((s) => s.id);

  const ownConfigs = slotIds.length
    ? db.select().from(weekConfigs).where(inArray(weekConfigs.workoutDayExerciseId, slotIds)).all()
    : [];

  const logs = db.select().from(workoutLogs).where(eq(workoutLogs.userId, userId)).all();
  const logIds = logs.map((l) => l.id);

  return {
    app: 'metri',
    exportVersion: EXPORT_VERSION,
    exportedAt: Date.now(),
    profile: u
      ? {
          displayName: u.displayName,
          sex: u.sex,
          age: u.age,
          heightCm: u.heightCm,
          weightKg: u.weightKg,
          activityLevel: u.activityLevel,
          bodyFatPct: u.bodyFatPct,
        }
      : null,
    data: {
      exercises: db.select().from(exercises).where(eq(exercises.userId, userId)).all(),
      programs: ownPrograms,
      routines: ownRoutines,
      workoutDays: ownDays,
      workoutDayExercises: ownSlots,
      weekConfigs: ownConfigs,
      userPrograms: ups,
      workoutLogs: logs,
      setLogs: logIds.length
        ? db.select().from(setLogs).where(inArray(setLogs.workoutLogId, logIds)).all()
        : [],
      trainingDays: db.select().from(trainingDays).where(eq(trainingDays.userId, userId)).all(),
      reminders: db.select().from(reminders).where(eq(reminders.userId, userId)).all(),
      bodyMetrics: db.select().from(bodyMetrics).where(eq(bodyMetrics.userId, userId)).all(),
      progressPhotos: db
        .select({
          id: progressPhotos.id,
          takenAt: progressPhotos.takenAt,
          weightKg: progressPhotos.weightKg,
          note: progressPhotos.note,
        })
        .from(progressPhotos)
        .where(eq(progressPhotos.userId, userId))
        .all(),
    },
  };
};
