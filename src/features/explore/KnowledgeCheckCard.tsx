import { Text, View } from 'react-native';

import { BookIcon, ExternalLinkIcon } from '@/components/icons';
import { Card, PressableScale } from '@/components/ui';
import { quizUrl } from '@/features/beta/links';
import { useI18n, useT } from '@/i18n';
import { openExternal } from '@/lib/open-external';
import { useTheme } from '@/theme/theme-context';

/**
 * Explore's entry to the knowledge check, which lives on metri.info: the app
 * only opens the page in the browser (the in-app quiz was removed on
 * 2026-10-20 — one place to keep the questions current).
 */
export const KnowledgeCheckCard = () => {
  const t = useT();
  const { locale } = useI18n();
  const { brand, brandContrast } = useTheme();
  return (
    <PressableScale onPress={() => openExternal(quizUrl(locale))} className="mt-5">
      <Card className="flex-row items-center">
        <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-brand">
          <BookIcon color={brandContrast} size={20} />
        </View>
        <View className="flex-1 pr-2">
          <Text className="text-base font-sans-semibold text-ink-50">{t('quiz.cardTitle')}</Text>
          <Text className="mt-0.5 text-sm text-ink-400" numberOfLines={2}>
            {t('quiz.cardBody')}
          </Text>
          <Text className="mt-1 text-xs text-ink-500">{t('quiz.cardWeb')}</Text>
        </View>
        <ExternalLinkIcon color={brand} size={18} />
      </Card>
    </PressableScale>
  );
};
