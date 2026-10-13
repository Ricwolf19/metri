import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { BlockingOverlay, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { seedDemoData, wipeDemoData } from '@/features/dev/demo-seed';
import { useI18n } from '@/i18n';

/** The test lifter the seed script creates when the device has no user yet. */
const TEST_USER = {
  displayName: 'Test lifter',
  sex: 'male' as const,
  age: 30,
  heightCm: 178,
  weightKg: 82,
  activityLevel: 'moderate' as const,
};

/**
 * DEVELOPMENT ONLY — `bun run dev:seed` opens `metri://dev/seed`, which lands
 * here: wipe this user's training, body and diary rows, write three months of
 * demo data (`features/dev/demo-seed.ts`) and go Home. With no user on the
 * device a local test lifter is created and onboarded first. A release build
 * never mounts the screen.
 */
const DevSeed = () => {
  const router = useRouter();
  const toast = useToast();
  const { user, isReady, startLocal, finishOnboarding } = useAuth();
  const { locale } = useI18n();
  // A ref, not state: the effect runs once per user and must not re-render itself.
  const ran = useRef(false);

  useEffect(() => {
    if (!__DEV__ || !isReady || ran.current) return;
    if (!user) {
      void startLocal(TEST_USER.displayName);
      return;
    }
    ran.current = true;
    if (!user.onboardedAt) finishOnboarding(TEST_USER);
    // Let the overlay paint; the writes are synchronous and take a few seconds.
    setTimeout(() => {
      try {
        wipeDemoData(user.id);
        const summary = seedDemoData(user.id, locale);
        toast.success(
          summary
            ? `Seeded ${summary.sessions} sessions, ${summary.skipped} skipped, ${summary.days} diary days`
            : 'Seed refused',
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      }
      router.replace('/');
    }, 80);
  }, [isReady, user, startLocal, finishOnboarding, locale, router, toast]);

  if (!__DEV__) return <Redirect href="/" />;
  return <BlockingOverlay visible label="Seeding demo data…" />;
};

export default DevSeed;
