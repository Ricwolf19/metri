import { useLiveQuery } from '@/db/useLiveQuery';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';
import ReorderableList, { reorderItems } from 'react-native-reorderable-list';

import { ControlledInput, useSaveForm } from '@/components/form';
import { PlusIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  HoldButton,
  ReorderRow,
  moveActions,
  Screen,
  SectionLabel,
  Select,
  Stepper,
  useDialog,
  useToast,
  useUnsavedGuard,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  addDay,
  daysQuery,
  deleteRoutine,
  getRoutine,
  dayMuscleHeads,
  reorderDays,
  updateRoutine,
} from '@/features/training/authoring.repo';
import { dayDisplayName, routineDisplayName } from '@/features/training/labels';
import { muscleHeadKey } from '@/features/training/muscles';
import { clampRmTestWeek } from '@/features/training/progression';
import { useT } from '@/i18n';
import { useReorderedList } from '@/lib/useReorderedList';
import { useBusyThen } from '@/lib/useBusyThen';
import { useTheme } from '@/theme/theme-context';

const MIN_WEEKS = 1;
const MAX_WEEKS = 12;

type PhaseDraft = { name: string; weeks: number; rmTest: number | null };

/** Phase editor: name + weeks buffered until Save; splits reorder by drag. */
const EditRoutine = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const dialog = useDialog();
  const { user } = useAuth();
  const { brand } = useTheme();
  const routineId = typeof id === 'string' ? id : '';

  const [routine] = useState(() => (routineId ? getRoutine(routineId) : null));
  const { data: days } = useLiveQuery(daysQuery(routineId), [routineId]);
  const [items, setItems] = useReorderedList(days);

  const draft = useSaveForm<PhaseDraft>({
    defaultValues: {
      name: routine?.name ?? '',
      weeks: routine?.durationWeeks ?? 4,
      rmTest: routine?.rmTestWeek ?? null,
    },
    // Empty is a valid name; every renderer falls back to the "phase-N" slug.
    // A test week past a shortened phase is dropped, never pointed past the end.
    normalize: ({ name, weeks, rmTest }) => ({
      name: name.trim(),
      weeks,
      rmTest: clampRmTestWeek(rmTest, weeks),
    }),
    onSave: ({ name, weeks, rmTest }) => {
      if (!routineId) return false;
      updateRoutine(routineId, { name, durationWeeks: weeks, rmTestWeek: rmTest });
      toast.success(t('editor.savedToast'));
    },
  });
  const [name, weeks, rmTest] = useWatch({
    control: draft.control,
    name: ['name', 'weeks', 'rmTest'],
  });
  const rmTestShown = clampRmTestWeek(rmTest, weeks);

  const guard = useUnsavedGuard({ dirty: draft.isDirty, onSave: draft.saveNow });
  const saveAndClose = () => {
    if (draft.saveNow()) guard.leave(() => router.back());
  };
  const [adding, addThen] = useBusyThen();

  if (!user || !routine || !routineId) return <Redirect href="/training" />;

  const scope = routine.userProgramId;

  // Shrinking below the saved length deletes prescriptions: warn once, on the
  // way down, rather than at Save time (which may run from the leave guard).
  const setWeeksTo = (next: number, set: (weeks: number) => void) => {
    const savedWeeks = draft.formState.defaultValues?.weeks ?? weeks;
    if (next < savedWeeks && weeks >= savedWeeks) {
      dialog.confirm({
        title: t('editor.weeks'),
        message: t('editor.shrinkWeeks'),
        confirmLabel: t('common.continue'),
        destructive: true,
        onConfirm: () => set(next),
      });
      return;
    }
    set(next);
  };

  const addSplit = () =>
    addThen(
      (day) => router.push({ pathname: '/training/edit/day/[id]', params: { id: day.id } }),
      () => addDay(routineId, scope, { name: '' }),
    );

  const remove = () => {
    deleteRoutine(routineId);
    toast.info(t('editor.deletedToast'));
    guard.leave(() => router.back());
  };

  const header = (
    <View>
      <Card className="gap-4">
        <ControlledInput
          control={draft.control}
          name="name"
          label={t('editor.phaseName')}
          hint={t('editor.blankNameHint', {
            name: t('editor.phaseFallback', { n: routine.orderIndex + 1 }),
          })}
        />
        <Controller
          control={draft.control}
          name="weeks"
          render={({ field }) => (
            <Stepper
              label={t('editor.weeks')}
              value={field.value}
              min={MIN_WEEKS}
              max={MAX_WEEKS}
              onChange={(next) => setWeeksTo(next, field.onChange)}
            />
          )}
        />
        <Controller
          control={draft.control}
          name="rmTest"
          render={({ field }) => (
            <Select
              label={t('editor.rmTestWeek')}
              items={[
                { value: 'none', label: t('editor.rmTestNone') },
                ...Array.from({ length: weeks }, (_, i) => ({
                  value: String(i + 1),
                  label: t('training.weekN', { n: i + 1 }),
                })),
              ]}
              value={rmTestShown == null ? 'none' : String(rmTestShown)}
              onChange={(v) => field.onChange(v === 'none' ? null : Number(v))}
            />
          )}
        />
      </Card>
      <SectionLabel label={t('editor.splits')} hint={t('editor.splitsSub')} />
      {items.length === 0 ? (
        <Card className="mb-2 items-center py-6">
          <Text className="text-sm text-ink-400">{t('editor.noSplits')}</Text>
        </Card>
      ) : null}
    </View>
  );

  const footer = (
    <View>
      <View className="mt-1">
        <Button
          label={t('editor.addSplit')}
          leftIcon={<PlusIcon color={brand} size={18} />}
          loading={adding}
          onPress={addSplit}
        />
      </View>
      <View className="mt-8">
        <HoldButton label={t('editor.deletePhase')} onComplete={remove} />
      </View>
    </View>
  );

  // One reorder for the drag and for the screen reader's move up / move down.
  const move = (from: number, to: number) => {
    const next = reorderItems(items, from, to);
    setItems(next);
    reorderDays(
      routineId,
      next.map((d) => d.id),
    );
  };

  return (
    <Screen
      edges={['top']}
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={name.trim() || routineDisplayName(routine, t)}
          subtitle={t('editor.phaseName')}
        />
      }
      footer={
        <Button
          variant="brand"
          label={t('editor.save')}
          disabled={!draft.canSave}
          onPress={saveAndClose}
        />
      }
    >
      <ReorderableList
        data={items}
        keyExtractor={(d) => d.id}
        renderItem={({ item, index }) => {
          const focus = dayMuscleHeads(item.id)
            .slice(0, 4)
            .map((h) => t(muscleHeadKey(h)));
          return (
            <ReorderRow
              {...moveActions(index, items.length, move)}
              title={dayDisplayName(item, t)}
              subtitle={focus.length ? focus.join(' · ') : undefined}
              dragLabel={t('editor.dragHandle')}
              onPress={() =>
                router.push({ pathname: '/training/edit/day/[id]', params: { id: item.id } })
              }
            />
          );
        }}
        onReorder={({ from, to }) => move(from, to)}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
};

export default EditRoutine;
