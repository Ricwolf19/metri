import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { BookIcon, ChevronRightIcon } from '@/components/icons';
import { Card, PressableScale } from '@/components/ui';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { AREA_KEY, QUIZ_AREAS, QUIZ_MAX_LEVEL } from './areas';
import { loadScores, type QuizScores } from './scores';

/** Explore's entry to the knowledge check: an invitation, or the last result. */
export const QuizCard = () => {
  const t = useT();
  const router = useRouter();
  const { brand, brandContrast } = useTheme();
  const [scores, setScores] = useState<QuizScores | null>(() => loadScores());
  // Re-read on focus: finishing the quiz pops back here.
  useFocusEffect(useCallback(() => setScores(loadScores()), []));

  return (
    <PressableScale onPress={() => router.push('/quiz')} className="mt-5">
      <Card className="flex-row items-center">
        <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-brand">
          <BookIcon color={brandContrast} size={20} />
        </View>
        <View className="flex-1 pr-2">
          <Text className="text-base font-sans-semibold text-ink-50">{t('quiz.cardTitle')}</Text>
          <Text className="mt-0.5 text-sm text-ink-400" numberOfLines={2}>
            {scores
              ? QUIZ_AREAS.map((a) => `${t(AREA_KEY[a])} ${scores[a]}/${QUIZ_MAX_LEVEL}`).join(
                  ' · ',
                )
              : t('quiz.cardBody')}
          </Text>
        </View>
        <ChevronRightIcon color={brand} />
      </Card>
    </PressableScale>
  );
};
