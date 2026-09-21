import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import ReorderableList, { reorderItems } from 'react-native-reorderable-list';

import { PlusIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  BadgeRow,
  Button,
  Card,
  HoldButton,
  Input,
  ReorderRow,
  Screen,
  SectionLabel,
  useToast,
  useUnsavedGuard,
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
import { ExerciseDocButton } from '@/features/training/components/ExerciseDocButton';
import {
  DEFAULT_START_MINUTE,
  StartTimeField,
} from '@/features/training/components/StartTimeField';
import { WeekdayChips } from '@/features/training/components/WeekdayChips';
import { exerciseHeads, muscleHeadKey, type MuscleHead } from '@/features/training/muscles';
import { syncTrainingReminder } from '@/features/training/reminders';
import {
  dayDisplayName,
  exerciseDisplayName,
  routineDisplayName,
} from '@/features/training/labels';
import { useI18n, useT } from '@/i18n';
import { useReorderedList } from '@/lib/useReorderedList';
import { useBusyThen } from '@/lib/useBusyThen';
import { useTheme } from '@/theme/theme-context';

type Draft = {
  name: string;
  weekday: number | null;
  startMinute: number | null;
};

/** Split editor: name + tags (+ schedule on the live copy) buffered until Save; exercise order persists on drop. */
const EditDay = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { locale } = useI18n();
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
    weekday: day?.weekday ?? null,
    startMinute: day?.startMinute ?? null,
  };
  const [saved, setSaved] = useState<Draft>(initial);
  const [draft, setDraft] = useState<Draft>(initial);
  const [timeOpen, setTimeOpen] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const patch = (p: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...p }));

  const save = () => {
    if (!dayId) return false;
    // Empty is a valid name; every renderer falls back to the "split-N" slug.
    const name = draft.name.trim();
    updateDay(dayId, {
      name,
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

  // The split's muscles are a fact of its exercises, not a manual tag list.
  const muscles: MuscleHead[] = [];
  for (const item of items) {
    for (const h of exerciseHeads(item.exercise)) {
      if (!muscles.includes(h)) muscles.push(h);
    }
  }

  const header = (
    <View>
      <Card className="gap-4">
        <Input
          label={t('editor.splitName')}
          value={draft.name}
          onChangeText={(name) => patch({ name })}
          placeholder={t('editor.splitFallback', { n: day.orderIndex + 1 })}
        />
        {muscles.length ? (
          <View>
            <Text className="mb-1.5 font-mono-medium text-xs uppercase tracking-wider text-ink-300">
              {t('editor.muscles')}
            </Text>
            <BadgeRow items={muscles.map((h) => ({ value: h, label: t(muscleHeadKey(h)) }))} />
          </View>
        ) : null}
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

      <SectionLabel label={t('editor.exercises')} hint={t('editor.exercisesSub')} />
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
          title={draft.name.trim() || dayDisplayName(day, t)}
          subtitle={routine ? routineDisplayName(routine, t) : undefined}
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
            title={exerciseDisplayName(item.exercise, locale)}
            subtitle={item.slot.badges?.length ? item.slot.badges.join(' · ') : undefined}
            dragLabel={t('editor.dragHandle')}
            onPress={() =>
              router.push({ pathname: '/training/edit/slot/[id]', params: { id: item.slot.id } })
            }
            right={<ExerciseDocButton exerciseId={item.exercise.id} />}
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
