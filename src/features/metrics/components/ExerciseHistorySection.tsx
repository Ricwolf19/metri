import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { Card, EmptyState, PressableScale, SectionLabel } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { loggedExercises } from '@/features/training/stats.repo';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import type { MetricsSectionProps } from '../sections';

const MAX_ROWS = 6;

/** Most recently trained movements, each opening its own history. */
export const ExerciseHistorySection = ({ headerRight }: MetricsSectionProps) => {
  const router = useRouter();
  const t = useT();
  const { user } = useAuth();
  const { muted } = useTheme();
  const rows = user ? loggedExercises(user.id).slice(0, MAX_ROWS) : [];

  return (
    <>
      <SectionLabel label={t('metrics.exHistory')} right={headerRight} className="mt-0" />
      {rows.length ? (
        <Card className="gap-0 py-1">
          {rows.map((e, i) => (
            <PressableScale
              key={e.exerciseId}
              onPress={() =>
                router.push({
                  pathname: '/training/exercise/[id]',
                  params: { id: e.exerciseId, view: 'history' },
                })
              }
              className={[
                'flex-row items-center py-3',
                i > 0 ? 'border-t border-ink-800' : '',
              ].join(' ')}
            >
              <Text
                className="min-w-0 flex-1 pr-2 text-sm font-sans-medium text-ink-100"
                numberOfLines={1}
              >
                {e.name}
              </Text>
              <Text className="mr-2 shrink-0 text-xs text-ink-400">
                {t('metrics.exSessions', { n: e.sessions })}
              </Text>
              <ChevronRightIcon color={muted} size={16} />
            </PressableScale>
          ))}
        </Card>
      ) : (
        <EmptyState hint={t('metrics.exEmpty')} />
      )}
    </>
  );
};
