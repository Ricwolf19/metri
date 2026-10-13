#!/usr/bin/env bun
/**
 * Development only: seed three months of demo data into the running dev build.
 *
 *   bun run dev:seed          # Android emulator/device via adb
 *   bun run dev:seed --ios    # booted iOS simulator via simctl
 *
 * It opens the dev-only deep link `metri://dev/seed`; the app (a development
 * build, never Expo Go) wipes the current user's training, body and diary rows,
 * creates a local test lifter if the device has none, and writes the demo set
 * (`src/features/dev/demo-seed.ts`). A release build has no such screen.
 */
import { spawnSync } from 'node:child_process';

const PACKAGE = 'com.ricwolf19.metri';
const LINK = 'metri://dev/seed';

const run = (cmd: string, args: string[]) => {
  const res = spawnSync(cmd, args, { stdio: 'inherit' });
  if (res.error) {
    console.error(`Could not run ${cmd}: ${res.error.message}`);
    process.exit(1);
  }
  if (res.status !== 0) process.exit(res.status ?? 1);
};

if (process.argv.includes('--ios')) {
  run('xcrun', ['simctl', 'openurl', 'booted', LINK]);
} else {
  run('adb', [
    'shell',
    'am',
    'start',
    '-W',
    '-a',
    'android.intent.action.VIEW',
    '-d',
    LINK,
    PACKAGE,
  ]);
}
console.log('Opened the seed screen in the app; watch the toast on the device.');
