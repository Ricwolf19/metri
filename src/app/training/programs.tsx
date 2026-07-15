import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon, DumbbellIcon, EditPencilIcon, PlusIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Card, FadeInUp, PressableScale, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { DIFFICULTY_KEY, GOAL_KEY } from '@/features/training/labels';
import { programTemplatesQuery } from '@/features/training/programs.repo';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const Tag = ({ label }: { label: string }) => (
  <View className="rounded-full bg-ink-700 px-2.5 py-0.5">
    <Text className="text-xs font-sans-medium text-ink-200">{label}</Text>
  </View>
);

const Programs = () => {
  const router = useRouter();
  const t = useT();
  const { brand } = useTheme();
  const { user } = useAuth();
  const { data: programs } = useLiveQuery(programTemplatesQuery());

  return (
    <Screen scroll contentClassName="px-5 pb-10">
      <TopBar title={t('training.programsTitle')} subtitle={t('training.subtitle')} showBack />

      <PressableScale onPress={() => router.push('/training/edit/new')} className="mb-3">
        <Card className="flex-row items-center border-brand/30 bg-brand/10">
          <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-brand/15">
            <PlusIcon color={brand} size={22} />
          </View>
          <View className="flex-1 pr-2">
            <Text className="text-base font-sans-semibold text-ink-50">
              {t('editor.createOwn')}
            </Text>
            <Text className="mt-0.5 text-sm text-ink-400">{t('editor.createOwnSub')}</Text>
          </View>
          <ChevronRightIcon color={brand} />
        </Card>
      </PressableScale>

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
                  <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-brand/10">
                    <DumbbellIcon color={brand} size={22} />
                  </View>
                  <View className="flex-1 pr-2">
                    <Text className="text-base font-sans-semibold text-ink-50">{p.name}</Text>
                    {p.durationWeeks ? (
                      <Text className="mt-0.5 text-sm text-ink-400">
                        {t('training.weeks', { count: p.durationWeeks })}
                      </Text>
                    ) : null}
                  </View>
                  {p.isCustom && p.userId === user?.id ? (
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/training/edit/program/[id]',
                          params: { id: p.id },
                        })
                      }
                      hitSlop={8}
                      className="mr-3"
                    >
                      <EditPencilIcon color="#a1a1aa" size={18} />
                    </Pressable>
                  ) : null}
                  <ChevronRightIcon color="#71717a" />
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
