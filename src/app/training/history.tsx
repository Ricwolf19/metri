import { useLiveQuery } from '@/db/useLiveQuery';
import { FlashList } from '@shopify/flash-list';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Card, EmptyState, PressableScale, Screen, SectionLabel } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { DayDetailSheet } from '@/features/training/components/DayDetailSheet';
import { DeleteSessionButton } from '@/features/training/components/DeleteSessionButton';
import { localDateKey } from '@/features/training/dates';
import { dayDisplayName, routineDisplayName } from '@/features/training/labels';
import { presetProgramCopy } from '@/features/training/programs';
import { fromKgHalf } from '@/features/training/progression';
import { programSessionsQuery, type ProgramSession } from '@/features/training/session.repo';
import { useEnrollment } from '@/features/training/useEnrollment';
import { useI18n, useT } from '@/i18n';
import { settings } from '@/lib/storage';
import { useDateFormat } from '@/lib/useDateFormat';

/** One row of the virtualized list: a phase · week heading, or a session under it. */
type Item =
  { kind: 'group'; key: string; title: string } | { kind: 'session'; session: ProgramSession };

/** The active program's finished sessions by phase and week — where a mistaken log is undone.
 * A whole program is a hundred-odd sessions, so the list virtualizes: the headings and the rows
 * are one flat `FlashList`, the hint card its header. */
const History = () => {
  const t = useT();
  const { locale } = useI18n();
  const { user } = useAuth();
  const { date } = useDateFormat();
  const unit = settings.getEquipmentUnits();
  const userId = user?.id ?? '';
  const { enrollment, structure } = useEnrollment(userId);
  const enrollmentId = enrollment?.id ?? '';
  const { data: sessions } = useLiveQuery(programSessionsQuery(enrollmentId), [enrollmentId]);
  const [openDay, setOpenDay] = useState<string | null>(null);

  if (!user) return <Redirect href="/" />;

  const routines = structure?.routines ?? [];
  // Sessions arrive newest first, so groups keep that order by first appearance.
  const groups = new Map<string, { title: string; rows: ProgramSession[] }>();
  for (const s of sessions) {
    const key = `${s.routineId ?? ''}:${s.weekNumber}`;
    const routine = routines.find((r) => r.id === s.routineId);
    const week = t('training.weekN', { n: s.weekNumber });
    const group = groups.get(key) ?? {
      title: routine ? `${routineDisplayName(routine, t)} · ${week}` : week,
      rows: [],
    };
    group.rows.push(s);
    groups.set(key, group);
  }
  const items: Item[] = [...groups.entries()].flatMap(([key, group]) => [
    { kind: 'group' as const, key, title: group.title },
    ...group.rows.map((session) => ({ kind: 'session' as const, session })),
  ]);

  const programName = structure?.program
    ? (presetProgramCopy(structure.program.id, locale)?.name ?? structure.program.name)
    : undefined;

  return (
    <Screen
      edges={['top']}
      contentClassName="px-5"
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={t('training.sessions')}
          subtitle={programName ?? t('training.sessionsSub')}
        />
      }
    >
      <FlashList
        data={items}
        keyExtractor={(item) => (item.kind === 'group' ? `g:${item.key}` : item.session.id)}
        getItemType={(item) => item.kind}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <Card className="mb-2 border-brand/25 bg-brand/5">
            <Text className="text-sm leading-6 text-ink-200">{t('training.sessionsHint')}</Text>
          </Card>
        }
        ListEmptyComponent={<EmptyState hint={t('training.sessionsEmpty')} />}
        renderItem={({ item }) => {
          if (item.kind === 'group') return <SectionLabel label={item.title} />;
          const s = item.session;
          return (
            <PressableScale
              className="mb-2"
              onPress={() => (s.completedAt ? setOpenDay(localDateKey(s.completedAt)) : null)}
            >
              <Card className="flex-row items-center">
                <View className="min-w-0 flex-1 pr-3">
                  <Text className="text-base font-sans-semibold text-ink-50" numberOfLines={1}>
                    {s.dayName != null && s.dayOrder != null
                      ? dayDisplayName({ name: s.dayName, orderIndex: s.dayOrder }, t)
                      : '—'}
                  </Text>
                  {/* Date and totals on their own lines: one joined line clipped on a
                      small phone, mid-number. */}
                  {s.completedAt ? (
                    <Text className="mt-0.5 text-xs text-ink-400" numberOfLines={1}>
                      {date(s.completedAt)}
                    </Text>
                  ) : null}
                  <Text className="mt-0.5 text-xs text-ink-400" numberOfLines={1}>
                    {t('dayDetail.setsLine', {
                      count: s.setCount,
                      volume: fromKgHalf(s.volumeKg, unit),
                      unit,
                    })}
                  </Text>
                </View>
                <DeleteSessionButton logId={s.id} />
              </Card>
            </PressableScale>
          );
        }}
      />

      <DayDetailSheet date={openDay} onClose={() => setOpenDay(null)} />
    </Screen>
  );
};

export default History;
