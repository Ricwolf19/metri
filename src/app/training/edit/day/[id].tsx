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
  TagPicker,
  useToast,
  useUnsavedGuard,
  type TagSection,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  deleteDay,
  getDay,
  getRoutine,
  reorderSlots,
  slotsQuery,
  updateDay,
} from '@/features/training/authoring.repo';
import {
  DEFAULT_START_MINUTE,
  StartTimeField,
} from '@/features/training/components/StartTimeField';
import { WeekdayChips } from '@/features/training/components/WeekdayChips';
import { MUSCLES, MUSCLE_REGIONS, knownMuscles, muscleKey } from '@/features/training/muscles';
import { syncTrainingReminder } from '@/features/training/reminders';
import { useT } from '@/i18n';
import { useReorderedList } from '@/lib/useReorderedList';
import { useBusyThen } from '@/lib/useBusyThen';
import { useTheme } from '@/theme/theme-context';

type Draft = {
  name: string;
  focus: string[];
  weekday: number | null;
  startMinute: number | null;
};

/** Split editor: name + tags (+ schedule on the live copy) buffered until Save; exercise order persists on drop. */
const EditDay = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const { user } = useAuth();
  const { brand } = useTheme();
  const dayId = typeof id === 'string' ? id : '';

  const [day] = useState(() => (dayId ? getDay(dayId) : null));
  const routine = day ? getRoutine(day.routineId) : null;
  const live = !!day?.userProgramId;
  const { data: slots } = useLiveQuery(slotsQuery(dayId));
  const [items, setItems] = useReorderedList(slots);

  const initial: Draft = {
    name: day?.name ?? '',
    focus: knownMuscles(day?.focusMuscles),
    weekday: day?.weekday ?? null,
    startMinute: day?.startMinute ?? null,
  };
  const [saved, setSaved] = useState<Draft>(initial);
  const [draft, setDraft] = useState<Draft>(initial);
  const [timeOpen, setTimeOpen] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const patch = (p: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...p }));

  const save = () => {
    const name = draft.name.trim();
    if (!name || !dayId) {
      toast.error(t('editor.nameRequired'));
      return false;
    }
    updateDay(dayId, {
      name,
      focusMuscles: draft.focus.length ? draft.focus : null,
      ...(live ? { weekday: draft.weekday, startMinute: draft.startMinute } : {}),
    });
    if (live && user) void syncTrainingReminder(user.id);
    const next = { ...draft, name };
    setDraft(next);
    setSaved(next);
    toast.success(t('editor.savedToast'));
    return true;
  };

  const guard = useUnsavedGuard({ dirty, onSave: save });
  const saveAndClose = () => {
    if (save()) guard.leave(() => router.back());
  };
  const [adding, addThen] = useBusyThen();

  if (!user || !day || !dayId) return <Redirect href="/training" />;

  const remove = () => {
    deleteDay(dayId);
    toast.info(t('editor.deletedToast'));
    guard.leave(() => router.back());
  };

  const sections: TagSection[] = [
    {
      title: t('editor.regions'),
      items: MUSCLE_REGIONS.map((m) => ({ value: m, label: t(muscleKey(m)) })),
    },
    {
      title: t('editor.muscles'),
      items: MUSCLES.map((m) => ({ value: m, label: t(muscleKey(m)) })),
    },
  ];

  const header = (
    <View>
      <Card className="gap-4">
        <Input
          label={t('editor.splitName')}
          value={draft.name}
          onChangeText={(name) => patch({ name })}
        />
        <TagPicker
          label={t('editor.focusMuscles')}
          sections={sections}
          value={draft.focus}
          onChange={(focus) => patch({ focus })}
          placeholder={t('editor.focusMusclesEmpty')}
          doneLabel={t('common.done')}
        />
        {live ? (
          <View>
            <Text className="mb-1.5 font-mono-medium text-xs uppercase tracking-wider text-ink-300">
              {t('editor.schedule')}
            </Text>
            <WeekdayChips
              selected={draft.weekday == null ? [] : [draft.weekday]}
              onPress={(weekday) => patch({ weekday })}
            />
            <StartTimeField
              value={draft.startMinute}
              open={timeOpen}
              onToggle={() => {
                if (draft.startMinute == null) patch({ startMinute: DEFAULT_START_MINUTE });
                setTimeOpen((v) => !v);
              }}
              onChange={(startMinute) => patch({ startMinute })}
            />
          </View>
        ) : null}
      </Card>

      <SectionLabel label={t('editor.exercises')} />
      {items.length === 0 ? (
        <Card className="mb-2 items-center py-6">
          <Text className="text-sm text-ink-400">{t('editor.noExercises')}</Text>
        </Card>
      ) : null}
    </View>
  );

  const footer = (
    <View>
      <View className="mt-1">
        <Button
          label={t('editor.addExercise')}
          leftIcon={<PlusIcon color={brand} size={18} />}
          loading={adding}
          onPress={() =>
            addThen(() =>
              router.push({ pathname: '/training/edit/exercise-picker', params: { dayId } }),
            )
          }
        />
      </View>
      <View className="mt-8">
        <HoldButton label={t('editor.deleteSplit')} onComplete={remove} />
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
          title={draft.name.trim() || day.name}
          subtitle={routine?.name}
        />
      }
      footer={
        <Button variant="brand" label={t('editor.save')} disabled={!dirty} onPress={saveAndClose} />
      }
    >
      <ReorderableList
        data={items}
        keyExtractor={(row) => row.slot.id}
        renderItem={({ item }) => (
          <ReorderRow
            title={item.exercise.name}
            subtitle={item.slot.badges?.length ? item.slot.badges.join(' · ') : undefined}
            dragLabel={t('editor.dragHandle')}
            onPress={() =>
              router.push({ pathname: '/training/edit/slot/[id]', params: { id: item.slot.id } })
            }
          />
        )}
        onReorder={({ from, to }) => {
          const next = reorderItems(items, from, to);
          setItems(next);
          reorderSlots(
            dayId,
            next.map((row) => row.slot.id),
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

export default EditDay;
