import { Pressable, Text, View } from 'react-native';

import { XIcon } from '@/components/icons';
import { useTheme } from '@/theme/theme-context';

import { Button } from './Button';
import { FadeInUp } from './FadeInUp';

type Props = {
  icon: React.ReactNode;
  title: string;
  body: string;
  /** Omit to render a text-only banner (e.g. after a CTA proved unavailable). */
  ctaLabel?: string;
  onPress?: () => void;
  onDismiss: () => void;
  dismissLabel: string;
};

/** Brand-tinted promo card with an icon, copy, an optional CTA and a dismiss cross (Home banners). */
export const PromoBanner = ({
  icon,
  title,
  body,
  ctaLabel,
  onPress,
  onDismiss,
  dismissLabel,
}: Props) => {
  const { muted } = useTheme();
  return (
    <FadeInUp delay={90}>
      <View className="mt-4 rounded-card border border-brand/30 bg-brand/10 p-4">
        <View className="flex-row items-center">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-field bg-brand/15">
            {icon}
          </View>
          <View className="flex-1 pr-2">
            <Text className="text-sm font-sans-semibold text-ink-50">{title}</Text>
            <Text className="mt-0.5 text-xs leading-4 text-ink-400">{body}</Text>
          </View>
          <Pressable
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={dismissLabel}
            onPress={onDismiss}
          >
            <XIcon color={muted} size={18} />
          </Pressable>
        </View>
        {ctaLabel && onPress ? (
          <View className="mt-3">
            <Button variant="brand" label={ctaLabel} size="sm" onPress={onPress} />
          </View>
        ) : null}
      </View>
    </FadeInUp>
  );
};
