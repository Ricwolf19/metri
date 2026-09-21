import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Card, EmptyState, Screen, SectionLabel, useDialog, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { applyAdjustment } from '@/features/body/body-goals.repo';
import { judgedTrend, type WeekStatus } from '@/features/body/calendar';
import { suggestAdjustment } from '@/features/body/targets';
import { useBodyLog } from '@/features/body/useBodyLog';
import { fromKg } from '@/features/training/progression';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';
import { useDateFormat } from '@/lib/useDateFormat';

const STATUS_CLASS: Record<WeekStatus, string> = {
  ahead: 'text-brand',
  on: 'text-brand',
  behind: 'text-amber-500',
  'low-data': 'text-ink-400',
  pending: 'text-ink-600',
};

/** The phase week by week: the weight the plan asked for, next to what happened. */
const BodyCalendar = () => {
  const t = useT();
  const dialog = useDialog();
  const toast = useToast();
  const { user } = useAuth();
  const { dateKey } = useDateFormat();
  const units = settings.getUnits();
  const log = useBodyLog(user?.id ?? '', user?.sex ?? null);
  const goal = log.goal;

  const past = log.calendar.filter((r) => r.week < log.currentWeek);
  const step = goal
    ? suggestAdjustment({
        trend: judgedTrend(past),
        phase: goal.phase,
        targetKcal: goal.targetKcal,
      })
    : null;
  // One proposal per fortnight: a step just applied needs its own two weeks.
  const lastAdjusted = goal?.adjustments?.[goal.adjustments.length - 1]?.date ?? null;
  const canAdjust =
    step != null && (!lastAdjusted || lastAdjusted < (past[past.length - 2]?.weekStart ?? ''));

  const onAdjust = () => {
    if (!goal || step == null) return;
    dialog.confirm({
      title: t('goal.adjustTitle'),
      message: t(step < 0 ? 'goal.adjustLess' : 'goal.adjustMore', { n: Math.abs(step) }),
      confirmLabel: t('goal.adjustConfirm'),
      onConfirm: () => {
        applyAdjustment(goal, log.today, step);
        toast.success(t('goal.adjusted'));
      },
    });
  };

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-10"
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={t('goal.calendarTitle')}
          subtitle={t('goal.calendarSubtitle')}
        />
      }
    >
      {!goal ? (
        <View className="mt-4">
          <EmptyState hint={t('goal.calendarEmpty')} />
        </View>
      ) : (
        <>
          {canAdjust ? (
            <Card className="mt-2 border-amber-500/40">
              <Text className="text-sm leading-6 text-ink-200">{t('goal.adjustPrompt')}</Text>
              <Text
                onPress={onAdjust}
                accessibilityRole="button"
                className="mt-3 text-sm font-sans-semibold text-brand"
              >
                {t('goal.adjustCta')}
              </Text>
            </Card>
          ) : null}

          <SectionLabel label={t('goal.weekByWeek')} hint={t('goal.weekByWeekHint')} />
          <Card className="gap-0 py-1">
            {log.calendar.map((row, i) => (
              <View
                key={row.week}
                className={[
                  'flex-row items-center py-3',
                  i > 0 ? 'border-t border-ink-700' : '',
                ].join(' ')}
              >
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-sans-semibold text-ink-100">
                    {t('goal.weekN', { n: row.week + 1 })}
                  </Text>
                  <Text className="text-[11px] text-ink-500">{dateKey(row.weekStart)}</Text>
                </View>
                <Text className="w-16 text-right text-sm text-ink-400">
                  {fromKg(row.targetKg, units)}
                </Text>
                <Text className="w-16 text-right text-sm font-sans-semibold text-ink-50">
                  {row.actualKg != null ? fromKg(row.actualKg, units) : '—'}
                </Text>
                <Text className={['w-20 text-right text-xs', STATUS_CLASS[row.status]].join(' ')}>
                  {t(`goal.status.${row.status}`)}
                </Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
};

export default BodyCalendar;
