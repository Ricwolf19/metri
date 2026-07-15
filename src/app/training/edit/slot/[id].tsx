import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MinusIcon, PlusIcon, XIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  Input,
  Screen,
  SegmentedControl,
  Switch,
  useToast,
  type Segment,
} from '@/components/ui';
import type { IntensityType, WeekConfig } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import {
  MAX_BADGES,
  MAX_BADGE_LEN,
  configsQuery,
  copyWeekConfigToAll,
  getSlot,
  setSlotBadges,
  updateSlot,
  upsertWeekConfig,
  type ConfigValues,
} from '@/features/training/authoring.repo';
import { getExercise } from '@/features/training/exercises.repo';
import { INTENSITY_KEY } from '@/features/training/labels';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const toValues = (c: WeekConfig): ConfigValues => ({
  sets: c.sets,
  reps: c.reps,
  repsMax: c.repsMax,
  rirMin: c.rirMin,
  rirMax: c.rirMax,
  toFailure: c.toFailure,
  restSeconds: c.restSeconds,
  intensityType: c.intensityType,
  intensityValue: c.intensityValue,
});

const NumRow = ({
  label,
  display,
  onDec,
  onInc,
}: {
  label: string;
  display: string;
  onDec: () => void;
  onInc: () => void;
}) => {
  const { brand } = useTheme();
  const btn =
    'h-10 w-10 items-center justify-center rounded-field border border-ink-700 bg-ink-800';
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-sm text-ink-200">{label}</Text>
      <View className="flex-row items-center gap-3">
        <Pressable onPress={onDec} className={btn} accessibilityRole="button">
          <MinusIcon color={brand} size={16} />
        </Pressable>
        <Text className="min-w-9 text-center text-base font-sans-semibold text-ink-50">
          {display}
        </Text>
        <Pressable onPress={onInc} className={btn} accessibilityRole="button">
          <PlusIcon color={brand} size={16} />
        </Pressable>
      </View>
    </View>
  );
};

const EditSlot = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const toast = useToast();
  const { user } = useAuth();

  const slot = typeof id === 'string' ? getSlot(id) : null;
  const exercise = slot ? getExercise(slot.exerciseId) : null;
  const { data: configs } = useLiveQuery(configsQuery(typeof id === 'string' ? id : ''));

  const [week, setWeek] = useState(1);
  const [rest, setRest] = useState(slot?.defaultRestSeconds ?? 120);
  const [badges, setBadges] = useState<string[]>(slot?.badges ?? []);
  const [badgeInput, setBadgeInput] = useState('');

  if (!user || !slot || !exercise || typeof id !== 'string') return <Redirect href="/training" />;

  const scope = slot.userProgramId;
  const cfg = configs.find((c) => c.weekNumber === week) ?? configs[0] ?? null;
  const weeks = configs.length;

  const patch = (p: Partial<ConfigValues>) => {
    if (!cfg) return;
    upsertWeekConfig(slot.id, cfg.weekNumber, scope, { ...toValues(cfg), ...p });
  };

  const setRestTo = (next: number) => {
    const r = Math.max(30, Math.min(600, next));
    setRest(r);
    updateSlot(slot.id, { defaultRestSeconds: r });
  };

  const addBadge = () => {
    const v = badgeInput.trim().slice(0, MAX_BADGE_LEN);
    if (!v || badges.length >= MAX_BADGES) return;
    const next = [...badges, v];
    setBadges(next);
    setSlotBadges(slot.id, next);
    setBadgeInput('');
  };
  const removeBadge = (i: number) => {
    const next = badges.filter((_, j) => j !== i);
    setBadges(next);
    setSlotBadges(slot.id, next);
  };

  const intensityItems: Segment<IntensityType>[] = (
    Object.keys(INTENSITY_KEY) as IntensityType[]
  ).map((k) => ({ value: k, label: t(INTENSITY_KEY[k]) }));

  const changeIntensity = (type: IntensityType) => {
    const intensityValue = type === 'rpe' ? 8 : type === 'percentage' ? 70 : null;
    patch({ intensityType: type, intensityValue });
  };

  return (
    <Screen scroll edges={['top']} contentClassName="px-5 pb-10">
      <TopBar title={exercise.name} showBack showAvatar={false} />

      {/* Week selector */}
      {weeks > 1 ? (
        <View className="mb-4 flex-row flex-wrap gap-2">
          {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => (
            <Pressable
              key={w}
              onPress={() => setWeek(w)}
              className={[
                'rounded-full border px-3.5 py-1.5',
                w === (cfg?.weekNumber ?? 1)
                  ? 'border-brand/40 bg-brand/15'
                  : 'border-ink-700 bg-ink-800',
              ].join(' ')}
            >
              <Text
                className={[
                  'text-xs font-sans-semibold',
                  w === (cfg?.weekNumber ?? 1) ? 'text-brand' : 'text-ink-300',
                ].join(' ')}
              >
                {t('editor.week', { n: w })}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {cfg ? (
        <Card>
          <Text className="mb-1 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
            {t('editor.prescription')}
          </Text>
          <NumRow
            label={t('editor.sets')}
            display={`${cfg.sets}`}
            onDec={() => patch({ sets: Math.max(1, cfg.sets - 1) })}
            onInc={() => patch({ sets: cfg.sets + 1 })}
          />
          <NumRow
            label={t('editor.reps')}
            display={`${cfg.reps}`}
            onDec={() => patch({ reps: Math.max(1, cfg.reps - 1) })}
            onInc={() => patch({ reps: cfg.reps + 1 })}
          />
          <NumRow
            label={t('editor.repsMax')}
            display={cfg.repsMax ? `${cfg.repsMax}` : '—'}
            onDec={() => {
              const n = (cfg.repsMax ?? 0) - 1;
              patch({ repsMax: n > cfg.reps ? n : null });
            }}
            onInc={() => patch({ repsMax: Math.max(cfg.reps + 1, (cfg.repsMax ?? cfg.reps) + 1) })}
          />

          <View className="my-3 h-px bg-ink-800" />

          <View className="flex-row items-center justify-between py-1">
            <Text className="text-sm text-ink-200">{t('editor.toFailure')}</Text>
            <Switch value={cfg.toFailure} onValueChange={(v) => patch({ toFailure: v })} />
          </View>

          {!cfg.toFailure ? (
            <>
              <Text className="mb-2 mt-3 font-mono-medium text-[11px] uppercase tracking-wider text-ink-400">
                {t('editor.intensity')}
              </Text>
              <SegmentedControl
                segments={intensityItems}
                value={cfg.intensityType}
                onChange={changeIntensity}
              />
              {cfg.intensityType === 'rir' ? (
                <>
                  <NumRow
                    label={`${t('intensity.rir')} min`}
                    display={`${cfg.rirMin ?? 0}`}
                    onDec={() => patch({ rirMin: Math.max(0, (cfg.rirMin ?? 0) - 1) })}
                    onInc={() => patch({ rirMin: Math.min(5, (cfg.rirMin ?? 0) + 1) })}
                  />
                  <NumRow
                    label={`${t('intensity.rir')} max`}
                    display={`${cfg.rirMax ?? cfg.rirMin ?? 0}`}
                    onDec={() =>
                      patch({ rirMax: Math.max(cfg.rirMin ?? 0, (cfg.rirMax ?? 0) - 1) })
                    }
                    onInc={() =>
                      patch({ rirMax: Math.min(5, (cfg.rirMax ?? cfg.rirMin ?? 0) + 1) })
                    }
                  />
                </>
              ) : cfg.intensityType === 'rpe' ? (
                <NumRow
                  label={t('intensity.rpe')}
                  display={`${cfg.intensityValue ?? 8}`}
                  onDec={() =>
                    patch({ intensityValue: Math.max(5, (cfg.intensityValue ?? 8) - 1) })
                  }
                  onInc={() =>
                    patch({ intensityValue: Math.min(10, (cfg.intensityValue ?? 8) + 1) })
                  }
                />
              ) : (
                <NumRow
                  label={t('intensity.percentage')}
                  display={`${cfg.intensityValue ?? 70}%`}
                  onDec={() =>
                    patch({ intensityValue: Math.max(30, (cfg.intensityValue ?? 70) - 5) })
                  }
                  onInc={() =>
                    patch({ intensityValue: Math.min(100, (cfg.intensityValue ?? 70) + 5) })
                  }
                />
              )}
            </>
          ) : null}

          {weeks > 1 ? (
            <View className="mt-5">
              <Button
                label={t('editor.applyToAll')}
                variant="secondary"
                size="sm"
                onPress={() => {
                  copyWeekConfigToAll(slot.id, cfg.weekNumber);
                  toast.success(t('editor.applyToAll'));
                }}
              />
            </View>
          ) : null}
        </Card>
      ) : null}

      {/* Rest */}
      <Card className="mt-4">
        <NumRow
          label={t('editor.restSeconds')}
          display={`${rest}s`}
          onDec={() => setRestTo(rest - 15)}
          onInc={() => setRestTo(rest + 15)}
        />
      </Card>

      {/* Badges */}
      <Text className="mb-1 mt-7 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('editor.badges')}
      </Text>
      <Text className="mb-2 text-[11px] text-ink-500">{t('editor.badgesHint')}</Text>
      <Card>
        {badges.length ? (
          <View className="mb-3 flex-row flex-wrap gap-2">
            {badges.map((b, i) => (
              <View
                key={`${b}-${i}`}
                className="flex-row items-center gap-1.5 rounded-full bg-ink-800 px-3 py-1.5"
              >
                <Text className="font-mono-medium text-[11px] uppercase tracking-wide text-ink-200">
                  {b}
                </Text>
                <Pressable onPress={() => removeBadge(i)} hitSlop={6}>
                  <XIcon color="#71717a" size={13} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
        {badges.length < MAX_BADGES ? (
          <View className="flex-row items-end gap-2">
            <View className="flex-1">
              <Input
                value={badgeInput}
                onChangeText={setBadgeInput}
                placeholder={t('editor.badgePh')}
                maxLength={MAX_BADGE_LEN}
                autoCapitalize="characters"
                onSubmitEditing={addBadge}
                returnKeyType="done"
              />
            </View>
            <Button label={t('editor.addBadge')} size="sm" onPress={addBadge} />
          </View>
        ) : null}
      </Card>
    </Screen>
  );
};

export default EditSlot;
