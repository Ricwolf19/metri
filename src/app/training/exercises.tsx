import { Redirect, useRouter } from 'expo-router';

import { ChevronRightIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { ExerciseList } from '@/features/training/components/ExerciseList';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

/** Read-only exercise library: every catalog + custom movement → technique cues and history. */
const ExerciseLibrary = () => {
  const router = useRouter();
  const t = useT();
  const { user } = useAuth();
  const { muted } = useTheme();

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
      <ExerciseList
        userId={user.id}
        onPick={(e) => router.push({ pathname: '/training/exercise/[id]', params: { id: e.id } })}
        rowIcon={<ChevronRightIcon color={muted} size={18} />}
      />
    </Screen>
  );
};

export default ExerciseLibrary;
