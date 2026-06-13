import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Button, Card, FadeInUp, Screen, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  abandonEnrollment,
  activeEnrollmentQuery,
  enrollInProgram,
} from '@/features/training/enroll';
import { DIFFICULTY_KEY, GOAL_KEY } from '@/features/training/labels';
import { getProgram, getProgramStructure } from '@/features/training/programs.repo';
import { useT } from '@/i18n';

const Tag = ({ label }: { label: string }) => (
  <View className="rounded-full bg-ink-700 px-2.5 py-0.5">
    <Text className="text-xs font-medium text-ink-200">{label}</Text>
  </View>
);

const ProgramDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const { user } = useAuth();

  const program = typeof id === 'string' ? getProgram(id) : null;
  const structure = typeof id === 'string' ? getProgramStructure(id) : [];
  const { data: enrollments } = useLiveQuery(activeEnrollmentQuery(user?.id ?? ''));
  const enrollment = enrollments[0] ?? null;

  if (!program || !user) return <Redirect href="/training" />;

  const enrolledHere = enrollment?.programId === program.id;

  const doEnroll = () => {
    enrollInProgram(user.id, program.id);
    toast.success(t('training.enrolledToast'));
    router.replace('/training');
  };

  const onPrimary = () => {
    if (enrolledHere) {
      router.replace('/training');
      return;
    }
    if (enrollment) {
      Alert.alert('', t('training.switchConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('training.switch'),
          onPress: () => {
            abandonEnrollment(enrollment.id);
            doEnroll();
          },
        },
      ]);
      return;
    }
    doEnroll();
  };

  const primaryLabel = enrolledHere
    ? t('training.enrolled')
    : enrollment
      ? t('training.switch')
      : t('training.enroll');

  return (
    <Screen scroll contentClassName="px-5 pb-28">
      <TopBar title={program.name} showBack showAvatar={false} />

      <FadeInUp>
        <View className="mb-2 flex-row flex-wrap gap-2">
          {program.goal ? <Tag label={t(GOAL_KEY[program.goal])} /> : null}
          {program.difficulty ? <Tag label={t(DIFFICULTY_KEY[program.difficulty])} /> : null}
          {program.durationWeeks ? (
            <Tag label={t('training.weeks', { count: program.durationWeeks })} />
          ) : null}
        </View>
        {program.description ? (
          <Text className="mb-5 text-sm leading-6 text-ink-300">{program.description}</Text>
        ) : null}
      </FadeInUp>

      <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-300">
        {t('training.routines')}
      </Text>
      <View className="gap-3">
        {structure.map((routine, i) => (
          <FadeInUp key={routine.id} delay={i * 60}>
            <Card>
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-ink-50">{routine.name}</Text>
                <Text className="text-xs text-ink-400">
                  {t('training.daysCount', { count: routine.days.length })}
                </Text>
              </View>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {routine.days.map((day) => (
                  <View key={day.id} className="rounded-lg bg-ink-850 px-3 py-1.5">
                    <Text className="text-sm text-ink-100">{day.name}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </FadeInUp>
        ))}
      </View>

      <View className="mt-6">
        <Button label={primaryLabel} onPress={onPrimary} />
      </View>
    </Screen>
  );
};

export default ProgramDetail;
