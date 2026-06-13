import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { CameraIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  FadeInUp,
  PressableScale,
  Screen,
  SegmentedControl,
  useToast,
  type Segment,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { pickFromCamera, pickFromLibrary } from '@/features/photos/capture';
import { groupByPeriod, PERIODS, type Period } from '@/features/photos/period';
import { addPhoto, photosQuery } from '@/features/photos/photos.repo';
import { useT } from '@/i18n';
import { formatYmd } from '@/lib/date';

const Progress = () => {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const { data } = useLiveQuery(photosQuery(user?.id ?? ''));

  const [period, setPeriod] = useState<Period>('month');
  const groups = useMemo(() => groupByPeriod(data, period), [data, period]);
  const periodSegments: Segment<Period>[] = PERIODS.map((p) => ({
    value: p,
    label: t(`period.${p}`),
  }));

  const groupLabel = (key: string) => (period === 'week' ? `${t('period.weekOf')} ${key}` : key);

  const capture = async (source: 'camera' | 'library') => {
    if (!user) return;
    const uri = source === 'camera' ? await pickFromCamera() : await pickFromLibrary();
    if (!uri) return;
    try {
      await addPhoto(user.id, uri, {
        takenAt: new Date(),
        weightKg: user.weightKg ?? null,
      });
      toast.success(t('photos.savedToast'));
    } catch {
      toast.error(t('photos.permDenied'));
    }
  };

  const onAdd = () => {
    Alert.alert(t('photos.chooseTitle'), undefined, [
      { text: t('photos.camera'), onPress: () => capture('camera') },
      { text: t('photos.library'), onPress: () => capture('library') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const addButton = (
    <Pressable
      hitSlop={8}
      onPress={onAdd}
      accessibilityRole="button"
      accessibilityLabel={t('photos.add')}
      className="h-9 w-9 items-center justify-center rounded-full bg-accentFill"
    >
      <Text className="text-xl font-bold text-ink-950">+</Text>
    </Pressable>
  );

  return (
    <Screen scroll edges={['top']} contentClassName="px-5 pb-8">
      <TopBar title={t('photos.title')} subtitle={t('photos.subtitle')} right={addButton} />

      {data.length === 0 ? (
        <FadeInUp>
          <Card className="mt-1 items-center py-8">
            <CameraIcon color="#566077" size={32} />
            <Text className="mt-3 text-base font-semibold text-ink-50">{t('photos.empty')}</Text>
            <Text className="mt-1 text-center text-sm text-ink-400">{t('photos.emptyBody')}</Text>
            <View className="mt-5 w-full">
              <Button label={t('photos.add')} onPress={onAdd} />
            </View>
          </Card>
        </FadeInUp>
      ) : (
        <>
          <View className="mb-4 flex-row items-center gap-3">
            <View className="flex-1">
              <SegmentedControl segments={periodSegments} value={period} onChange={setPeriod} />
            </View>
            {data.length >= 2 ? (
              <Pressable
                onPress={() => router.push('/progress/compare')}
                accessibilityRole="button"
                className="rounded-xl border border-ink-600 bg-ink-800 px-3 py-2.5"
              >
                <Text className="text-sm font-semibold text-accent">{t('photos.compare')}</Text>
              </Pressable>
            ) : null}
          </View>

          {groups.map((group, gi) => (
            <View key={group.key} className="mb-5">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
                {groupLabel(group.key)}
              </Text>
              <View className="flex-row flex-wrap justify-between">
                {group.items.map((p, i) => (
                  <FadeInUp
                    key={p.id}
                    delay={(gi + i) * 30}
                    style={{ width: '31.5%' }}
                    className="mb-3"
                  >
                    <PressableScale
                      onPress={() =>
                        router.push({ pathname: '/progress/[id]', params: { id: p.id } })
                      }
                    >
                      <View className="aspect-square overflow-hidden rounded-xl bg-ink-800">
                        <Image
                          source={{ uri: p.thumbUri }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                          transition={150}
                        />
                      </View>
                      <Text className="mt-1 text-center text-xs text-ink-400">
                        {formatYmd(p.takenAt)}
                      </Text>
                    </PressableScale>
                  </FadeInUp>
                ))}
              </View>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
};

export default Progress;
