import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChevronDownIcon, ChevronRightIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Card,
  Input,
  PressableScale,
  Screen,
  ScreenTitle,
  useDialog,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  deleteSlot,
  getDay,
  moveSlot,
  slotsQuery,
  updateDay,
} from '@/features/training/authoring.repo';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const EditDay = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const dialog = useDialog();
  const { user } = useAuth();
  const { brand } = useTheme();

  const day = typeof id === 'string' ? getDay(id) : null;
  const [name, setName] = useState(day?.name ?? '');
  const [focus, setFocus] = useState((day?.focusMuscles ?? []).join(', '));
  const { data: slots } = useLiveQuery(slotsQuery(typeof id === 'string' ? id : ''));

  if (!user || !day || typeof id !== 'string') return <Redirect href="/training" />;

  const saveName = () => {
    if (name.trim().length < 1) return;
    updateDay(id, { name: name.trim() });
  };
  const saveFocus = () => {
    const muscles = focus
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    updateDay(id, { focusMuscles: muscles.length ? muscles : null });
    toast.success(t('editor.save'));
  };

  const confirmDeleteSlot = (slotId: string) =>
    dialog.show({
      title: t('editor.confirmDelete'),
      actions: [
        { label: t('common.cancel'), style: 'cancel' },
        { label: t('editor.delete'), style: 'destructive', onPress: () => deleteSlot(slotId) },
      ],
    });

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-10"
      header={<TopBar showBack showAvatar={false} />}
    >
      <ScreenTitle title={name.trim() || day.name} />

      <Card className="gap-4">
        <Input label={t('editor.dayName')} value={name} onChangeText={setName} onBlur={saveName} />
        <Input
          label={t('editor.focusMuscles')}
          value={focus}
          onChangeText={setFocus}
          onBlur={saveFocus}
          placeholder={t('editor.focusMusclesPh')}
          autoCapitalize="none"
        />
      </Card>

      <Text className="mb-2 mt-7 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('editor.exercises')}
      </Text>
      {slots.length === 0 ? (
        <Card className="items-center py-6">
          <Text className="text-sm text-ink-400">{t('editor.noExercises')}</Text>
        </Card>
      ) : (
        <View className="gap-2">
          {slots.map(({ slot, exercise }, i) => (
            <Card key={slot.id} className="flex-row items-center">
              <View className="mr-1">
                <Pressable
                  onPress={() => moveSlot(slot.id, -1)}
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
                  onPress={() => moveSlot(slot.id, 1)}
                  disabled={i === slots.length - 1}
                  hitSlop={4}
                  className={i === slots.length - 1 ? 'opacity-25' : ''}
                >
                  <ChevronDownIcon color="#a1a1aa" size={16} />
                </Pressable>
              </View>
              <PressableScale
                onPress={() =>
                  router.push({ pathname: '/training/edit/slot/[id]', params: { id: slot.id } })
                }
                className="flex-1 flex-row items-center"
              >
                <View className="ml-2 flex-1">
                  <Text className="text-base font-sans-semibold text-ink-50">{exercise.name}</Text>
                  {slot.badges?.length ? (
                    <Text className="mt-0.5 text-xs text-ink-400" numberOfLines={1}>
                      {slot.badges.join(' · ')}
                    </Text>
                  ) : null}
                </View>
                <ChevronRightIcon color="#71717a" />
              </PressableScale>
              <Pressable onPress={() => confirmDeleteSlot(slot.id)} hitSlop={8} className="ml-2">
                <TrashIcon color="#ef4444" size={18} />
              </Pressable>
            </Card>
          ))}
        </View>
      )}

      <Pressable
        onPress={() =>
          router.push({ pathname: '/training/edit/exercise-picker', params: { dayId: id } })
        }
        accessibilityRole="button"
        className="mt-3 flex-row items-center justify-center rounded-field border border-brand/30 bg-brand/10 py-3"
      >
        <PlusIcon color={brand} size={18} />
        <Text className="ml-1.5 text-sm font-sans-semibold text-brand">
          {t('editor.addExercise')}
        </Text>
      </Pressable>
    </Screen>
  );
};

export default EditDay;
