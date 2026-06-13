import { useRouter, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon, FlameIcon, type IconProps } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Card, Screen } from '@/components/ui';
import type { TranslationKey } from '@/i18n/en';
import { useT } from '@/i18n';

type Tool = {
  titleKey: TranslationKey;
  descKey: TranslationKey;
  href: Href;
  icon: (p: IconProps) => React.ReactElement;
  available: boolean;
};

const TOOLS: Tool[] = [
  {
    titleKey: 'tools.hbTitle',
    descKey: 'tools.hbDesc',
    href: '/calculators/bmr',
    icon: FlameIcon,
    available: true,
  },
];

const Tools = () => {
  const router = useRouter();
  const t = useT();

  return (
    <Screen scroll edges={['top']} contentClassName="px-5 pb-8">
      <TopBar title={t('tools.title')} subtitle={t('tools.subtitle')} />

      <View className="gap-3">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Pressable
              key={tool.titleKey}
              disabled={!tool.available}
              onPress={() => router.push(tool.href)}
              className={tool.available ? '' : 'opacity-50'}
            >
              <Card className="flex-row items-center">
                <View className="mr-4 h-11 w-11 items-center justify-center rounded-xl bg-ink-700">
                  <Icon color="#bef82b" size={22} />
                </View>
                <View className="flex-1 pr-2">
                  <Text className="text-base font-semibold text-ink-50">{t(tool.titleKey)}</Text>
                  <Text className="mt-0.5 text-sm text-ink-400">{t(tool.descKey)}</Text>
                </View>
                <ChevronRightIcon color="#566077" />
              </Card>
            </Pressable>
          );
        })}
      </View>

      <Text className="mt-6 text-center text-xs text-ink-500">{t('tools.comingSoon')}</Text>
    </Screen>
  );
};

export default Tools;
