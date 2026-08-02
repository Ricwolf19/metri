import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChevronDownIcon, ChevronRightIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Button, Card, Input, PressableScale, Screen, useToast, useDialog } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  addRoutine,
  deleteProgramTree,
  deleteRoutine,
  moveRoutine,
  routinesQuery,
  updateProgram,
} from '@/features/training/authoring.repo';
import { enrollInProgram } from '@/features/training/enroll';
import { getProgram } from '@/features/training/programs.repo';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const EditProgram = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const dialog = useDialog();
  const { user } = useAuth();
  const { brand } = useTheme();

  const program = typeof id === 'string' ? getProgram(id) : null;
  const [name, setName] = useState(program?.name ?? '');
  const { data: phases } = useLiveQuery(routinesQuery(typeof id === 'string' ? id : ''));

  if (!user || !program || typeof id !== 'string') return <Redirect href="/training" />;

  const saveName = () => {
    if (name.trim().length < 3) return;
    updateProgram(id, { name: name.trim() });
    toast.success(t('editor.save'));
  };

  const addPhase = () => {
    const routine = addRoutine(id, null, { name: `${t('editor.phaseName')} ${phases.length + 1}` });
    router.push({ pathname: '/training/edit/routine/[id]', params: { id: routine.id } });
  };

  const confirmDeletePhase = (routineId: string) =>
    dialog.show({
      title: t('editor.confirmDelete'),
      actions: [
        { label: t('common.cancel'), style: 'cancel' },
        {
          label: t('editor.delete'),
          style: 'destructive',
          onPress: () => deleteRoutine(routineId),
        },
      ],
    });

  const confirmDeleteProgram = () =>
    dialog.show({
      title: t('editor.confirmDelete'),
      actions: [
        { label: t('common.cancel'), style: 'cancel' },
        {
          label: t('editor.delete'),
          style: 'destructive',
          onPress: () => {
            deleteProgramTree(id);
            router.replace('/training/programs');
          },
        },
      ],
    });

  const enroll = () => {
    try {
      enrollInProgram(user.id, id);
      toast.success(t('editor.enrollStart'));
      router.replace('/training');
    } catch {
      toast.error(t('editor.noPhases'));
    }
  };

  return (
    <Screen scroll edges={['top']} contentClassName="px-5 pb-10">
      <TopBar title={t('editor.editProgram')} showBack showAvatar={false} />

      <Card>
        <Input
          label={t('editor.programName')}
          value={name}
          onChangeText={setName}
          onBlur={saveName}
        />
      </Card>

      <View className="mb-2 mt-7 flex-row items-center justify-between">
        <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
          {t('editor.phases')}
        </Text>
        <Text className="text-[11px] text-ink-500">{t('editor.phasesSub')}</Text>
      </View>

      {phases.length === 0 ? (
        <Card className="items-center py-6">
          <Text className="text-sm text-ink-400">{t('editor.noPhases')}</Text>
        </Card>
      ) : (
        <View className="gap-2">
          {phases.map((r, i) => (
            <Card key={r.id} className="flex-row items-center">
              <View className="mr-1">
                <Pressable
                  onPress={() => moveRoutine(r.id, -1)}
                  disabled={i === 0}
                  hitSlop={4}
                  className={i === 0 ? 'opacity-25' : ''}
                >
                  <ChevronDownIcon
                    color="#a1a1aa"
                    size={16}
                    style={{ transform: [{ rotate: '180deg' }] }}
                  />
                </Pressable>
                <Pressable
                  onPress={() => moveRoutine(r.id, 1)}
                  disabled={i === phases.length - 1}
                  hitSlop={4}
                  className={i === phases.length - 1 ? 'opacity-25' : ''}
                >
                  <ChevronDownIcon color="#a1a1aa" size={16} />
                </Pressable>
              </View>
              <PressableScale
                onPress={() =>
                  router.push({ pathname: '/training/edit/routine/[id]', params: { id: r.id } })
                }
                className="flex-1 flex-row items-center"
              >
                <View className="ml-2 flex-1">
                  <Text className="text-base font-sans-semibold text-ink-50">{r.name}</Text>
                  <Text className="mt-0.5 text-xs text-ink-400">
                    {t('training.weeks', { count: r.durationWeeks })}
                  </Text>
                </View>
                <ChevronRightIcon color="#71717a" />
              </PressableScale>
              <Pressable onPress={() => confirmDeletePhase(r.id)} hitSlop={8} className="ml-2">
                <TrashIcon color="#ef4444" size={18} />
              </Pressable>
            </Card>
          ))}
        </View>
      )}

      <Pressable
        onPress={addPhase}
        accessibilityRole="button"
        className="mt-3 flex-row items-center justify-center rounded-field border border-brand/30 bg-brand/10 py-3"
      >
        <PlusIcon color={brand} size={18} />
        <Text className="ml-1.5 text-sm font-sans-semibold text-brand">{t('editor.addPhase')}</Text>
      </Pressable>

      {phases.length > 0 ? (
        <View className="mt-8">
          <Button label={t('editor.enrollStart')} onPress={enroll} />
        </View>
      ) : null}

      <View className="mt-3">
        <Button label={t('editor.delete')} variant="danger" onPress={confirmDeleteProgram} />
      </View>
    </Screen>
  );
};

export default EditProgram;
