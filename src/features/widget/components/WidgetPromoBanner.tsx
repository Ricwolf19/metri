import { useState } from 'react';
import { requestPinWidget } from 'react-native-android-widget';

import { SmartphoneIcon } from '@/components/icons';
import { PromoBanner } from '@/components/ui';
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
    <PromoBanner
      icon={<SmartphoneIcon color={brand} size={22} />}
      title={t('home.widgetPromoTitle')}
      body={t(pinUnsupported ? 'home.widgetPromoManual' : 'home.widgetPromoBody')}
      ctaLabel={pinUnsupported ? undefined : t('home.widgetPromoAdd')}
      onPress={() => void onPin()}
      onDismiss={snooze}
      dismissLabel={t('common.cancel')}
    />
  );
};
