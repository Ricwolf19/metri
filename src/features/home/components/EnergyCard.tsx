import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ChevronRightIcon, FlameIcon } from '@/components/icons';
import { Card, PressableScale, Stat } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

/**
 * Basal and total daily energy, first on Home: the number that frames every
 * other decision, and the one worth seeing without scrolling. Carries its own
 * heading — it is a card, not a section, so nothing repeats the title above it.
 */
export const EnergyCard = () => {
  const t = useT();
  const router = useRouter();
  const { user } = useAuth();
  const { brand } = useTheme();

  if (!user) return null;

  // Destructured so the guard narrows both fields; a combined boolean would
  // narrow nothing and force non-null assertions below.
  const { bmr, tdee } = user;
  if (bmr == null || tdee == null) {
    return (
      <Card>
        <Text className="text-base font-sans-semibold text-ink-50">{t('home.noMetrics')}</Text>
        <Text className="mt-1 text-sm text-ink-400">{t('home.noMetricsBody')}</Text>
        <PressableScale
          onPress={() => router.push('/calculators/tdee')}
          className="mt-4 flex-row items-center justify-between rounded-field border border-brand/30 bg-brand/10 px-4 py-3"
        >
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={CONTROL_FONT_SCALE}
            className="min-w-0 flex-1 pr-2 font-sans-semibold text-brand"
          >
            {t('home.openBmr')}
          </Text>
          <ChevronRightIcon color={brand} size={18} />
        </PressableScale>
      </Card>
    );
  }

  return (
    <Card>
      <View className="mb-4 flex-row items-center">
        <FlameIcon color={brand} size={18} />
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={CONTROL_FONT_SCALE}
          className="ml-2 min-w-0 flex-1 font-mono-medium text-xs uppercase tracking-wider text-brand"
        >
          {t('home.energy')}
        </Text>
      </View>
      <View className="flex-row">
        <Stat label={t('home.bmr')} value={String(Math.round(bmr))} unit={t('home.kcalDay')} />
        <Stat label={t('home.tdee')} value={String(Math.round(tdee))} unit={t('home.kcalDay')} />
      </View>
      <Text className="mt-4 text-xs text-ink-400">
        {user.activityLevel ? t(`activity.${user.activityLevel}`) : ''} ·{' '}
        {user.bmrFormula === 'mifflin_st_jeor' ? 'Mifflin–St Jeor' : 'Harris–Benedict'}
      </Text>
    </Card>
  );
};
