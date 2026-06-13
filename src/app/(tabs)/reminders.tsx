import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { Pressable, Switch, Text, View } from 'react-native';

import { BellIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Button, Card, FadeInUp, PressableScale, Screen } from '@/components/ui';
import type { Reminder } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { remindersQuery, setReminderEnabled } from '@/features/reminders/reminders.repo';
import { DAY_KEYS, formatTime } from '@/features/reminders/format';
import { useT } from '@/i18n';

const Reminders = () => {
  const { user } = useAuth();
  const router = useRouter();
  const t = useT();
  const { data } = useLiveQuery(remindersQuery(user?.id ?? ''));

  const summary = (r: Reminder) => {
    const time = formatTime(r.hour, r.minute);
    return r.frequency === 'weekly'
      ? `${t(DAY_KEYS[(r.weekday ?? 1) - 1])} · ${time}`
      : `${t('rem.daily')} · ${time}`;
  };

  const addButton = (
    <Pressable
      hitSlop={8}
      onPress={() => router.push('/reminder-edit')}
      accessibilityRole="button"
      accessibilityLabel={t('rem.add')}
      className="h-9 w-9 items-center justify-center rounded-full bg-accentFill"
    >
      <Text className="text-xl font-bold text-ink-950">+</Text>
    </Pressable>
  );

  return (
    <Screen scroll edges={['top']} contentClassName="px-5 pb-8">
      <TopBar title={t('tab.reminders')} subtitle={t('rem.subtitle')} right={addButton} />

      {data.length === 0 ? (
        <FadeInUp>
          <Card className="mt-1 items-center py-8">
            <BellIcon color="#566077" size={32} />
            <Text className="mt-3 text-base font-semibold text-ink-50">{t('rem.empty')}</Text>
            <Text className="mt-1 text-center text-sm text-ink-400">{t('rem.emptyBody')}</Text>
            <View className="mt-5 w-full">
              <Button label={t('rem.add')} onPress={() => router.push('/reminder-edit')} />
            </View>
          </Card>
        </FadeInUp>
      ) : (
        <View className="gap-3">
          {data.map((r, i) => (
            <FadeInUp key={r.id} delay={i * 60}>
              <PressableScale
                onPress={() => router.push({ pathname: '/reminder-edit', params: { id: r.id } })}
              >
                <Card className="flex-row items-center">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-semibold text-ink-50">{r.title}</Text>
                    <Text className="mt-0.5 text-sm text-ink-400">{summary(r)}</Text>
                  </View>
                  <Switch
                    value={r.enabled}
                    onValueChange={(v) => setReminderEnabled(r.id, v)}
                    trackColor={{ true: '#bef82b', false: '#2c3447' }}
                    thumbColor="#eef1f6"
                  />
                </Card>
              </PressableScale>
            </FadeInUp>
          ))}
        </View>
      )}
    </Screen>
  );
};

export default Reminders;
