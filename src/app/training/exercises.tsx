import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ChevronRightIcon, PlusIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Button, Screen, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { ExerciseList } from '@/features/training/components/ExerciseList';
import { NewExerciseForm } from '@/features/training/components/NewExerciseForm';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

/** Exercise library: every catalog + custom movement → technique cues and history. */
const ExerciseLibrary = () => {
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const { user } = useAuth();
  const { brand, muted } = useTheme();
  const [creating, setCreating] = useState(false);

  if (!user) return <Redirect href="/" />;

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-10"
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={t('exercise.library')}
          subtitle={t('exercise.librarySub')}
        />
      }
    >
      {creating ? (
        <NewExerciseForm
          userId={user.id}
          submitLabel={t('editor.addExercise')}
          onCancel={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            toast.success(t('editor.savedToast'));
          }}
        />
      ) : (
        <ExerciseList
          userId={user.id}
          onPick={(e) => router.push({ pathname: '/training/exercise/[id]', params: { id: e.id } })}
          rowIcon={<ChevronRightIcon color={muted} size={18} />}
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
        />
      )}
    </Screen>
  );
};

export default ExerciseLibrary;
