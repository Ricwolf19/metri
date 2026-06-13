import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Card, Screen } from '@/components/ui';
import type { ProgressPhoto } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { photosQuery } from '@/features/photos/photos.repo';
import { useT } from '@/i18n';
import { formatYmd } from '@/lib/date';

type Slot = 'before' | 'after';

const Panel = ({
  photo,
  label,
  active,
  onPress,
}: {
  photo?: ProgressPhoto;
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable onPress={onPress} accessibilityRole="button" className="flex-1">
    <View
      className={[
        'overflow-hidden rounded-2xl border-2 bg-ink-800',
        active ? 'border-lime-400' : 'border-transparent',
      ].join(' ')}
    >
      {photo ? (
        <Image
          source={{ uri: photo.uri }}
          style={{ width: '100%', aspectRatio: 0.7 }}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View style={{ aspectRatio: 0.7 }} />
      )}
    </View>
    <Text className="mt-1 text-center text-xs font-semibold uppercase tracking-wider text-accent">
      {label}
    </Text>
    <Text className="text-center text-xs text-ink-300">
      {photo ? formatYmd(photo.takenAt) : '—'}
      {photo?.weightKg != null ? ` · ${photo.weightKg} kg` : ''}
    </Text>
  </Pressable>
);

const Compare = () => {
  const { user } = useAuth();
  const t = useT();
  const { data } = useLiveQuery(photosQuery(user?.id ?? ''));

  const [beforeId, setBeforeId] = useState<string | null>(null);
  const [afterId, setAfterId] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot>('before');

  if (data.length < 2) {
    return (
      <Screen scroll contentClassName="px-5 pb-10">
        <TopBar title={t('photos.compare')} showBack showAvatar={false} />
        <Card>
          <Text className="text-sm text-ink-400">{t('photos.needTwo')}</Text>
        </Card>
      </Screen>
    );
  }

  // Default to oldest (before) vs newest (after); data is newest-first.
  const before = data.find((p) => p.id === beforeId) ?? data[data.length - 1];
  const after = data.find((p) => p.id === afterId) ?? data[0];

  const pick = (id: string) => {
    if (slot === 'before') {
      setBeforeId(id);
      setSlot('after');
    } else {
      setAfterId(id);
      setSlot('before');
    }
  };

  return (
    <Screen scroll contentClassName="px-5 pb-10">
      <TopBar title={t('photos.compare')} showBack showAvatar={false} />

      <View className="flex-row gap-3">
        <Panel
          photo={before}
          label={t('photos.before')}
          active={slot === 'before'}
          onPress={() => setSlot('before')}
        />
        <Panel
          photo={after}
          label={t('photos.after')}
          active={slot === 'after'}
          onPress={() => setSlot('after')}
        />
      </View>

      <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-ink-400">
        {t('photos.pickTwo')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pb-2"
      >
        {data.map((p) => {
          const isBefore = p.id === before.id;
          const isAfter = p.id === after.id;
          return (
            <Pressable key={p.id} onPress={() => pick(p.id)} accessibilityRole="button">
              <View
                className={[
                  'h-20 w-20 overflow-hidden rounded-xl border-2 bg-ink-800',
                  isBefore || isAfter ? 'border-lime-400' : 'border-ink-700',
                ].join(' ')}
              >
                <Image
                  source={{ uri: p.thumbUri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={120}
                />
              </View>
              {isBefore || isAfter ? (
                <View className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-accentFill">
                  <Text className="text-[10px] font-bold text-ink-950">
                    {isBefore ? t('photos.before')[0] : t('photos.after')[0]}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
};

export default Compare;
