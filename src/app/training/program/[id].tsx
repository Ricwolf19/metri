import { useLiveQuery } from '@/db/useLiveQuery';
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  FadeInUp,
  HoldButton,
  Screen,
  SectionLabel,
  useDialog,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  ProgramQuickView,
  type QuickViewTarget,
} from '@/features/training/components/ProgramQuickView';
import { presetDayName, presetProgramCopy, presetRoutineName } from '@/features/training/programs';
import { deleteProgramTree } from '@/features/training/authoring.repo';
import { activeEnrollmentQuery } from '@/features/training/enroll';
import {
  dayDisplayName,
  phaseMeta,
  routineDisplayName,
  scheduleLabel,
} from '@/features/training/labels';
import { getProgram, getProgramTree } from '@/features/training/programs.repo';
import { useI18n, useT } from '@/i18n';
import { useClockFormat } from '@/lib/useClockFormat';
import { useTheme } from '@/theme/theme-context';

/** Program detail: phases/splits (schedule shown when active), a quick view of any phase or split, Start / Continue / Switch, Edit + hold-to-delete for the owner. */
const ProgramDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { muted } = useTheme();
  const { locale } = useI18n();
  const toast = useToast();
  const dialog = useDialog();
  const { user } = useAuth();
  const programId = typeof id === 'string' ? id : '';
  const clock = useClockFormat();

  const { data: enrollments } = useLiveQuery(activeEnrollmentQuery(user?.id ?? ''), [user?.id]);
  const enrollment = enrollments[0] ?? null;
  const enrolledHere = enrollment?.programId === programId;

  const [program, setProgram] = useState(() => (programId ? getProgram(programId) : null));
  const [tree, setTree] = useState(() => getProgramTree(programId, null));
  const [quick, setQuick] = useState<QuickViewTarget | null>(null);
  // Reload on focus: the editors behind Edit write straight to SQLite.
  useFocusEffect(
    useCallback(() => {
      setProgram(programId ? getProgram(programId) : null);
      setTree(getProgramTree(programId, enrolledHere && enrollment ? enrollment.id : null));
    }, [programId, enrolledHere, enrollment]),
  );

  if (!program || !user) return <Redirect href="/training" />;

  const preset = presetProgramCopy(program.id, locale);

  const mine = program.isCustom && program.userId === user.id;
  const totalWeeks = tree.routines.reduce((sum, r) => sum + r.durationWeeks, 0);

  const onPrimary = () => {
    if (enrolledHere) {
      router.dismissTo('/training');
      return;
    }
    router.push({
      pathname: '/training/start/[id]',
      params: enrollment ? { id: programId, switch: '1' } : { id: programId },
    });
  };
  const primaryLabel = enrolledHere
    ? t('training.enrolled')
    : enrollment
      ? t('training.switch')
      : t('training.enroll');

  const remove = () => {
    if (!deleteProgramTree(programId)) {
      dialog.show({
        title: t('editor.inUseProgram'),
        actions: [{ label: t('common.continue'), style: 'cancel' }],
      });
      return;
    }
    toast.info(t('editor.deletedToast'));
    router.dismissTo('/training');
  };

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-10"
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={preset?.name ?? program.name}
          subtitle={t('training.phasesWeeks', { phases: tree.routines.length, weeks: totalWeeks })}
        />
      }
    >
      <FadeInUp>
        <Text
          className={[
            'mb-5 text-sm leading-6',
            program.description ? 'text-ink-300' : 'text-ink-500',
          ].join(' ')}
        >
          {preset?.description ?? (program.description || t('training.noDescription'))}
        </Text>
      </FadeInUp>

      <SectionLabel label={t('editor.phases')} className="mt-0" />
      <View className="gap-3">
        {tree.routines.map((routine, i) => (
          <FadeInUp key={routine.id} delay={i * 60}>
            <Card>
              {/* Stacked, never side by side: a preset phase name ("Fase 3 — Semana 1
                  (A·B·A)") and its weeks + RM test line both run long in Spanish, and
                  on one row they pushed each other off the screen. */}
              <Pressable
                onPress={() => setQuick({ routineId: routine.id, dayId: null })}
                accessibilityRole="button"
                accessibilityHint={t('program.quickViewHint')}
                className="-m-1 flex-row items-center rounded-field p-1 active:bg-ink-800"
              >
                <View className="min-w-0 flex-1">
                  <Text className="text-base font-sans-semibold text-ink-50">
                    {routineDisplayName(
                      {
                        name: presetRoutineName(program.id, routine.id, routine.name, locale),
                        orderIndex: routine.orderIndex,
                      },
                      t,
                    )}
                  </Text>
                  <Text className="mt-0.5 text-xs text-ink-400">{phaseMeta(routine, t)}</Text>
                </View>
                <View className="ml-2 shrink-0">
                  <ChevronRightIcon color={muted} size={18} />
                </View>
              </Pressable>
              <View className="mt-3 gap-2">
                {routine.days.map((day) => {
                  const schedule = scheduleLabel(day, t, clock);
                  // Every split opens the quick view on itself; on the active copy
                  // the quick view links on to the split's editor (the schedule
                  // lives there).
                  return (
                    <Pressable
                      key={day.id}
                      onPress={() => setQuick({ routineId: routine.id, dayId: day.id })}
                      accessibilityRole="button"
                      accessibilityHint={t('program.quickViewHint')}
                      // Literal dp: NativeWind's rem is 14, so `min-h-11` is 38.5.
                      style={{ minHeight: 44 }}
                      className="flex-row items-center rounded-field bg-ink-850 px-3 py-2 active:bg-ink-800"
                    >
                      <Text className="min-w-0 flex-1 text-sm text-ink-100">
                        {dayDisplayName(
                          {
                            name: presetDayName(program.id, routine.id, day.id, day.name, locale),
                            orderIndex: day.orderIndex,
                          },
                          t,
                        )}
                      </Text>
                      {schedule ? (
                        <Text className="ml-2 shrink-0 text-xs text-ink-400">{schedule}</Text>
                      ) : null}
                      <View className="ml-1 shrink-0">
                        <ChevronRightIcon color={muted} size={16} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </FadeInUp>
        ))}
      </View>

      <ProgramQuickView
        programId={program.id}
        routines={tree.routines}
        target={quick}
        current={
          enrolledHere && enrollment?.currentRoutineId
            ? { routineId: enrollment.currentRoutineId, week: enrollment.currentWeek }
            : null
        }
        onClose={() => setQuick(null)}
        onEditDay={
          enrolledHere
            ? (dayId) => {
                setQuick(null);
                router.push({ pathname: '/training/edit/day/[id]', params: { id: dayId } });
              }
            : undefined
        }
      />

      <View className="mt-6 gap-3">
        <Button variant="brand" size="lg" label={primaryLabel} onPress={onPrimary} />
        {mine ? (
          <Button
            label={t('editor.edit')}
            onPress={() =>
              router.push({ pathname: '/training/edit/program/[id]', params: { id: programId } })
            }
          />
        ) : null}
        {mine ? (
          <View className="mt-4">
            <HoldButton label={t('editor.deleteProgram')} onComplete={remove} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
};

export default ProgramDetail;
