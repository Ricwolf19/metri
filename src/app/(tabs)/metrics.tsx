import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { GearIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { FadeInUp, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { visibleSections } from '@/features/metrics/sections';
import { useMetricsLayout } from '@/features/metrics/useMetricsLayout';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

/**
 * Metrics — everything about *over time*, in the order the user chose.
 *
 * The screen owns no content: it renders the sections from the registry, so
 * reordering or hiding one is a preference change rather than a code change.
 * Home stays about *today*.
 */
const Metrics = () => {
  const t = useT();
  const router = useRouter();
  const { user } = useAuth();
  const { muted } = useTheme();
  const sections = visibleSections(useMetricsLayout());

  if (!user) return null;

  const customize = (
    <Pressable
      hitSlop={8}
      onPress={() => router.push('/metrics-customize')}
      accessibilityRole="button"
      accessibilityLabel={t('metrics.customize')}
      className="flex-row items-center"
    >
      <GearIcon color={muted} size={14} />
      <Text className="ml-1 text-xs font-sans-semibold text-ink-400">{t('metrics.customize')}</Text>
    </Pressable>
  );

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-32"
      header={<TopBar menu showFaq showBeta />}
    >
      {sections.map(({ id, Component }, i) => (
        <FadeInUp key={id} delay={Math.min(i * 50, 150)}>
          <View className={i > 0 ? 'mt-7' : ''}>
            {/* The control rides the first section's title line rather than
                taking a row of its own under the header pill. */}
            <Component headerRight={i === 0 ? customize : undefined} />
          </View>
        </FadeInUp>
      ))}
    </Screen>
  );
};

export default Metrics;
