import { useRouter } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { StarIcon } from '@/components/icons';
import { Button } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useT, type TranslationKey } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { getSyncLog, subscribeSyncLog } from './log';

/** Mirror of SyncRing's palette, with an i18n label per state. */
const LEGEND: { color: string; key: TranslationKey }[] = [
  { color: '#bef82b', key: 'sync.legendSynced' },
  { color: '#38bdf8', key: 'sync.legendSyncing' },
  { color: '#71717a', key: 'sync.legendOffline' },
  { color: '#f87171', key: 'sync.legendError' },
];

const useSyncLog = () => useSyncExternalStore(subscribeSyncLog, getSyncLog, getSyncLog);

const hhmm = (ts: number): string => {
  const d = new Date(ts);
  return `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;
};

/**
 * Bottom panel behind the avatar tap: what the ring colors mean plus the last
 * sync movements/errors — the beta-support surface (a tester screenshots this
 * instead of plugging into logcat). Free users get the premium pitch instead.
 */
export const SyncPanel = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const t = useT();
  const router = useRouter();
  const { isPremium } = useAuth();
  const { brand } = useTheme();
  const log = useSyncLog();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
        <Pressable
          className="max-h-[70%] rounded-t-3xl border-t border-ink-700 bg-ink-900 px-5 pb-8 pt-4"
          onPress={() => {}}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-ink-600" />
          <Text className="text-lg font-sans-bold text-ink-50">{t('sync.panelTitle')}</Text>

          {isPremium ? (
            <>
              {/* Legend */}
              <View className="mt-3 gap-2">
                {LEGEND.map(({ color, key }) => (
                  <View key={key} className="flex-row items-center gap-2.5">
                    <View style={{ backgroundColor: color }} className="h-2.5 w-2.5 rounded-full" />
                    <Text className="text-sm text-ink-300">{t(key)}</Text>
                  </View>
                ))}
              </View>

              {/* Recent activity */}
              <Text className="mb-2 mt-5 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
                {t('sync.recent')}
              </Text>
              {log.length === 0 ? (
                <Text className="text-sm text-ink-400">{t('sync.noActivity')}</Text>
              ) : (
                <ScrollView className="max-h-64">
                  {log.map((entry) => (
                    <View key={entry.ts} className="flex-row items-start gap-3 py-1.5">
                      <Text className="font-mono text-xs text-ink-500">{hhmm(entry.ts)}</Text>
                      <Text
                        className={[
                          'flex-1 font-mono text-xs leading-5',
                          entry.kind === 'error' ? 'text-red-400' : 'text-ink-200',
                        ].join(' ')}
                        numberOfLines={2}
                      >
                        {entry.message}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View className="mt-3 items-center py-4">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-brand/15">
                <StarIcon color={brand} size={22} />
              </View>
              <Text className="mt-3 text-center text-sm leading-6 text-ink-300">
                {t('sync.freeBody')}
              </Text>
              <View className="mt-4 w-full">
                <Button
                  label={t('premium.upsellRow')}
                  variant="brand"
                  onPress={() => {
                    onClose();
                    router.push('/premium');
                  }}
                />
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};
