import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Card, EmptyState, FadeInUp, PressableScale, Screen, SectionLabel } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { DayDetailSheet } from '@/features/training/components/DayDetailSheet';
import { DeleteSessionButton } from '@/features/training/components/DeleteSessionButton';
import { localDateKey } from '@/features/training/dates';
import { dayDisplayName, routineDisplayName } from '@/features/training/labels';
import { presetProgramCopy } from '@/features/training/programs';
import { fromKg } from '@/features/training/progression';
import { programSessionsQuery, type ProgramSession } from '@/features/training/session.repo';
import { useEnrollment } from '@/features/training/useEnrollment';
import { useI18n, useT } from '@/i18n';
import { settings } from '@/lib/storage';
import { useDateFormat } from '@/lib/useDateFormat';

/** The active program's finished sessions by phase and week — where a mistaken log is undone. */
const History = () => {
  const t = useT();
  const { locale } = useI18n();
  const { user } = useAuth();
  const { date } = useDateFormat();
  const unit = settings.getUnits();
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

  const programName = structure?.program
    ? (presetProgramCopy(structure.program.id, locale)?.name ?? structure.program.name)
    : undefined;

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-10"
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={t('training.sessions')}
          subtitle={programName ?? t('training.sessionsSub')}
        />
      }
    >
      <Card className="mb-2 border-brand/25 bg-brand/5">
        <Text className="text-sm leading-6 text-ink-200">{t('training.sessionsHint')}</Text>
      </Card>

      {!sessions.length ? <EmptyState hint={t('training.sessionsEmpty')} /> : null}

      {[...groups.entries()].map(([key, group]) => (
        <View key={key}>
          <SectionLabel label={group.title} />
          <View className="gap-2">
            {group.rows.map((s, i) => (
              <FadeInUp key={s.id} delay={Math.min(i, 5) * 40}>
                <PressableScale
                  onPress={() => (s.completedAt ? setOpenDay(localDateKey(s.completedAt)) : null)}
                >
                  <Card className="flex-row items-center">
                    <View className="flex-1 pr-3">
                      <Text className="text-base font-sans-semibold text-ink-50" numberOfLines={1}>
                        {s.dayName != null && s.dayOrder != null
                          ? dayDisplayName({ name: s.dayName, orderIndex: s.dayOrder }, t)
                          : '—'}
                      </Text>
                      <Text className="mt-0.5 text-xs text-ink-400">
                        {s.completedAt ? `${date(s.completedAt)} · ` : ''}
                        {t('dayDetail.setsLine', {
                          count: s.setCount,
                          volume: fromKg(s.volumeKg, unit),
                          unit,
                        })}
                      </Text>
                    </View>
                    <DeleteSessionButton logId={s.id} />
                  </Card>
                </PressableScale>
              </FadeInUp>
            ))}
          </View>
        </View>
      ))}

      <DayDetailSheet date={openDay} onClose={() => setOpenDay(null)} />
    </Screen>
  );
};

export default History;
