import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Text, View } from 'react-native';

import { ChevronRightIcon, DumbbellIcon, PlayIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Button, Card, FadeInUp, PressableScale, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  abandonEnrollment,
  activeEnrollmentQuery,
  setEnrollmentPosition,
} from '@/features/training/enroll';
import { getProgram, getRoutines, getWorkoutDays } from '@/features/training/programs.repo';
import { deriveProgramWeek, totalProgramWeeks } from '@/features/training/progression';
import { activeWorkoutQuery, startWorkout } from '@/features/training/session.repo';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const Training = () => {
  const router = useRouter();
  const t = useT();
  const { user } = useAuth();
  const { accent } = useTheme();

  const { data: enrollments } = useLiveQuery(activeEnrollmentQuery(user?.id ?? ''));
  const { data: actives } = useLiveQuery(activeWorkoutQuery(user?.id ?? ''));
  const enrollment = enrollments[0] ?? null;
  const activeWorkout = actives[0] ?? null;

  const structure = useMemo(() => {
    if (!enrollment) return null;
    const program = getProgram(enrollment.programId);
    const routines = getRoutines(enrollment.programId, enrollment.id);
    const currentRoutine =
      routines.find((r) => r.id === enrollment.currentRoutineId) ?? routines[0] ?? null;
    const days = currentRoutine ? getWorkoutDays(currentRoutine.id) : [];
    return {
      program,
      routines,
      currentRoutine,
      days,
      programWeek: deriveProgramWeek(routines, enrollment.currentRoutineId, enrollment.currentWeek),
      totalWeeks: totalProgramWeeks(routines),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollment?.id, enrollment?.currentRoutineId, enrollment?.currentWeek]);

  if (!user) return null;

  const startDay = (dayId: string) => {
    if (!enrollment || !structure?.currentRoutine) return;
    if (enrollment.currentRoutineId !== structure.currentRoutine.id) {
      setEnrollmentPosition(enrollment.id, structure.currentRoutine.id, enrollment.currentWeek);
    }
    const workout = startWorkout(user.id, enrollment.id, dayId, enrollment.currentWeek);
    router.push({ pathname: '/training/workout/[id]', params: { id: workout.id } });
  };

  const confirmAbandon = () => {
    if (!enrollment) return;
    Alert.alert('', t('training.abandonConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('training.abandon'),
        style: 'destructive',
        onPress: () => abandonEnrollment(enrollment.id),
      },
    ]);
  };

  return (
    <Screen scroll edges={['top']} contentClassName="px-5 pb-10">
      <TopBar title={t('training.title')} subtitle={t('training.subtitle')} />

      {activeWorkout ? (
        <FadeInUp>
          <PressableScale
            onPress={() =>
              router.push({ pathname: '/training/workout/[id]', params: { id: activeWorkout.id } })
            }
          >
            <View className="mb-4 flex-row items-center rounded-2xl bg-accentFill p-5">
              <View className="mr-4 h-11 w-11 items-center justify-center rounded-xl bg-ink-950/10">
                <PlayIcon color="#0b0f14" size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-ink-950">{t('training.resume')}</Text>
                <Text className="mt-0.5 text-sm text-ink-950/70">{t('training.resumeBody')}</Text>
              </View>
              <ChevronRightIcon color="#0b0f14" />
            </View>
          </PressableScale>
        </FadeInUp>
      ) : null}

      {enrollment && structure?.program ? (
        <FadeInUp delay={60}>
          <Card className="mb-4">
            <Text className="text-xs font-semibold uppercase tracking-wider text-accent">
              {t('training.weekOf', {
                week: structure.programWeek,
                total: structure.totalWeeks,
              })}
            </Text>
            <Text className="mt-1 text-xl font-bold text-ink-50">{structure.program.name}</Text>
            {structure.currentRoutine ? (
              <Text className="mt-0.5 text-sm text-ink-400">{structure.currentRoutine.name}</Text>
            ) : null}

            <Text className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-ink-300">
              {t('training.chooseDay')}
            </Text>
            <View className="gap-2">
              {structure.days.map((day) => (
                <PressableScale
                  key={day.id}
                  disabled={!!activeWorkout}
                  onPress={() => startDay(day.id)}
                  className={activeWorkout ? 'opacity-40' : ''}
                >
                  <View className="flex-row items-center rounded-xl border border-ink-600 bg-ink-850 px-4 py-3">
                    <View className="mr-3 h-9 w-9 items-center justify-center rounded-lg bg-lime-400/15">
                      <DumbbellIcon color={accent} size={18} />
                    </View>
                    <Text className="flex-1 text-base font-semibold text-ink-50">{day.name}</Text>
                    <ChevronRightIcon color="#566077" />
                  </View>
                </PressableScale>
              ))}
            </View>

            <View className="mt-5 flex-row gap-3">
              <View className="flex-1">
                <Button
                  variant="secondary"
                  size="sm"
                  label={t('training.change')}
                  onPress={() => router.push('/training/programs')}
                />
              </View>
              <View className="flex-1">
                <Button
                  variant="danger"
                  size="sm"
                  label={t('training.abandon')}
                  onPress={confirmAbandon}
                />
              </View>
            </View>
          </Card>
        </FadeInUp>
      ) : (
        <FadeInUp delay={60}>
          <Card className="mb-4 items-center py-8">
            <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-lime-400/15">
              <DumbbellIcon color={accent} size={28} />
            </View>
            <Text className="text-base font-semibold text-ink-50">{t('training.noProgram')}</Text>
            <Text className="mt-1 px-6 text-center text-sm text-ink-400">
              {t('training.noProgramBody')}
            </Text>
            <View className="mt-5 w-full px-2">
              <Button
                label={t('training.browse')}
                onPress={() => router.push('/training/programs')}
              />
            </View>
          </Card>
        </FadeInUp>
      )}
    </Screen>
  );
};

export default Training;
