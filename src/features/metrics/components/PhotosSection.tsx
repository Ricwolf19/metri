import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { CameraIcon, ChevronRightIcon } from '@/components/icons';
import { Card, PressableScale } from '@/components/ui';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import type { MetricsSectionProps } from '../sections';

/** Entry to the photo timeline — the one metric a number cannot carry. */
export const PhotosSection = ({ headerRight }: MetricsSectionProps) => {
  const router = useRouter();
  const t = useT();
  const { brand, muted } = useTheme();

  return (
    <>
      {headerRight ? <View className="mb-2 flex-row justify-end">{headerRight}</View> : null}
      <PressableScale onPress={() => router.push('/progress')}>
        <Card className="flex-row items-center">
          <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-brand/15">
            <CameraIcon color={brand} size={22} />
          </View>
          <View className="min-w-0 flex-1 pr-2">
            <Text className="text-base font-sans-semibold text-ink-50" numberOfLines={1}>
              {t('home.progress')}
            </Text>
            <Text className="mt-0.5 text-sm text-ink-400" numberOfLines={2}>
              {t('home.progressSub')}
            </Text>
          </View>
          <ChevronRightIcon color={muted} />
        </Card>
      </PressableScale>
    </>
  );
};
