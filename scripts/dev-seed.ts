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
 *
 * On Android it first waits for a device and for the package to be installed,
 * so `bun run android & bun run dev:seed` works as one line: the link is sent
 * the moment the build lands, not before.
 */
import { spawnSync } from 'node:child_process';

const PACKAGE = 'com.ricwolf19.metri';
const LINK = 'metri://dev/seed';
const INSTALL_WAIT_MS = 10 * 60_000;
const POLL_MS = 3_000;
/** Time for a just-launched dev build to load its bundle before the link arrives. */
const WARM_UP_MS = 6_000;

const run = (cmd: string, args: string[], quiet = false) => {
  const res = spawnSync(cmd, args, { stdio: quiet ? 'pipe' : 'inherit' });
  if (res.error) {
    console.error(`Could not run ${cmd}: ${res.error.message}`);
    process.exit(1);
  }
  return res.status === 0;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

if (process.argv.includes('--ios')) {
  if (!run('xcrun', ['simctl', 'openurl', 'booted', LINK])) process.exit(1);
} else {
  console.log('Waiting for an Android device…');
  run('adb', ['wait-for-device']);
  const deadline = Date.now() + INSTALL_WAIT_MS;
  while (!run('adb', ['shell', 'pm', 'path', PACKAGE], true)) {
    if (Date.now() > deadline) {
      console.error(`${PACKAGE} is not installed on the device (waited 10 min).`);
      process.exit(1);
    }
    console.log(`Waiting for ${PACKAGE} to be installed…`);
    await sleep(POLL_MS);
  }
  // Warm the app first: cold-starting it BY the link makes expo-router set
  // state on its navigator before it mounts (a dev-only warning), and a cold
  // dev build also needs a moment to pull the bundle before it can route.
  run('adb', ['shell', 'am', 'start', '-W', '-n', `${PACKAGE}/.MainActivity`], true);
  await sleep(WARM_UP_MS);
  if (
    !run('adb', [
      'shell',
      'am',
      'start',
      '-W',
      '-a',
      'android.intent.action.VIEW',
      '-d',
      LINK,
      PACKAGE,
    ])
  ) {
    process.exit(1);
  }
}
console.log('Opened the seed screen in the app; watch the toast on the device.');
