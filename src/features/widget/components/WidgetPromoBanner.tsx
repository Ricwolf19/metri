import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { requestPinWidget } from 'react-native-android-widget';

import { SmartphoneIcon, XIcon } from '@/components/icons';
import { Button, FadeInUp } from '@/components/ui';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

import { useWidgetInstalled } from '../useWidgetInstalled';

/** Pitches the Android widget with a one-tap pin. Shows only when the widget is known absent
 * (`useWidgetInstalled` re-polls on foreground, so a pin hides it). Dismiss snoozes 14 days — it returns on purpose. */
export const WidgetPromoBanner = () => {
  const t = useT();
  const { brand } = useTheme();
  const installed = useWidgetInstalled();
  // Snooze check once per mount (initializer) keeps render pure.
  const [hidden, setHidden] = useState(() => Date.now() < settings.getWidgetPromoSnoozedUntil());
  const [pinUnsupported, setPinUnsupported] = useState(false);

  if (installed !== false || hidden) return null;

  const snooze = () => {
    settings.snoozeWidgetPromo();
    setHidden(true);
  };

  const onPin = async () => {
    // False = platform/launcher can't pin programmatically; fall back to the
    // long-press instructions instead of a dead button.
    const accepted = await requestPinWidget({ widgetName: 'Metri' }).catch(() => false);
    if (!accepted) setPinUnsupported(true);
  };

  return (
    <FadeInUp delay={90}>
      <View className="mt-4 rounded-card border border-brand/30 bg-brand/10 p-4">
        <View className="flex-row items-center">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-field bg-brand/15">
            <SmartphoneIcon color={brand} size={22} />
          </View>
          <View className="flex-1 pr-2">
            <Text className="text-sm font-sans-semibold text-ink-50">
              {t('home.widgetPromoTitle')}
            </Text>
            <Text className="mt-0.5 text-xs text-ink-400">
              {t(pinUnsupported ? 'home.widgetPromoManual' : 'home.widgetPromoBody')}
            </Text>
          </View>
          <Pressable
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
            onPress={snooze}
          >
            <XIcon color="#71717a" size={18} />
          </Pressable>
        </View>
        {pinUnsupported ? null : (
          <View className="mt-3">
            <Button variant="brand" label={t('home.widgetPromoAdd')} size="sm" onPress={onPin} />
          </View>
        )}
      </View>
    </FadeInUp>
  );
};
