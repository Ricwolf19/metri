import { useRouter, type Href } from 'expo-router';
import type { ComponentType } from 'react';
import { Text, View } from 'react-native';

import { BellIcon, ChevronRightIcon, DumbbellIcon, type IconProps } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Card, FadeInUp, PressableScale, Screen } from '@/components/ui';
import { CALC_CONTENT } from '@/features/calculators/content';
import { CALC_META } from '@/features/calculators/registry';
import type { TranslationKey } from '@/i18n/en';
import { useI18n, useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

type Tool = {
  title: string;
  desc: string;
  href: Href;
  icon: ComponentType<IconProps>;
};

const ToolRow = ({ tool, brand }: { tool: Tool; brand: string }) => {
  const router = useRouter();
  const Icon = tool.icon;
  return (
    <PressableScale onPress={() => router.push(tool.href)}>
      <Card className="flex-row items-center">
        <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-brand/10">
          <Icon color={brand} size={22} />
        </View>
        <View className="flex-1 pr-2">
          <Text className="text-base font-sans-semibold text-ink-50">{tool.title}</Text>
          <Text className="mt-0.5 text-sm text-ink-400" numberOfLines={1}>
            {tool.desc}
          </Text>
        </View>
        <ChevronRightIcon color="#71717a" />
      </Card>
    </PressableScale>
  );
};

const SectionLabel = ({ label }: { label: string }) => (
  <Text className="mb-2 mt-6 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
    {label}
  </Text>
);

const Tools = () => {
  const t = useT();
  const { locale } = useI18n();
  const { brand } = useTheme();

  const featured: { key: TranslationKey; tool: Tool }[] = [
    {
      key: 'tools.trainingTitle',
      tool: {
        title: t('tools.trainingTitle'),
        desc: t('tools.trainingDesc'),
        href: '/training',
        icon: DumbbellIcon,
      },
    },
    {
      key: 'tab.reminders',
      tool: {
        title: t('tab.reminders'),
        desc: t('rem.subtitle'),
        href: '/(tabs)/reminders',
        icon: BellIcon,
      },
    },
  ];

  return (
    <Screen scroll edges={['top']} contentClassName="px-5 pb-8">
      <TopBar title={t('tools.title')} subtitle={t('tools.subtitle')} />

      <View className="gap-3">
        {featured.map((f, i) => (
          <FadeInUp key={f.key} delay={i * 60}>
            <ToolRow tool={f.tool} brand={brand} />
          </FadeInUp>
        ))}
      </View>

      <SectionLabel label={t('tools.calculators')} />
      <View className="gap-3">
        {CALC_META.map((meta, i) => {
          const content = CALC_CONTENT[meta.id][locale];
          return (
            <FadeInUp key={meta.id} delay={Math.min(i, 8) * 50}>
              <ToolRow
                tool={{
                  title: content.h1,
                  desc: content.tagline,
                  href: `/calculators/${meta.id}`,
                  icon: meta.icon,
                }}
                brand={brand}
              />
            </FadeInUp>
          );
        })}
      </View>
    </Screen>
  );
};

export default Tools;
