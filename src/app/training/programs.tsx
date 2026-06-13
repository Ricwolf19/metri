import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ChevronRightIcon, DumbbellIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Card, FadeInUp, PressableScale, Screen } from '@/components/ui';
import { DIFFICULTY_KEY, GOAL_KEY } from '@/features/training/labels';
import { programTemplatesQuery } from '@/features/training/programs.repo';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const Tag = ({ label }: { label: string }) => (
  <View className="rounded-full bg-ink-700 px-2.5 py-0.5">
    <Text className="text-xs font-medium text-ink-200">{label}</Text>
  </View>
);

const Programs = () => {
  const router = useRouter();
  const t = useT();
  const { accent } = useTheme();
  const { data: programs } = useLiveQuery(programTemplatesQuery());

  return (
    <Screen scroll contentClassName="px-5 pb-10">
      <TopBar title={t('training.programsTitle')} subtitle={t('training.subtitle')} showBack />

      <View className="gap-3">
        {programs.map((p, i) => (
          <FadeInUp key={p.id} delay={i * 70}>
            <PressableScale
              onPress={() =>
                router.push({ pathname: '/training/program/[id]', params: { id: p.id } })
              }
            >
              <Card>
                <View className="flex-row items-center">
                  <View className="mr-4 h-11 w-11 items-center justify-center rounded-xl bg-lime-400/15">
                    <DumbbellIcon color={accent} size={22} />
                  </View>
                  <View className="flex-1 pr-2">
                    <Text className="text-base font-semibold text-ink-50">{p.name}</Text>
                    {p.durationWeeks ? (
                      <Text className="mt-0.5 text-sm text-ink-400">
                        {t('training.weeks', { count: p.durationWeeks })}
                      </Text>
                    ) : null}
                  </View>
                  <ChevronRightIcon color="#566077" />
                </View>

                {p.description ? (
                  <Text className="mt-3 text-sm leading-5 text-ink-300">{p.description}</Text>
                ) : null}

                <View className="mt-3 flex-row flex-wrap gap-2">
                  {p.goal ? <Tag label={t(GOAL_KEY[p.goal])} /> : null}
                  {p.difficulty ? <Tag label={t(DIFFICULTY_KEY[p.difficulty])} /> : null}
                </View>
              </Card>
            </PressableScale>
          </FadeInUp>
        ))}
      </View>
    </Screen>
  );
};

export default Programs;
