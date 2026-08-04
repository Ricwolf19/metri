import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ChevronRightIcon, DumbbellIcon, PlayIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Button, Card, FadeInUp, PressableScale, Screen, useDialog } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { abandonEnrollment, setEnrollmentPosition } from '@/features/training/enroll';
import { activeWorkoutQuery, startWorkout } from '@/features/training/session.repo';
import { useEnrollment } from '@/features/training/useEnrollment';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const Training = () => {
  const router = useRouter();
  const t = useT();
  const dialog = useDialog();
  const { user } = useAuth();
  const { brand } = useTheme();

  const { enrollment, structure } = useEnrollment(user?.id ?? '');
  const { data: actives } = useLiveQuery(activeWorkoutQuery(user?.id ?? ''));
  const activeWorkout = actives[0] ?? null;

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
    dialog.show({
      title: t('training.abandonConfirm'),
      actions: [
        { label: t('common.cancel'), style: 'cancel' },
        {
          label: t('training.abandon'),
          style: 'destructive',
          onPress: () => abandonEnrollment(enrollment.id),
        },
      ],
    });
  };

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-32"
      header={<TopBar menu showFaq showBeta />}
    >
      {activeWorkout ? (
        <FadeInUp>
          <PressableScale
            onPress={() =>
              router.push({ pathname: '/training/workout/[id]', params: { id: activeWorkout.id } })
            }
          >
            <View className="mb-4 flex-row items-center rounded-card border border-brand/30 bg-brand/10 p-5">
              <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-brand/15">
                <PlayIcon color={brand} size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-sans-bold text-brand">{t('training.resume')}</Text>
                <Text className="mt-0.5 text-sm text-ink-400">{t('training.resumeBody')}</Text>
              </View>
              <ChevronRightIcon color={brand} />
            </View>
          </PressableScale>
        </FadeInUp>
      ) : null}

      {enrollment && structure?.program ? (
        <FadeInUp delay={60}>
          <Card className="mb-4">
            <Text className="font-mono-medium text-xs uppercase tracking-wider text-brand">
              {t('training.weekOf', {
                week: structure.programWeek,
                total: structure.totalWeeks,
              })}
            </Text>
            <Text className="mt-1 text-xl font-sans-bold text-ink-50">
              {structure.program.name}
            </Text>
            {structure.currentRoutine ? (
              <Text className="mt-0.5 text-sm text-ink-400">{structure.currentRoutine.name}</Text>
            ) : null}

            <Text className="mb-2 mt-5 font-mono-medium text-xs uppercase tracking-wider text-ink-300">
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
                  <View className="flex-row items-center rounded-field border border-ink-600 bg-ink-850 px-4 py-3">
                    <View className="mr-3 h-9 w-9 items-center justify-center rounded-lg bg-brand/10">
                      <DumbbellIcon color={brand} size={18} />
                    </View>
                    <Text className="flex-1 text-base font-sans-semibold text-ink-50">
                      {day.name}
                    </Text>
                    <ChevronRightIcon color="#71717a" />
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
            <View className="mb-3 h-14 w-14 items-center justify-center rounded-card bg-brand/10">
              <DumbbellIcon color={brand} size={28} />
            </View>
            <Text className="text-base font-sans-semibold text-ink-50">
              {t('training.noProgram')}
            </Text>
            <Text className="mt-1 px-6 text-center text-sm text-ink-400">
              {t('training.noProgramBody')}
            </Text>
            <View className="mt-5 w-full gap-2 px-2">
              <Button
                label={t('training.browse')}
                onPress={() => router.push('/training/programs')}
              />
              <Button
                label={t('editor.createOwn')}
                variant="secondary"
                onPress={() => router.push('/training/edit/new')}
              />
            </View>
          </Card>
        </FadeInUp>
      )}
    </Screen>
  );
};

export default Training;
