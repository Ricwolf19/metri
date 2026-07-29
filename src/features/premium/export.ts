import { eq, inArray } from 'drizzle-orm';
import * as FileSystem from 'expo-file-system/legacy';
import { Share } from 'react-native';

import { db } from '@/db/client';
import { reminders, setLogs, userPrograms, users, workoutLogs } from '@/db/schema';

/**
 * Gathers the user's own data into a plain JSON object. This is the "your data
 * is never held hostage" promise — free users can take everything with them.
 * Password material is never included.
 */
const buildExport = (userId: string) => {
  const [u] = db.select().from(users).where(eq(users.id, userId)).all();
  const user = u ?? null;

  const logs = db.select().from(workoutLogs).where(eq(workoutLogs.userId, userId)).all();
  const logIds = logs.map((l) => l.id);

  return {
    app: 'metri',
    exportVersion: 1,
    user,
    reminders: db.select().from(reminders).where(eq(reminders.userId, userId)).all(),
    programs: db.select().from(userPrograms).where(eq(userPrograms.userId, userId)).all(),
    workoutLogs: logs,
    setLogs: logIds.length
      ? db.select().from(setLogs).where(inArray(setLogs.workoutLogId, logIds)).all()
      : [],
  };
};

/** Writes the export to a JSON file and opens the OS share sheet. */
export const exportUserData = async (userId: string): Promise<void> => {
  const json = JSON.stringify(buildExport(userId), null, 2);
  const uri = `${FileSystem.documentDirectory}metri-export.json`;
  try {
    await FileSystem.writeAsStringAsync(uri, json);
    await Share.share({ url: uri, message: json, title: 'Metri data export' });
  } catch {
    // Fall back to sharing the raw JSON if the file write/share is unavailable.
    await Share.share({ message: json, title: 'Metri data export' });
  }
};
