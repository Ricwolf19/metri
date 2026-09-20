import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import ReorderableList, { reorderItems } from 'react-native-reorderable-list';

import { PlusIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  HoldButton,
  Input,
  ReorderRow,
  Screen,
  SectionLabel,
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
  reorderDays,
  updateRoutine,
} from '@/features/training/authoring.repo';
import { dayDisplayName, routineDisplayName } from '@/features/training/labels';
import { knownMuscles, muscleKey } from '@/features/training/muscles';
import { useT } from '@/i18n';
import { useReorderedList } from '@/lib/useReorderedList';
import { useBusyThen } from '@/lib/useBusyThen';
import { useTheme } from '@/theme/theme-context';

const MIN_WEEKS = 1;
const MAX_WEEKS = 12;

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
  const { data: days } = useLiveQuery(daysQuery(routineId));
  const [items, setItems] = useReorderedList(days);

  const [saved, setSaved] = useState({
    name: routine?.name ?? '',
    weeks: routine?.durationWeeks ?? 4,
  });
  const [name, setName] = useState(saved.name);
  const [weeks, setWeeks] = useState(saved.weeks);
  const dirty = name.trim() !== saved.name || weeks !== saved.weeks;

  const save = () => {
    if (!routineId) return false;
    // Empty is a valid name; every renderer falls back to the "phase-N" slug.
    const clean = name.trim();
    updateRoutine(routineId, { name: clean, durationWeeks: weeks });
    setName(clean);
    setSaved({ name: clean, weeks });
    toast.success(t('editor.savedToast'));
    return true;
  };

  const guard = useUnsavedGuard({ dirty, onSave: save });
  const saveAndClose = () => {
    if (save()) guard.leave(() => router.back());
  };
  const [adding, addThen] = useBusyThen();

  if (!user || !routine || !routineId) return <Redirect href="/training" />;

  const scope = routine.userProgramId;

  // Shrinking below the saved length deletes prescriptions: warn once, on the
  // way down, rather than at Save time (which may run from the leave guard).
  const setWeeksTo = (next: number) => {
    if (next < saved.weeks && weeks >= saved.weeks) {
      dialog.confirm({
        title: t('editor.weeks'),
        message: t('editor.shrinkWeeks'),
        confirmLabel: t('common.continue'),
        destructive: true,
        onConfirm: () => setWeeks(next),
      });
      return;
    }
    setWeeks(next);
  };

  const addSplit = () => {
    const day = addDay(routineId, scope, { name: '' });
    addThen(() => router.push({ pathname: '/training/edit/day/[id]', params: { id: day.id } }));
  };

  const remove = () => {
    deleteRoutine(routineId);
    toast.info(t('editor.deletedToast'));
    guard.leave(() => router.back());
  };

  const header = (
    <View>
      <Card className="gap-4">
        <Input
          label={t('editor.phaseName')}
          value={name}
          onChangeText={setName}
          placeholder={t('editor.phaseFallback', { n: routine.orderIndex + 1 })}
        />
        <Stepper
          label={t('editor.weeks')}
          value={weeks}
          min={MIN_WEEKS}
          max={MAX_WEEKS}
          onChange={setWeeksTo}
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
        <Button variant="brand" label={t('editor.save')} disabled={!dirty} onPress={saveAndClose} />
      }
    >
      <ReorderableList
        data={items}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => {
          const focus = knownMuscles(item.focusMuscles).map((m) => t(muscleKey(m)));
          return (
            <ReorderRow
              title={dayDisplayName(item, t)}
              subtitle={focus.length ? focus.join(' · ') : undefined}
              dragLabel={t('editor.dragHandle')}
              onPress={() =>
                router.push({ pathname: '/training/edit/day/[id]', params: { id: item.id } })
              }
            />
          );
        }}
        onReorder={({ from, to }) => {
          const next = reorderItems(items, from, to);
          setItems(next);
          reorderDays(
            routineId,
            next.map((d) => d.id),
          );
        }}
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
