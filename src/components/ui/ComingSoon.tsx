import type { ComponentType } from 'react';
import { Text, View } from 'react-native';

import type { IconProps } from '@/components/icons';
import { useT } from '@/i18n';

import { FadeInUp } from './FadeInUp';
import { useTheme } from '@/theme/theme-context';

/**
 * Reusable "under construction" surface for sections announced before they
 * ship: icon, pitch, and a badge that manages expectations. Keeps upcoming
 * features visible in the IA without faking functionality.
 */
export const ComingSoon = ({
  Icon,
  title,
  body,
}: {
  Icon: ComponentType<IconProps>;
  title: string;
  body: string;
}) => {
  const t = useT();
  const { brand } = useTheme();
  return (
    <View className="flex-1 items-center justify-center px-8 pb-24">
      <FadeInUp className="items-center">
        <View className="h-16 w-16 items-center justify-center rounded-card bg-brand/10">
          <Icon color={brand} size={30} />
        </View>
      </FadeInUp>
      <FadeInUp delay={40} className="items-center">
        <View className="mt-4 rounded-full border border-brand/40 px-3 py-1">
          <Text className="font-mono-medium text-[11px] uppercase tracking-wider text-brand">
            {t('comingSoon.badge')}
          </Text>
        </View>
      </FadeInUp>
      <FadeInUp delay={80} className="items-center">
        <Text className="mt-4 text-center text-xl font-sans-bold text-ink-50">{title}</Text>
        <Text className="mt-2 text-center text-sm leading-6 text-ink-300">{body}</Text>
      </FadeInUp>
    </View>
  );
};
