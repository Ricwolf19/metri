import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { XIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  HoldButton,
  Input,
  Screen,
  SectionLabel,
  SegmentedControl,
  Stepper,
  Switch,
  type Segment,
  useToast,
  useUnsavedGuard,
} from '@/components/ui';
import type { IntensityType, SetGroup, WeekConfig } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import {
  MAX_BADGES,
  MAX_BADGE_LEN,
  deleteSlot,
  getDay,
  getSlot,
  getSlotConfigs,
  saveSlotDraft,
  setSlotAlternatives,
  type ConfigValues,
} from '@/features/training/authoring.repo';
import { getExercise } from '@/features/training/exercises.repo';
import { INTENSITY_KEY } from '@/features/training/labels';
import { useT } from '@/i18n';

type WeekDraft = { weekNumber: number; values: ConfigValues; setGroups: SetGroup[] | null };

const toWeekDraft = (c: WeekConfig): WeekDraft => ({
  weekNumber: c.weekNumber,
  values: {
    sets: c.sets,
    reps: c.reps,
    repsMax: c.repsMax,
    rirMin: c.rirMin,
    rirMax: c.rirMax,
    toFailure: c.toFailure,
    restSeconds: c.restSeconds,
    intensityType: c.intensityType,
    intensityValue: c.intensityValue,
  },
  setGroups: c.setGroups ?? null,
});

const REST_MIN = 30;
const REST_MAX = 600;

/** Slot editor: draft written in one Save. A fresh slot (`fresh=1`) is deleted if the user leaves
 * unsaved, so no half-configured exercise reaches a workout. */
const EditSlot = () => {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  const slotId = typeof id === 'string' ? id : '';
  const isFresh = fresh === '1';
  const [slot] = useState(() => (slotId ? getSlot(slotId) : null));
  const exercise = slot ? getExercise(slot.exerciseId) : null;
  const day = slot ? getDay(slot.workoutDayId) : null;

  const [week, setWeek] = useState(1);
  const [rest, setRest] = useState(slot?.defaultRestSeconds ?? 120);
  const [badges, setBadges] = useState<string[]>(slot?.badges ?? []);
  const [badgeInput, setBadgeInput] = useState('');
  const [weeks, setWeeks] = useState<WeekDraft[]>(() =>
    slotId ? getSlotConfigs(slotId).map(toWeekDraft) : [],
  );
  const [alternatives, setAlternatives] = useState<string[]>(slot?.alternativeExerciseIds ?? []);
  // The picker appends alternatives and comes back; re-read them on focus.
  useFocusEffect(
    useCallback(() => {
      if (slotId) setAlternatives(getSlot(slotId)?.alternativeExerciseIds ?? []);
    }, [slotId]),
  );
  const [dirty, setDirty] = useState(isFresh);

  const save = () => {
    if (!slot) return false;
    saveSlotDraft(slot.id, { defaultRestSeconds: rest, badges, weeks });
    setDirty(false);
    toast.success(t('editor.savedToast'));
    return true;
  };

  const guard = useUnsavedGuard({
    dirty,
    onSave: save,
    onDiscard: () => {
      if (isFresh && slot) deleteSlot(slot.id);
    },
  });
  const saveAndClose = () => {
    if (save()) guard.leave(() => router.back());
  };

  if (!user || !slot || !exercise || !slotId) return <Redirect href="/training" />;

  const cfg = weeks.find((w) => w.weekNumber === week) ?? weeks[0] ?? null;

  const patchWeek = (weekNumber: number, patch: Partial<WeekDraft>) => {
    setWeeks((prev) => prev.map((w) => (w.weekNumber === weekNumber ? { ...w, ...patch } : w)));
    setDirty(true);
  };
  const patch = (p: Partial<ConfigValues>) => {
    if (cfg) patchWeek(cfg.weekNumber, { values: { ...cfg.values, ...p } });
  };
  const applyToAll = () => {
    if (!cfg) return;
    setWeeks((prev) =>
      prev.map((w) => ({ ...w, values: { ...cfg.values }, setGroups: cfg.setGroups })),
    );
    setDirty(true);
    toast.success(t('editor.applyToAll'));
  };

  const setRestTo = (next: number) => {
    setRest(next);
    setDirty(true);
  };
  const addBadge = () => {
    const v = badgeInput.trim().slice(0, MAX_BADGE_LEN);
    if (!v || badges.length >= MAX_BADGES) return;
    setBadges([...badges, v]);
    setBadgeInput('');
    setDirty(true);
  };
  const removeBadge = (i: number) => {
    setBadges(badges.filter((_, j) => j !== i));
    setDirty(true);
  };
  // Alternatives are structural: the picker appends immediately, removal too.
  const removeAlternative = (altId: string) => {
    const next = alternatives.filter((x) => x !== altId);
    setAlternatives(next);
    setSlotAlternatives(slot.id, next);
  };

  const remove = () => {
    setDirty(false);
    deleteSlot(slot.id);
    toast.info(t('editor.deletedToast'));
    guard.leave(() => router.back());
  };

  const intensityItems: Segment<IntensityType>[] = (
    Object.keys(INTENSITY_KEY) as IntensityType[]
  ).map((k) => ({ value: k, label: t(INTENSITY_KEY[k]) }));

  const changeIntensity = (type: IntensityType) => {
    const intensityValue = type === 'rpe' ? 8 : type === 'percentage' ? 70 : null;
    patch({ intensityType: type, intensityValue });
  };

  const v = cfg?.values ?? null;

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-10"
      header={<TopBar showBack showAvatar={false} title={exercise.name} subtitle={day?.name} />}
      footer={
        <Button variant="brand" label={t('editor.save')} disabled={!dirty} onPress={saveAndClose} />
      }
    >
      {weeks.length > 1 ? (
        <View className="mb-4 flex-row flex-wrap gap-2">
          {weeks.map((w) => {
            const active = w.weekNumber === (cfg?.weekNumber ?? 1);
            return (
              <Pressable
                key={w.weekNumber}
                onPress={() => setWeek(w.weekNumber)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className={[
                  'rounded-full border px-3.5 py-1.5',
                  active ? 'border-brand/40 bg-brand/15' : 'border-ink-700 bg-ink-800',
                ].join(' ')}
              >
                <Text
                  className={[
                    'text-xs font-sans-semibold',
                    active ? 'text-brand' : 'text-ink-300',
                  ].join(' ')}
                >
                  {t('editor.week', { n: w.weekNumber })}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {cfg && v ? (
        <Card>
          <Text className="mb-1 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
            {t('editor.prescription')}
          </Text>
          <Stepper
            label={t('editor.sets')}
            value={v.sets}
            min={1}
            onChange={(n) => patch({ sets: n })}
          />
          <Stepper
            label={t('editor.reps')}
            value={v.reps}
            min={1}
            onChange={(n) => patch({ reps: n })}
          />
          <Stepper
            label={t('editor.repsMax')}
            value={v.repsMax ?? v.reps}
            min={v.reps}
            format={(n) => (n > v.reps ? `${n}` : '—')}
            onChange={(n) => patch({ repsMax: n > v.reps ? n : null })}
          />

          <View className="my-3 h-px bg-ink-800" />

          <View className="flex-row items-center justify-between py-1">
            <Text className="text-sm text-ink-200">{t('editor.toFailure')}</Text>
            <Switch value={v.toFailure} onValueChange={(on) => patch({ toFailure: on })} />
          </View>

          {!v.toFailure ? (
            <>
              <Text className="mb-2 mt-3 font-mono-medium text-[11px] uppercase tracking-wider text-ink-400">
                {t('editor.intensity')}
              </Text>
              <SegmentedControl
                segments={intensityItems}
                value={v.intensityType}
                onChange={changeIntensity}
              />
              {v.intensityType === 'rir' ? (
                <>
                  <Stepper
                    label={t('editor.rirMin')}
                    value={v.rirMin ?? 0}
                    min={0}
                    max={5}
                    onChange={(n) => patch({ rirMin: n, rirMax: Math.max(n, v.rirMax ?? n) })}
                  />
                  <Stepper
                    label={t('editor.rirMax')}
                    value={v.rirMax ?? v.rirMin ?? 0}
                    min={v.rirMin ?? 0}
                    max={5}
                    onChange={(n) => patch({ rirMax: n })}
                  />
                </>
              ) : v.intensityType === 'rpe' ? (
                <Stepper
                  label={t('intensity.rpe')}
                  value={v.intensityValue ?? 8}
                  min={5}
                  max={10}
                  onChange={(n) => patch({ intensityValue: n })}
                />
              ) : (
                <Stepper
                  label={t('intensity.percentage')}
                  value={v.intensityValue ?? 70}
                  min={30}
                  max={100}
                  step={5}
                  format={(n) => `${n}%`}
                  onChange={(n) => patch({ intensityValue: n })}
                />
              )}
            </>
          ) : null}

          {weeks.length > 1 ? (
            <View className="mt-5">
              <Button
                label={t('editor.applyToAll')}
                variant="secondary"
                size="sm"
                onPress={applyToAll}
              />
            </View>
          ) : null}
        </Card>
      ) : null}

      <Card className="mt-4">
        <Stepper
          label={t('editor.restSeconds')}
          value={rest}
          min={REST_MIN}
          max={REST_MAX}
          step={15}
          format={(n) => `${n}s`}
          onChange={setRestTo}
        />
      </Card>

      {cfg && v ? (
        <>
          <SectionLabel label={t('editor.alternatives')} className="mb-1 mt-7" />
          <Card>
            {alternatives.length ? (
              <View className="mb-3 flex-row flex-wrap gap-2">
                {alternatives.map((altId) => {
                  const alt = getExercise(altId);
                  if (!alt) return null;
                  return (
                    <View
                      key={altId}
                      className="flex-row items-center gap-1.5 rounded-full bg-ink-800 px-3 py-1.5"
                    >
                      <Text className="text-xs font-sans-medium text-ink-200">{alt.name}</Text>
                      <Pressable onPress={() => removeAlternative(altId)} hitSlop={6}>
                        <XIcon color="#71717a" size={13} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text className="mb-3 text-xs text-ink-400">{t('editor.alternativesHint')}</Text>
            )}
            <Button
              label={t('editor.addAlternative')}
              variant="secondary"
              size="sm"
              onPress={() =>
                router.push({
                  pathname: '/training/edit/exercise-picker',
                  params: { altFor: slot.id, dayId: slot.workoutDayId },
                })
              }
            />
          </Card>
        </>
      ) : null}

      <SectionLabel label={t('editor.badges')} className="mb-1 mt-7" />
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
            <Button label={t('editor.addBadge')} fullWidth={false} onPress={addBadge} />
          </View>
        ) : null}
      </Card>

      <View className="mt-8">
        <HoldButton label={t('editor.deleteSlot')} onComplete={remove} />
      </View>
    </Screen>
  );
};

export default EditSlot;
