import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Controller, useController } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { ControlledInput, useSaveForm } from '@/components/form';
import { XIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  ChipRow,
  DurationPicker,
  HoldButton,
  Screen,
  SectionLabel,
  Stepper,
  type ChipItem,
  useToast,
  useUnsavedGuard,
} from '@/components/ui';
import type { IntensityType } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { BadgesEditor } from '@/features/training/components/BadgesEditor';
import {
  deleteSlot,
  getDay,
  getSlot,
  getSlotConfigs,
  saveSlotDraft,
  setSlotAlternatives,
} from '@/features/training/authoring.repo';
import { getExercise } from '@/features/training/exercises.repo';
import { INTENSITY_KEY, dayDisplayName, exerciseDisplayName } from '@/features/training/labels';
import {
  DEFAULT_REST,
  isComplete,
  toFreshDraft,
  toValues,
  toWeekDraft,
  type Method,
  type WeekDraft,
} from '@/features/training/slot-draft';
import { useI18n, useT } from '@/i18n';
import { mmss } from '@/lib/duration';
import { useTheme } from '@/theme/theme-context';

type SlotDraft = { weeks: WeekDraft[]; badges: string[]; notes: string };

/** Slot editor: draft written in one Save. A fresh slot (`fresh=1`) is deleted if the user leaves
 * unsaved, so no half-configured exercise reaches a workout. */
const EditSlot = () => {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const t = useT();
  const { muted } = useTheme();
  const { locale } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  const slotId = typeof id === 'string' ? id : '';
  const isFresh = fresh === '1';
  const [slot] = useState(() => (slotId ? getSlot(slotId) : null));
  const exercise = slot ? getExercise(slot.exerciseId) : null;
  const day = slot ? getDay(slot.workoutDayId) : null;

  const [week, setWeek] = useState(1);
  const [restOpen, setRestOpen] = useState(false);
  const [alternatives, setAlternatives] = useState<string[]>(slot?.alternativeExerciseIds ?? []);
  // The picker appends alternatives and comes back; re-read them on focus.
  useFocusEffect(
    useCallback(() => {
      if (slotId) setAlternatives(getSlot(slotId)?.alternativeExerciseIds ?? []);
    }, [slotId]),
  );

  // A fresh slot is a `create`: its seeded draft is worth saving untouched (and
  // leaving it unsaved deletes it); an existing one saves only a real change.
  // Read once: the form takes its defaults at creation only.
  const [initial] = useState<SlotDraft>(() => {
    const fallback = slot?.defaultRestSeconds ?? DEFAULT_REST;
    return {
      weeks: slotId
        ? getSlotConfigs(slotId).map((c) =>
            isFresh ? toFreshDraft(c, fallback) : toWeekDraft(c, fallback),
          )
        : [],
      badges: slot?.badges ?? [],
      notes: slot?.notes ?? '',
    };
  });
  const draft = useSaveForm<SlotDraft>({
    kind: isFresh ? 'create' : 'edit',
    defaultValues: initial,
    onInvalid: () => toast.error(t('editor.completeWeeksHint')),
    onSave: ({ weeks, badges, notes }) => {
      if (!slot) return false;
      saveSlotDraft(slot.id, {
        defaultRestSeconds: slot.defaultRestSeconds ?? DEFAULT_REST,
        badges,
        notes,
        weeks: weeks.map((w) => ({
          weekNumber: w.weekNumber,
          values: toValues(w),
          setGroups: w.setGroups,
        })),
      });
      toast.success(t('editor.savedToast'));
    },
  });
  const { field: weeksField } = useController({
    control: draft.control,
    name: 'weeks',
    rules: { validate: (all) => all.every(isComplete) },
  });
  const weeks = weeksField.value;
  const allComplete = weeks.every(isComplete);
  const unsaved = (isFresh && !draft.saved) || draft.isDirty;

  const guard = useUnsavedGuard({
    dirty: unsaved,
    onSave: draft.saveNow,
    onDiscard: () => {
      if (isFresh && slot) deleteSlot(slot.id);
    },
  });
  const saveAndClose = () => {
    if (draft.saveNow()) guard.leave(() => router.back());
  };

  if (!user || !slot || !exercise || !slotId) return <Redirect href="/training" />;

  const cfg = weeks.find((w) => w.weekNumber === week) ?? weeks[0] ?? null;

  const patchWeek = (weekNumber: number, patch: Partial<WeekDraft>) =>
    weeksField.onChange(weeks.map((w) => (w.weekNumber === weekNumber ? { ...w, ...patch } : w)));
  const patch = (p: Partial<WeekDraft>) => {
    if (cfg) patchWeek(cfg.weekNumber, p);
  };
  const applyToAll = () => {
    if (!cfg) return;
    weeksField.onChange(weeks.map((w) => ({ ...cfg, weekNumber: w.weekNumber })));
    toast.success(t('editor.applyToAll'));
  };

  // Alternatives are structural: the picker appends immediately, removal too.
  const removeAlternative = (altId: string) => {
    const next = alternatives.filter((x) => x !== altId);
    setAlternatives(next);
    setSlotAlternatives(slot.id, next);
  };

  const remove = () => {
    deleteSlot(slot.id);
    toast.info(t('editor.deletedToast'));
    guard.leave(() => router.back());
  };

  const methodItems: ChipItem<Method>[] = [
    { value: 'failure', label: t('editor.toFailure') },
    ...(Object.keys(INTENSITY_KEY) as IntensityType[]).map((k) => ({
      value: k,
      label: t(INTENSITY_KEY[k]),
    })),
  ];

  // Picking a method seeds its sub-values; the method choice is the deliberate act.
  const changeMethod = (method: Method) => {
    if (method === 'rir') patch({ method, rirMin: cfg?.rirMin ?? 2, rirMax: cfg?.rirMax ?? 3 });
    else if (method === 'rpe') patch({ method, intensityValue: 8 });
    else if (method === 'percentage') patch({ method, intensityValue: 70 });
    else patch({ method, intensityValue: null });
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
          title={exerciseDisplayName(exercise, locale)}
          subtitle={day ? dayDisplayName(day, t) : undefined}
        />
      }
      footer={
        <View>
          {unsaved && !allComplete ? (
            <Text className="mb-2 text-center text-xs text-ink-400">
              {t('editor.completeWeeksHint')}
            </Text>
          ) : null}
          <Button
            variant="brand"
            label={t('editor.save')}
            disabled={!draft.canSave}
            onPress={saveAndClose}
          />
        </View>
      }
    >
      {weeks.length > 1 ? (
        <View className="mb-4 flex-row flex-wrap gap-2">
          {weeks.map((w) => {
            const active = w.weekNumber === (cfg?.weekNumber ?? 1);
            const done = isComplete(w);
            return (
              <Pressable
                key={w.weekNumber}
                onPress={() => setWeek(w.weekNumber)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className={[
                  'flex-row items-center gap-1.5 rounded-full border px-3.5 py-1.5',
                  active ? 'border-brand/40 bg-brand/15' : 'border-ink-700 bg-ink-800',
                ].join(' ')}
              >
                <View
                  className={['h-1.5 w-1.5 rounded-full', done ? 'bg-brand' : 'bg-ink-600'].join(
                    ' ',
                  )}
                />
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

      {cfg ? (
        <Card>
          {/* 1 — effort method: the measurement decision comes first. */}
          <Text className="mb-2 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
            {t('editor.intensity')}
          </Text>
          <ChipRow items={methodItems} value={cfg.method} onChange={changeMethod} />
          {cfg.method === 'rir' ? (
            <View className="mt-3 flex-row">
              <View className="flex-1">
                <Stepper
                  label={t('editor.rirMin')}
                  value={cfg.rirMin}
                  min={0}
                  max={5}
                  onChange={(n) => patch({ rirMin: n, rirMax: Math.max(n, cfg.rirMax ?? n) })}
                />
              </View>
              <View className="flex-1">
                <Stepper
                  label={t('editor.rirMax')}
                  value={cfg.rirMax}
                  min={cfg.rirMin ?? 0}
                  max={5}
                  onChange={(n) => patch({ rirMax: n })}
                />
              </View>
            </View>
          ) : cfg.method === 'rpe' ? (
            <View className="mt-3">
              <Stepper
                label={t('intensity.rpe')}
                value={cfg.intensityValue}
                min={5}
                max={10}
                unsetSeed={8}
                onChange={(n) => patch({ intensityValue: n })}
              />
            </View>
          ) : cfg.method === 'percentage' ? (
            <View className="mt-3">
              <Stepper
                label={t('intensity.percentage')}
                value={cfg.intensityValue}
                min={30}
                max={100}
                step={5}
                unsetSeed={70}
                format={(n) => `${n}%`}
                onChange={(n) => patch({ intensityValue: n })}
              />
            </View>
          ) : null}

          <View className="my-4 h-px bg-ink-800" />

          {/* 2 — prescription: sets and reps share a row instead of one long column. */}
          <Text className="mb-1 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
            {t('editor.prescription')}
          </Text>
          <View className="flex-row">
            <View className="flex-1">
              <Stepper
                label={t('editor.sets')}
                value={cfg.sets}
                min={1}
                onChange={(n) => patch({ sets: n })}
              />
            </View>
            <View className="flex-1">
              <Stepper
                label={t('editor.reps')}
                value={cfg.reps}
                min={1}
                onChange={(n) => patch({ reps: n })}
              />
            </View>
          </View>
          <Stepper
            label={t('editor.repsMax')}
            value={cfg.reps == null ? null : (cfg.repsMax ?? cfg.reps)}
            min={cfg.reps ?? 1}
            format={(n) => (cfg.reps != null && n > cfg.reps ? `${n}` : '—')}
            onChange={(n) => patch({ repsMax: cfg.reps != null && n > cfg.reps ? n : null })}
          />

          <View className="my-4 h-px bg-ink-800" />

          {/* 3 — rest, per week (apply-to-all copies it with everything else). */}
          <View className="flex-row items-center justify-between">
            <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
              {t('editor.rest')}
            </Text>
            <Pressable
              onPress={() => setRestOpen((v) => !v)}
              accessibilityRole="button"
              className="rounded-field border border-ink-700 bg-ink-800 px-4 py-2"
            >
              <Text className="font-mono text-base text-ink-50">{mmss(cfg.restSeconds)}</Text>
            </Pressable>
          </View>
          {restOpen ? (
            <View className="mt-3">
              <DurationPicker
                seconds={cfg.restSeconds}
                onChange={(s) => patch({ restSeconds: Math.max(5, s) })}
              />
            </View>
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
                  className="max-w-full flex-row items-center gap-1.5 rounded-full bg-ink-800 px-3 py-1.5"
                >
                  <Text numberOfLines={1} className="shrink text-xs font-sans-medium text-ink-200">
                    {exerciseDisplayName(alt, locale)}
                  </Text>
                  <Pressable
                    onPress={() => removeAlternative(altId)}
                    hitSlop={16}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.removeNamed', {
                      name: exerciseDisplayName(alt, locale),
                    })}
                  >
                    <XIcon color={muted} size={13} />
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

      <SectionLabel label={t('editor.badges')} className="mb-1 mt-7" />
      <Text className="mb-2 text-[11px] text-ink-500">{t('editor.badgesHint')}</Text>
      <Card>
        <Controller
          control={draft.control}
          name="badges"
          render={({ field }) => <BadgesEditor value={field.value} onChange={field.onChange} />}
        />
      </Card>

      <SectionLabel label={t('editor.notes')} className="mb-1 mt-7" />
      <Text className="mb-2 text-[11px] text-ink-500">{t('editor.notesHint')}</Text>
      <Card>
        <ControlledInput
          control={draft.control}
          name="notes"
          // Named by the section label above it.
          accessibilityLabel={t('editor.notes')}
          hint={t('editor.notesExample')}
          multiline
        />
      </Card>

      <View className="mt-8">
        <HoldButton label={t('editor.deleteSlot')} onComplete={remove} />
      </View>
    </Screen>
  );
};

export default EditSlot;
