import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import {
  ChevronDownIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
} from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Card, Input, PressableScale, Screen, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  addDay,
  applySplitScaffold,
  daysQuery,
  deleteDay,
  getRoutine,
  moveDay,
  updateRoutine,
} from '@/features/training/authoring.repo';
import { SPLIT_SIZES } from '@/features/training/splits';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const EditRoutine = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const { user } = useAuth();
  const { brand } = useTheme();

  const routine = typeof id === 'string' ? getRoutine(id) : null;
  const [name, setName] = useState(routine?.name ?? '');
  const [weeks, setWeeks] = useState(routine?.durationWeeks ?? 4);
  const { data: days } = useLiveQuery(daysQuery(typeof id === 'string' ? id : ''));

  if (!user || !routine || typeof id !== 'string') return <Redirect href="/training" />;

  const scope = routine.userProgramId;

  const saveName = () => {
    if (name.trim().length < 2) return;
    updateRoutine(id, { name: name.trim() });
    toast.success(t('editor.save'));
  };

  const setWeeksTo = (next: number) => {
    const w = Math.max(1, Math.min(12, next));
    setWeeks(w);
    updateRoutine(id, { durationWeeks: w });
  };

  const addSplit = (split: (typeof SPLIT_SIZES)[number]) => applySplitScaffold(id, scope, split);

  const addBlankDay = () => {
    const day = addDay(id, scope, { name: `${t('editor.dayName')} ${days.length + 1}` });
    router.push({ pathname: '/training/edit/day/[id]', params: { id: day.id } });
  };

  const confirmDeleteDay = (dayId: string) =>
    Alert.alert('', t('editor.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('editor.delete'), style: 'destructive', onPress: () => deleteDay(dayId) },
    ]);

  return (
    <Screen scroll edges={['top']} contentClassName="px-5 pb-10">
      <TopBar title={t('editor.phaseName')} showBack showAvatar={false} />

      <Card className="gap-4">
        <Input
          label={t('editor.phaseName')}
          value={name}
          onChangeText={setName}
          onBlur={saveName}
        />
        <View>
          <Text className="mb-1.5 font-mono-medium text-xs uppercase tracking-wider text-ink-300">
            {t('editor.weeks')}
          </Text>
          <View className="flex-row items-center gap-4">
            <Pressable
              onPress={() => setWeeksTo(weeks - 1)}
              className="h-11 w-11 items-center justify-center rounded-field border border-ink-700 bg-ink-800"
            >
              <MinusIcon color={brand} size={18} />
            </Pressable>
            <Text className="min-w-8 text-center text-xl font-sans-bold text-ink-50">{weeks}</Text>
            <Pressable
              onPress={() => setWeeksTo(weeks + 1)}
              className="h-11 w-11 items-center justify-center rounded-field border border-ink-700 bg-ink-800"
            >
              <PlusIcon color={brand} size={18} />
            </Pressable>
          </View>
        </View>
      </Card>

      {/* Quick split scaffolds */}
      <Text className="mb-2 mt-7 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('editor.chooseSplit')}
      </Text>
      <View className="flex-row gap-2">
        {SPLIT_SIZES.map((s) => (
          <Pressable
            key={s}
            onPress={() => addSplit(s)}
            className="flex-1 items-center rounded-field border border-ink-700 bg-ink-800 py-3"
          >
            <Text className="text-sm font-sans-semibold text-ink-100">
              {t('editor.split', { n: s })}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Days */}
      <Text className="mb-2 mt-7 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('editor.days')}
      </Text>
      {days.length === 0 ? (
        <Card className="items-center py-6">
          <Text className="text-sm text-ink-400">{t('editor.noDays')}</Text>
        </Card>
      ) : (
        <View className="gap-2">
          {days.map((d, i) => (
            <Card key={d.id} className="flex-row items-center">
              <View className="mr-1">
                <Pressable
                  onPress={() => moveDay(d.id, -1)}
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
                  onPress={() => moveDay(d.id, 1)}
                  disabled={i === days.length - 1}
                  hitSlop={4}
                  className={i === days.length - 1 ? 'opacity-25' : ''}
                >
                  <ChevronDownIcon color="#a1a1aa" size={16} />
                </Pressable>
              </View>
              <PressableScale
                onPress={() =>
                  router.push({ pathname: '/training/edit/day/[id]', params: { id: d.id } })
                }
                className="flex-1 flex-row items-center"
              >
                <View className="ml-2 flex-1">
                  <Text className="text-base font-sans-semibold text-ink-50">{d.name}</Text>
                  {d.focusMuscles?.length ? (
                    <Text className="mt-0.5 text-xs text-ink-400">{d.focusMuscles.join(', ')}</Text>
                  ) : null}
                </View>
                <ChevronRightIcon color="#71717a" />
              </PressableScale>
              <Pressable onPress={() => confirmDeleteDay(d.id)} hitSlop={8} className="ml-2">
                <TrashIcon color="#ef4444" size={18} />
              </Pressable>
            </Card>
          ))}
        </View>
      )}

      <Pressable
        onPress={addBlankDay}
        accessibilityRole="button"
        className="mt-3 flex-row items-center justify-center rounded-field border border-brand/30 bg-brand/10 py-3"
      >
        <PlusIcon color={brand} size={18} />
        <Text className="ml-1.5 text-sm font-sans-semibold text-brand">{t('editor.addDay')}</Text>
      </Pressable>
    </Screen>
  );
};

export default EditRoutine;
