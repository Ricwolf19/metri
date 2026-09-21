import { useState } from 'react';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Card, Screen, SectionLabel, Switch } from '@/components/ui';
import { MEASUREMENT_SITES, PRO_SITES, siteHintKey, siteLabelKey } from '@/features/body/sites';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';

/** Which optional tape sites the check-in asks for. The core set is always on. */
const BodySites = () => {
  const t = useT();
  const [enabled, setEnabled] = useState(() => settings.getEnabledProSites());

  const toggle = (id: string, on: boolean) => {
    const next = on ? [...enabled, id] : enabled.filter((x) => x !== id);
    setEnabled(next);
    settings.setEnabledProSites(next);
  };

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-10"
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={t('body.sitesTitle')}
          subtitle={t('body.sitesSubtitle')}
        />
      }
    >
      <SectionLabel label={t('body.sitesCore')} hint={t('body.sitesCoreHint')} className="mt-2" />
      <Card>
        <Text className="text-sm leading-6 text-ink-300">
          {MEASUREMENT_SITES.filter((s) => s.set === 'core')
            .map((s) => t(siteLabelKey(s.id)))
            .join(' · ')}
        </Text>
      </Card>

      <SectionLabel label={t('body.sitesPro')} hint={t('body.sitesProHint')} />
      <Card className="gap-5">
        {PRO_SITES.map((site) => (
          <View key={site.id} className="flex-row items-center gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-base font-sans-semibold text-ink-50">
                {t(siteLabelKey(site.id))}
              </Text>
              <Text className="mt-0.5 text-xs leading-5 text-ink-400">
                {site.id === 'neck' ? t('body.neckUnlocks') : t(siteHintKey(site.id))}
              </Text>
            </View>
            <Switch
              value={enabled.includes(site.id)}
              onValueChange={(on) => toggle(site.id, on)}
              accessibilityLabel={t(siteLabelKey(site.id))}
            />
          </View>
        ))}
      </Card>
    </Screen>
  );
};

export default BodySites;
