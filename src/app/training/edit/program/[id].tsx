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
  const { data: phases } = useLiveQuery(routinesQuery(programId, null));
  const [items, setItems] = useReorderedList(phases);

  const [saved, setSaved] = useState({
    name: program?.name ?? '',
    description: program?.description ?? '',
  });
  const [name, setName] = useState(saved.name);
  const [description, setDescription] = useState(saved.description);
  const dirty = name.trim() !== saved.name || description.trim() !== saved.description;

  const save = () => {
    const clean = name.trim();
    const desc = description.trim();
    if (clean.length < MIN_NAME || !programId) {
      toast.error(t('editor.nameRequired'));
      return false;
    }
    updateProgram(programId, { name: clean, description: desc || null });
    setName(clean);
    setDescription(desc);
    setSaved({ name: clean, description: desc });
    toast.success(t('editor.savedToast'));
    return true;
  };

  const guard = useUnsavedGuard({ dirty, onSave: save });
  const saveAndClose = () => {
    if (save()) guard.leave(() => router.back());
  };
  const [adding, addThen] = useBusyThen();

  if (!user || !program || !programId) return <Redirect href="/training" />;

  const addPhase = () => {
    // Created unnamed on purpose: the editor shows a "phase-N" fallback until the user names it.
    const routine = addRoutine(programId, null, { name: '' });
    addThen(() =>
      router.push({ pathname: '/training/edit/routine/[id]', params: { id: routine.id } }),
    );
  };

  const remove = () => {
    if (!deleteProgramTree(programId)) {
      dialog.show({
        title: t('editor.inUseProgram'),
        actions: [{ label: t('common.continue'), style: 'cancel' }],
      });
      return;
    }
    toast.info(t('editor.deletedToast'));
    guard.leave(() => router.replace('/training'));
  };

  const header = (
    <View>
      <Card className="gap-4">
        <Input label={t('editor.programName')} value={name} onChangeText={setName} />
        <Input
          label={t('editor.description')}
          value={description}
          onChangeText={setDescription}
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
        <Button variant="brand" label={t('editor.save')} disabled={!dirty} onPress={saveAndClose} />
      }
    >
      <ReorderableList
        data={items}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <ReorderRow
            title={routineDisplayName(item, t)}
            subtitle={t('training.weeks', { count: item.durationWeeks })}
            dragLabel={t('editor.dragHandle')}
            onPress={() =>
              router.push({ pathname: '/training/edit/routine/[id]', params: { id: item.id } })
            }
          />
        )}
        onReorder={({ from, to }) => {
          const next = reorderItems(items, from, to);
          setItems(next);
          reorderRoutines(
            programId,
            null,
            next.map((r) => r.id),
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

export default EditProgram;
