import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  EmptyState,
  FadeInUp,
  Screen,
  ScreenTitle,
  SectionLabel,
  Stat,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { PhaseCard } from '@/features/body/components/PhaseCard';
import { WeightVsTargetCard } from '@/features/body/components/WeightVsTargetCard';
import { useBodyLog } from '@/features/body/useBodyLog';
import { addDays } from '@/features/body/weekly';
import { DayTotalsCard } from '@/features/nutrition/components/DayTotalsCard';
import { MealBlock } from '@/features/nutrition/components/MealBlock';
import { MEALS } from '@/features/nutrition/diary';
import { useDiary } from '@/features/nutrition/useDiary';
import { useT } from '@/i18n';
import { useDateFormat } from '@/lib/useDateFormat';
import { useTheme } from '@/theme/theme-context';

/**
 * Nutrition — what you ate today against the phase you are in. The diary leads
 * because it is what gets used daily; the phase that sets its targets sits
 * below, and the body log that judges both lives on the Progress tab.
 */
const Nutrition = () => {
  const t = useT();
  const router = useRouter();
  const { user } = useAuth();
  const { muted } = useTheme();
  const { dateKey } = useDateFormat();
  const userId = user?.id ?? '';
  const log = useBodyLog(userId, user?.sex ?? null);
  // Null follows today; set only once the user steps to another day.
  const [picked, setPicked] = useState<string | null>(null);
  const date = picked ?? log.today;
  const diary = useDiary(userId, date, log.today);

  if (!user) return null;

  const goal = log.goal;
  const targets = goal
    ? { kcal: goal.targetKcal, proteinG: goal.proteinG, carbsG: goal.carbsG, fatG: goal.fatG }
    : null;
  const isToday = date === log.today;
  const thisWeekRow = log.calendar.find((r) => r.week === log.currentWeek) ?? null;

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-32"
      header={<TopBar menu showFaq showBeta />}
    >
      <ScreenTitle title={t('nutrition.title')} subtitle={t('nutrition.subtitle')} />

      <FadeInUp>
        <View className="mb-3 flex-row items-center justify-between">
          <Pressable
            hitSlop={10}
            onPress={() => setPicked(addDays(date, -1))}
            accessibilityRole="button"
            accessibilityLabel={t('diary.prevDay')}
            className="h-9 w-9 items-center justify-center rounded-full bg-ink-800"
          >
            <ChevronLeftIcon color={muted} size={18} />
          </Pressable>
          <Pressable onPress={() => setPicked(null)} accessibilityRole="button" hitSlop={8}>
            <Text className="text-base font-sans-semibold text-ink-50">
              {isToday ? t('diary.today') : dateKey(date)}
            </Text>
          </Pressable>
          <Pressable
            hitSlop={10}
            disabled={isToday}
            onPress={() => setPicked(addDays(date, 1) >= log.today ? null : addDays(date, 1))}
            accessibilityRole="button"
            accessibilityLabel={t('diary.nextDay')}
            className={[
              'h-9 w-9 items-center justify-center rounded-full bg-ink-800',
              isToday ? 'opacity-30' : '',
            ].join(' ')}
          >
            <ChevronRightIcon color={muted} size={18} />
          </Pressable>
        </View>
        <DayTotalsCard totals={diary.totals} targets={targets} />
      </FadeInUp>

      <FadeInUp delay={60}>
        <View className="mt-3 gap-3">
          {MEALS.map((meal) => (
            <MealBlock
              key={meal}
              meal={meal}
              entries={diary.meals[meal]}
              onAdd={() => router.push({ pathname: '/food/add', params: { meal, date } })}
            />
          ))}
        </View>
      </FadeInUp>

      <FadeInUp delay={75}>
        <View className="mt-3">
          <Button
            label={t('food.openIdeas')}
            variant="secondary"
            onPress={() => router.push('/food/ideas')}
          />
        </View>
      </FadeInUp>

      <FadeInUp delay={90}>
        <SectionLabel label={t('diary.weekLabel')} hint={t('diary.weekHint')} />
        {diary.week.daysLogged > 0 ? (
          <Card className="flex-row">
            <Stat label={t('diary.avgKcal')} value={String(diary.week.avgKcal)} />
            <Stat label={t('diary.avgProtein')} value={String(diary.week.avgProteinG)} unit="g" />
            <Stat label={t('diary.daysLogged')} value={`${diary.week.daysLogged}/7`} />
          </Card>
        ) : (
          <EmptyState hint={t('diary.weekEmpty')} />
        )}
      </FadeInUp>

      <FadeInUp delay={120}>
        <SectionLabel label={t('goal.phaseLabel')} />
        {goal ? (
          <PhaseCard goal={goal} currentWeek={log.currentWeek} />
        ) : (
          <Card>
            <Text className="text-base font-sans-semibold text-ink-50">{t('goal.emptyTitle')}</Text>
            <Text className="mt-1 text-sm leading-6 text-ink-400">{t('goal.emptyBody')}</Text>
            <View className="mt-4">
              <Button
                label={t('goal.setUp')}
                variant="brand"
                onPress={() => router.push('/body/goal')}
              />
            </View>
          </Card>
        )}
      </FadeInUp>

      {goal ? (
        <FadeInUp delay={150}>
          <SectionLabel label={t('goal.thisWeek')} hint={t('goal.thisWeekHint')} />
          <WeightVsTargetCard row={thisWeekRow} />
        </FadeInUp>
      ) : null}
    </Screen>
  );
};

export default Nutrition;
