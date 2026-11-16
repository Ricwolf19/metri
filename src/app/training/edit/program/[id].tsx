import { useLiveQuery } from '@/db/useLiveQuery';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useWatch } from 'react-hook-form';
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
  useDialog,
  useToast,
  useUnsavedGuard,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  addRoutine,
  deleteProgramTree,
  reorderRoutines,
  routinesQuery,
  updateProgram,
} from '@/features/training/authoring.repo';
import { routineDisplayName } from '@/features/training/labels';
import { getProgram } from '@/features/training/programs.repo';
import { useT } from '@/i18n';
import { useReorderedList } from '@/lib/useReorderedList';
import { useBusyThen } from '@/lib/useBusyThen';
import { useTheme } from '@/theme/theme-context';

const MIN_NAME = 3;

type ProgramDraft = { name: string; description: string };

/** Program editor (template): name + description buffered; phases reorder by drag. */
const EditProgram = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const dialog = useDialog();
  const { user } = useAuth();
  const { brand } = useTheme();
  const programId = typeof id === 'string' ? id : '';

  const [program] = useState(() => (programId ? getProgram(programId) : null));
  const { data: phases } = useLiveQuery(routinesQuery(programId, null), [programId]);
  const [items, setItems] = useReorderedList(phases);

  const draft = useSaveForm<ProgramDraft>({
    defaultValues: { name: program?.name ?? '', description: program?.description ?? '' },
    normalize: ({ name, description }) => ({ name: name.trim(), description: description.trim() }),
    onInvalid: () => toast.error(t('editor.nameRequired')),
    onSave: ({ name, description }) => {
      if (!programId) return false;
      updateProgram(programId, { name, description: description || null });
      toast.success(t('editor.savedToast'));
    },
  });
  const name = useWatch({ control: draft.control, name: 'name' });

  const guard = useUnsavedGuard({ dirty: draft.isDirty, onSave: draft.saveNow });
  const saveAndClose = () => {
    if (draft.saveNow()) guard.leave(() => router.back());
  };
  const [adding, addThen] = useBusyThen();

  if (!user || !program || !programId) return <Redirect href="/training" />;

  const addPhase = () =>
    addThen(
      (routine) =>
        router.push({ pathname: '/training/edit/routine/[id]', params: { id: routine.id } }),
      // Created unnamed on purpose: the editor shows a "phase-N" fallback until the user names it.
      () => addRoutine(programId, null, { name: '' }),
    );

  const remove = () => {
    if (!deleteProgramTree(programId)) {
      dialog.show({
        title: t('editor.inUseProgram'),
        actions: [{ label: t('common.continue'), style: 'cancel' }],
      });
      return;
    }
    toast.info(t('editor.deletedToast'));
    guard.leave(() => router.dismissTo('/training'));
  };

  const header = (
    <View>
      <Card className="gap-4">
        <ControlledInput
          control={draft.control}
          name="name"
          rules={{ validate: (v) => v.trim().length >= MIN_NAME || t('editor.nameRequired') }}
          label={t('editor.programName')}
        />
        <ControlledInput
          control={draft.control}
          name="description"
          label={t('editor.description')}
          placeholder={t('editor.descriptionPh')}
          multiline
        />
      </Card>
      <SectionLabel label={t('editor.phases')} hint={t('editor.phasesSub')} />
      {items.length === 0 ? (
        <Card className="mb-2 items-center py-6">
          <Text className="text-sm text-ink-400">{t('editor.noPhases')}</Text>
        </Card>
      ) : null}
    </View>
  );

  const footer = (
    <View>
      <View className="mt-1">
        <Button
          label={t('editor.addPhase')}
          leftIcon={<PlusIcon color={brand} size={18} />}
          loading={adding}
          onPress={addPhase}
        />
      </View>
      <View className="mt-8">
        <HoldButton label={t('editor.deleteProgram')} onComplete={remove} />
      </View>
    </View>
  );

  // One reorder for the drag and for the screen reader's move up / move down.
  const move = (from: number, to: number) => {
    const next = reorderItems(items, from, to);
    setItems(next);
    reorderRoutines(
      programId,
      null,
      next.map((r) => r.id),
    );
  };

  return (
    <Screen
      edges={['top']}
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={name.trim() || program.name}
          subtitle={t('editor.editProgram')}
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
        keyExtractor={(r) => r.id}
        renderItem={({ item, index }) => (
          <ReorderRow
            {...moveActions(index, items.length, move)}
            title={routineDisplayName(item, t)}
            subtitle={t('training.weeks', { count: item.durationWeeks })}
            dragLabel={t('editor.dragHandle')}
            onPress={() =>
              router.push({ pathname: '/training/edit/routine/[id]', params: { id: item.id } })
            }
          />
        )}
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

export default EditProgram;
