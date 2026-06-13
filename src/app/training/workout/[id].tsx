import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { CheckIcon, PlusIcon, XIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  Input,
  Screen,
  SegmentedControl,
  useToast,
  type Segment,
} from '@/components/ui';
import type { Exercise, SetLog, WeekConfig, WorkoutDayExercise } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { kgToLb, lbToKg } from '@/features/bmr/calc';
import { ExerciseImage } from '@/features/training/components/ExerciseImage';
import { RestTimer } from '@/features/training/components/RestTimer';
import { getWorkoutDay } from '@/features/training/programs.repo';
import { formatIntensity, formatSetsReps } from '@/features/training/progression';
import {
  abandonWorkout,
  deleteSet,
  finishWorkout,
  getSessionSlots,
  getWorkout,
  logSet,
  setLogsQuery,
  suggestedWeight,
} from '@/features/training/session.repo';
import { useT } from '@/i18n';
import { settings, type Units } from '@/lib/storage';

const UNIT_SEGMENTS: Segment<Units>[] = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
];

const fromKg = (kg: number, unit: Units): number =>
  Math.round((unit === 'lb' ? kgToLb(kg) : kg) * 10) / 10;

type BlockProps = {
  workoutLogId: string;
  slot: WorkoutDayExercise;
  exercise: Exercise;
  config: WeekConfig | null;
  sets: SetLog[];
  unit: Units;
  onLogged: (restSeconds: number) => void;
};

const ExerciseBlock = ({
  workoutLogId,
  slot,
  exercise,
  config,
  sets,
  unit,
  onLogged,
}: BlockProps) => {
  const t = useT();
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState(config ? String(config.reps) : '');

  const suggestedKg = useMemo(
    () => suggestedWeight(exercise.id, config?.reps ?? 8, config?.rirMax ?? config?.rirMin ?? 2),
    [exercise.id, config?.reps, config?.rirMax, config?.rirMin],
  );

  const target = config
    ? `${formatSetsReps(config.sets, config.reps)}${
        formatIntensity(config, t('training.failure'))
          ? ` · ${formatIntensity(config, t('training.failure'))}`
          : ''
      }`
    : '—';

  const add = () => {
    const w = Number(weight);
    const r = Number(reps);
    if (weight === '' || reps === '' || Number.isNaN(w) || w < 0 || !(r > 0)) return;
    logSet({
      workoutLogId,
      exerciseId: exercise.id,
      weightKg: unit === 'lb' ? lbToKg(w) : w,
      reps: r,
    });
    onLogged(config?.restSeconds ?? slot.defaultRestSeconds ?? 120);
    setWeight('');
  };

  return (
    <Card className="mb-3">
      <View className="flex-row items-center">
        <ExerciseImage id={exercise.id} imageUrl={exercise.imageUrl} size={52} />
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold text-ink-50">{exercise.name}</Text>
          <Text className="mt-0.5 text-xs text-ink-400">
            {t('training.target')}: {target}
          </Text>
        </View>
      </View>

      {/* Logged sets */}
      {sets.length ? (
        <View className="mt-3 gap-1.5">
          {sets.map((s) => (
            <View key={s.id} className="flex-row items-center rounded-lg bg-ink-850 px-3 py-2">
              <Text className="w-14 text-xs font-semibold text-accent">
                {t('training.set', { n: s.setNumber })}
              </Text>
              <Text className="flex-1 text-sm text-ink-100">
                {fromKg(s.weightKg, unit)} {unit} × {s.reps}
              </Text>
              <Pressable hitSlop={8} onPress={() => deleteSet(s.id)} accessibilityRole="button">
                <XIcon color="#566077" size={16} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {/* Suggested weight */}
      {suggestedKg != null ? (
        <Pressable
          onPress={() => setWeight(String(fromKg(suggestedKg, unit)))}
          className="mt-3 self-start rounded-full bg-lime-400/15 px-3 py-1"
        >
          <Text className="text-xs font-semibold text-accent">
            {t('training.suggested')}: {fromKg(suggestedKg, unit)} {unit}
          </Text>
        </Pressable>
      ) : null}

      {/* Inputs */}
      <View className="mt-3 flex-row items-end gap-2">
        <View className="flex-1">
          <Input
            label={`${t('training.weight')} (${unit})`}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="0"
            maxLength={6}
          />
        </View>
        <View className="w-20">
          <Input
            label={t('training.reps')}
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            placeholder="0"
            maxLength={3}
          />
        </View>
        <Pressable
          onPress={add}
          accessibilityRole="button"
          accessibilityLabel={t('training.addSet')}
          className="h-12 w-12 items-center justify-center rounded-xl bg-accentFill"
        >
          <PlusIcon color="#0b0f14" size={22} />
        </Pressable>
      </View>
    </Card>
  );
};

const WorkoutSession = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const { user } = useAuth();

  const log = typeof id === 'string' ? getWorkout(id) : null;
  const [unit, setUnit] = useState<Units>(settings.getUnits());
  const [rest, setRest] = useState<{ key: number; seconds: number } | null>(null);

  const slots = useMemo(
    () => (log ? getSessionSlots(log.workoutDayId, log.weekNumber) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [log?.workoutDayId, log?.weekNumber],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const day = useMemo(() => (log ? getWorkoutDay(log.workoutDayId) : null), [log?.workoutDayId]);
  const { data: sets } = useLiveQuery(setLogsQuery(typeof id === 'string' ? id : ''));

  if (!user || !log || log.status !== 'in_progress') return <Redirect href="/training" />;

  const setsFor = (exerciseId: string) => sets.filter((s) => s.exerciseId === exerciseId);

  const onLogged = (restSeconds: number) =>
    setRest((prev) => ({ key: (prev?.key ?? 0) + 1, seconds: restSeconds }));

  const finish = () => {
    finishWorkout(log.id);
    toast.success(t('training.finishedToast'));
    router.replace('/training');
  };

  const cancel = () =>
    Alert.alert('', t('training.cancelConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('training.cancelWorkout'),
        style: 'destructive',
        onPress: () => {
          abandonWorkout(log.id);
          router.replace('/training');
        },
      },
    ]);

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar
        title={day?.name ?? t('training.workout')}
        subtitle={t('training.weekN', { n: log.weekNumber })}
        showBack
        showAvatar={false}
        right={
          <Pressable
            hitSlop={8}
            onPress={cancel}
            accessibilityRole="button"
            accessibilityLabel={t('training.cancelWorkout')}
            className="h-9 w-9 items-center justify-center rounded-full bg-ink-800"
          >
            <XIcon color="#ef4444" size={18} />
          </Pressable>
        }
      />

      <View className="px-5 pb-2">
        <View className="w-32">
          <SegmentedControl segments={UNIT_SEGMENTS} value={unit} onChange={setUnit} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-2"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {slots.length === 0 ? (
          <Text className="mt-10 text-center text-sm text-ink-400">{t('training.empty')}</Text>
        ) : (
          slots.map(({ slot, exercise, config }) => (
            <ExerciseBlock
              key={slot.id}
              workoutLogId={log.id}
              slot={slot}
              exercise={exercise}
              config={config}
              sets={setsFor(exercise.id)}
              unit={unit}
              onLogged={onLogged}
            />
          ))
        )}
      </ScrollView>

      <View className="gap-3 px-5 pb-2 pt-3">
        {rest ? (
          <RestTimer
            key={rest.key}
            seconds={rest.seconds}
            label={t('training.rest')}
            skipLabel={t('training.skip')}
            onDone={() => setRest(null)}
          />
        ) : null}
        <Button
          label={t('training.finish')}
          leftIcon={<CheckIcon color="#0b0f14" size={18} />}
          onPress={finish}
        />
      </View>
    </Screen>
  );
};

export default WorkoutSession;
