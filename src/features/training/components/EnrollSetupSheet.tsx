import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button, TimePicker } from '@/components/ui';
import { syncNotificationEvents } from '@/features/notifications/policies';

import { DAY_LETTERS } from '../labels';
import { useI18n, useT } from '@/i18n';
import { settings } from '@/lib/storage';

// Monday-first single letters, mapped to expo weekday numbers (1=Sun…7=Sat).
const DAY_ORDER = [2, 3, 4, 5, 6, 7, 1];
/**
 * Asked once when enrolling: which days you train and at what hour. The answer
 * becomes `user_programs.trainingWeekdays` AND the training-time notification
 * schedule — set the plan, get reminded automatically.
 */
export const EnrollSetupSheet = ({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (weekdays: number[]) => void;
}) => {
  const t = useT();
  const { locale } = useI18n();
  const [weekdays, setWeekdays] = useState<number[]>([2, 4, 6]);
  const [time, setTime] = useState({ hour: 18, minute: 0 });
  const clock = settings.getClockFormat();

  const toggle = (d: number) => {
    const has = weekdays.includes(d);
    const next = has ? weekdays.filter((x) => x !== d) : [...weekdays, d];
    if (next.length) setWeekdays(next);
  };

  const confirm = () => {
    // Align the training-time notification event with the chosen schedule.
    settings.setEventConfig('training-time', {
      enabled: true,
      hour: time.hour,
      minute: time.minute,
      weekdays,
    });
    void syncNotificationEvents();
    onConfirm(weekdays);
  };

  const labels = DAY_LETTERS[locale] ?? DAY_LETTERS.en;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
        <Pressable
          className="rounded-t-3xl border-t border-ink-700 bg-ink-900 px-5 pb-8 pt-4"
          onPress={() => {}}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-ink-600" />
          <Text className="text-lg font-sans-bold text-ink-50">{t('enroll.setupTitle')}</Text>
          <Text className="mt-1 text-sm text-ink-400">{t('enroll.setupSub')}</Text>

          <Text className="mb-2 mt-5 font-mono-medium text-xs uppercase tracking-wider text-ink-300">
            {t('enroll.days')}
          </Text>
          <View className="flex-row justify-between">
            {DAY_ORDER.map((weekday, i) => {
              const active = weekdays.includes(weekday);
              return (
                <Pressable
                  key={weekday}
                  onPress={() => toggle(weekday)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={[
                    'h-10 w-10 items-center justify-center rounded-full border',
                    active ? 'border-brand/40 bg-brand/15' : 'border-ink-700 bg-ink-800',
                  ].join(' ')}
                >
                  <Text
                    className={[
                      'text-sm font-sans-semibold',
                      active ? 'text-brand' : 'text-ink-400',
                    ].join(' ')}
                  >
                    {labels[i]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="mb-2 mt-5 font-mono-medium text-xs uppercase tracking-wider text-ink-300">
            {t('enroll.time')}
          </Text>
          <TimePicker
            hour={time.hour}
            minute={time.minute}
            clock={clock}
            onChange={(next) => setTime(next)}
          />

          <View className="mt-5">
            <Button label={t('enroll.start')} variant="brand" onPress={confirm} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
