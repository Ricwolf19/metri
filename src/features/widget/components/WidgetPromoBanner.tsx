import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { SmartphoneIcon, XIcon } from '@/components/icons';
import { FadeInUp } from '@/components/ui';
import { useT } from '@/i18n';
import { storage } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

import { useWidgetInstalled } from '../useWidgetInstalled';

const DISMISSED_KEY = 'widget.promoDismissed';

/**
 * Home banner pitching the (in-development) Android home-screen widget. Shows
 * only when we positively know the widget is absent; the library exposes no
 * programmatic pin request, so the copy walks the user through adding it.
 * Dismissal is permanent (MMKV).
 */
export const WidgetPromoBanner = () => {
  const t = useT();
  const { brand } = useTheme();
  const installed = useWidgetInstalled();
  const [dismissed, setDismissed] = useState(() => storage.getBoolean(DISMISSED_KEY) ?? false);

  if (installed !== false || dismissed) return null;

  return (
    <FadeInUp delay={90}>
      <View className="mt-4 flex-row items-center rounded-card border border-brand/30 bg-brand/10 p-4">
        <View className="mr-3 h-11 w-11 items-center justify-center rounded-field bg-brand/15">
          <SmartphoneIcon color={brand} size={22} />
        </View>
        <View className="flex-1 pr-2">
          <Text className="text-sm font-sans-semibold text-ink-50">
            {t('home.widgetPromoTitle')}
          </Text>
          <Text className="mt-0.5 text-xs text-ink-400">{t('home.widgetPromoBody')}</Text>
        </View>
        <Pressable
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
          onPress={() => {
            storage.set(DISMISSED_KEY, true);
            setDismissed(true);
          }}
        >
          <XIcon color="#71717a" size={18} />
        </Pressable>
      </View>
    </FadeInUp>
  );
};
