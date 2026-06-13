import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  Input,
  Screen,
  SegmentedControl,
  TimePicker,
  useToast,
  type Segment,
} from '@/components/ui';
import type { ReminderFrequency } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { DAY_KEYS } from '@/features/reminders/format';
import {
  createReminder,
  deleteReminder,
  getReminder,
  updateReminder,
} from '@/features/reminders/reminders.repo';
import { ensureNotificationPermission } from '@/features/reminders/scheduler';
import { useT } from '@/i18n';

const ReminderEdit = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const t = useT();

  const existing = typeof id === 'string' ? getReminder(id) : null;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [frequency, setFrequency] = useState<ReminderFrequency>(existing?.frequency ?? 'daily');
  const [weekday, setWeekday] = useState(existing?.weekday ?? 2);
  const [hour, setHour] = useState(existing?.hour ?? 8);
  const [minute, setMinute] = useState(existing?.minute ?? 0);
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);
  const [saving, setSaving] = useState(false);

  const freqSegments: Segment<ReminderFrequency>[] = [
    { value: 'daily', label: t('rem.daily') },
    { value: 'weekly', label: t('rem.weekly') },
  ];

  const onSave = async () => {
    if (!title.trim() || !user) return toast.error(t('rem.errName'));
    setSaving(true);
    try {
      let granted = true;
      try {
        if (enabled) granted = await ensureNotificationPermission();
      } catch {
        granted = false;
      }
      if (enabled && !granted) toast.info(t('rem.permDenied'));
      const input = {
        title: title.trim(),
        body: body.trim(),
        frequency,
        hour,
        minute,
        weekday,
        enabled,
      };
      if (existing) await updateReminder(existing.id, input);
      else await createReminder(user.id, input);
      toast.success(t('rem.savedToast'));
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!existing) return;
    await deleteReminder(existing.id);
    toast.success(t('rem.deletedToast'));
    router.back();
  };

  return (
    <Screen scroll contentClassName="px-5 pb-10">
      <TopBar title={existing ? t('rem.edit') : t('rem.new')} showBack showAvatar={false} />

      <View className="mt-1 gap-5">
        <Input
          label={t('rem.name')}
          value={title}
          onChangeText={setTitle}
          placeholder={t('rem.namePlaceholder')}
          autoCapitalize="sentences"
        />
        <Input
          label={t('rem.note')}
          value={body}
          onChangeText={setBody}
          placeholder={t('rem.notePlaceholder')}
          autoCapitalize="sentences"
        />

        <SegmentedControl
          label={t('rem.frequency')}
          segments={freqSegments}
          value={frequency}
          onChange={setFrequency}
        />

        {frequency === 'weekly' ? (
          <View>
            <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-300">
              {t('rem.day')}
            </Text>
            <View className="flex-row gap-2">
              {DAY_KEYS.map((key, i) => {
                const value = i + 1;
                const active = value === weekday;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setWeekday(value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className={[
                      'flex-1 items-center rounded-lg border py-2',
                      active ? 'border-lime-400 bg-accentFill' : 'border-ink-600 bg-ink-800',
                    ].join(' ')}
                  >
                    <Text
                      className={[
                        'text-xs font-semibold',
                        active ? 'text-ink-950' : 'text-ink-300',
                      ].join(' ')}
                    >
                      {t(key)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View>
          <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-300">
            {t('rem.time')}
          </Text>
          <TimePicker
            hour={hour}
            minute={minute}
            onChange={({ hour: h, minute: m }) => {
              setHour(h);
              setMinute(m);
            }}
          />
        </View>

        <Card className="flex-row items-center justify-between">
          <Text className="text-base font-medium text-ink-100">{t('rem.enabled')}</Text>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ true: '#bef82b', false: '#2c3447' }}
            thumbColor="#eef1f6"
          />
        </Card>

        <Button label={t('rem.save')} onPress={onSave} loading={saving} />
        {existing ? <Button label={t('rem.delete')} variant="danger" onPress={onDelete} /> : null}
      </View>
    </Screen>
  );
};

export default ReminderEdit;
