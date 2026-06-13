import { useRouter, type Href } from 'expo-router';
import type { ComponentType } from 'react';
import { Text, View } from 'react-native';

import { ActivityIcon, ChevronRightIcon, FlameIcon, type IconProps } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Card, FadeInUp, PressableScale, Screen } from '@/components/ui';
import type { TranslationKey } from '@/i18n/en';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

type Tool = {
  titleKey: TranslationKey;
  descKey: TranslationKey;
  href: Href;
  icon: ComponentType<IconProps>;
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
  {
    titleKey: 'tools.macrosTitle',
    descKey: 'tools.macrosDesc',
    href: '/calculators/macros',
    icon: FlameIcon,
    available: true,
  },
  {
    titleKey: 'tools.onermTitle',
    descKey: 'tools.onermDesc',
    href: '/calculators/one-rep-max',
    icon: ActivityIcon,
    available: true,
  },
  {
    titleKey: 'tools.bodyfatTitle',
    descKey: 'tools.bodyfatDesc',
    href: '/calculators/body-fat',
    icon: FlameIcon,
    available: true,
  },
  {
    titleKey: 'tools.waterTitle',
    descKey: 'tools.waterDesc',
    href: '/calculators/water',
    icon: ActivityIcon,
    available: true,
  },
  {
    titleKey: 'tools.idealTitle',
    descKey: 'tools.idealDesc',
    href: '/calculators/ideal-weight',
    icon: FlameIcon,
    available: true,
  },
  {
    titleKey: 'tools.ffmiTitle',
    descKey: 'tools.ffmiDesc',
    href: '/calculators/ffmi',
    icon: ActivityIcon,
    available: true,
  },
];

const Tools = () => {
  const router = useRouter();
  const t = useT();
  const { accent } = useTheme();

  return (
    <Screen scroll edges={['top']} contentClassName="px-5 pb-8">
      <TopBar title={t('tools.title')} subtitle={t('tools.subtitle')} />

      <View className="gap-3">
        {TOOLS.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <FadeInUp key={tool.titleKey} delay={i * 70}>
              <PressableScale
                disabled={!tool.available}
                onPress={() => router.push(tool.href)}
                className={tool.available ? '' : 'opacity-50'}
              >
                <Card className="flex-row items-center">
                  <View className="mr-4 h-11 w-11 items-center justify-center rounded-xl bg-lime-400/15">
                    <Icon color={accent} size={22} />
                  </View>
                  <View className="flex-1 pr-2">
                    <Text className="text-base font-semibold text-ink-50">{t(tool.titleKey)}</Text>
                    <Text className="mt-0.5 text-sm text-ink-400">{t(tool.descKey)}</Text>
                  </View>
                  <ChevronRightIcon color="#566077" />
                </Card>
              </PressableScale>
            </FadeInUp>
          );
        })}
      </View>

      <Text className="mt-6 text-center text-xs text-ink-500">{t('tools.comingSoon')}</Text>
    </Screen>
  );
};

export default Tools;
