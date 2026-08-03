import { useState } from 'react';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Card, Screen, ScreenTitle, Switch } from '@/components/ui';
import { DEFAULT_PINNED_ACTIONS, QUICK_ACTIONS } from '@/features/home/quick-actions';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

const HomeCustomize = () => {
  const t = useT();
  const { brand } = useTheme();
  const [pinned, setPinned] = useState<string[]>(
    () => settings.getPinnedActions() ?? DEFAULT_PINNED_ACTIONS,
  );

  const toggle = (id: string) => {
    // Keep the persisted order aligned with the registry so Home renders predictably.
    const next = pinned.includes(id)
      ? pinned.filter((p) => p !== id)
      : QUICK_ACTIONS.filter((a) => a.id === id || pinned.includes(a.id)).map((a) => a.id);
    setPinned(next);
    settings.setPinnedActions(next);
  };

  return (
    <Screen scroll contentClassName="px-5 pb-10" header={<TopBar showBack showAvatar={false} />}>
      <ScreenTitle title={t('home.customizeTitle')} subtitle={t('home.customizeSub')} />

      <View className="mt-1 gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          const on = pinned.includes(action.id);
          return (
            <Card key={action.id} className="flex-row items-center">
              <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-brand/10">
                <Icon color={brand} size={22} />
              </View>
              <View className="flex-1 pr-2">
                <Text className="text-base font-sans-semibold text-ink-50">
                  {t(action.titleKey)}
                </Text>
                <Text className="mt-0.5 text-sm text-ink-400">{t(action.subKey)}</Text>
              </View>
              <Switch value={on} onValueChange={() => toggle(action.id)} />
            </Card>
          );
        })}
      </View>
    </Screen>
  );
};

export default HomeCustomize;
