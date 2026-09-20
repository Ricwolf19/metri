import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { PlusIcon, TrashIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Button, HoldButton, Screen, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { addSlot, getDay, getSlot, setSlotAlternatives } from '@/features/training/authoring.repo';
import { ExerciseList } from '@/features/training/components/ExerciseList';
import { NewExerciseForm } from '@/features/training/components/NewExerciseForm';
import { deleteCustomExercise } from '@/features/training/exercises.repo';
import { dayDisplayName } from '@/features/training/labels';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const ExercisePicker = () => {
  const { dayId, altFor } = useLocalSearchParams<{ dayId: string; altFor?: string }>();
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const { user } = useAuth();
  const { brand } = useTheme();

  const day = typeof dayId === 'string' ? getDay(dayId) : null;
  const [creating, setCreating] = useState(false);

  if (!user || !day || typeof dayId !== 'string') return <Redirect href="/training" />;

  // A new slot goes straight into its editor (replace: back lands on the
  // split, and leaving without saving deletes the fresh slot again).
  const openFresh = (exerciseId: string) => {
    const slot = addSlot(dayId, day.userProgramId, exerciseId);
    router.replace({ pathname: '/training/edit/slot/[id]', params: { id: slot.id, fresh: '1' } });
  };

  const pick = (exerciseId: string) => {
    if (typeof altFor === 'string') {
      // Alternative mode: append to the slot's interchangeable list.
      const target = getSlot(altFor);
      const current = target?.alternativeExerciseIds ?? [];
      if (!current.includes(exerciseId)) setSlotAlternatives(altFor, [...current, exerciseId]);
      router.back();
      return;
    }
    openFresh(exerciseId);
  };

  const removeExercise = (exerciseId: string) => {
    if (!deleteCustomExercise(exerciseId, user.id)) toast.error(t('editor.inUse'));
    else toast.info(t('editor.deletedToast'));
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
          title={t('editor.pickExercise')}
          subtitle={dayDisplayName(day, t)}
        />
      }
    >
      {creating ? (
        <NewExerciseForm
          userId={user.id}
          submitLabel={t('editor.addExercise')}
          onCancel={() => setCreating(false)}
          onCreated={(ex) => pick(ex.id)}
        />
      ) : (
        <ExerciseList
          userId={user.id}
          onPick={(e) => pick(e.id)}
          showDoc
          rowIcon={<PlusIcon color={brand} size={20} />}
          above={
            <View className="mt-4">
              <Button
                variant="brandSoft"
                label={t('editor.newExercise')}
                leftIcon={<PlusIcon color={brand} size={18} />}
                onPress={() => setCreating(true)}
              />
            </View>
          }
          trailing={(e) =>
            e.isCustom && e.userId === user.id ? (
              <View className="mr-3">
                <HoldButton
                  icon={<TrashIcon color="#ef4444" size={16} />}
                  accessibilityLabel={t('editor.deleteExercise')}
                  onComplete={() => removeExercise(e.id)}
                />
              </View>
            ) : null
          }
        />
      )}
    </Screen>
  );
};

export default ExercisePicker;
