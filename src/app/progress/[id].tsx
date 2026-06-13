import { Image } from 'expo-image';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Button, Card, DatePicker, FadeInUp, Screen, useToast } from '@/components/ui';
import { deletePhoto, getPhoto, updatePhotoDate } from '@/features/photos/photos.repo';
import { useT } from '@/i18n';

const PhotoViewer = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const t = useT();

  const photo = typeof id === 'string' ? getPhoto(id) : null;
  const [date, setDate] = useState(() => (photo ? new Date(photo.takenAt) : new Date()));
  const [editingDate, setEditingDate] = useState(false);

  if (!photo) return <Redirect href="/progress" />;

  const onChangeDate = (d: Date) => {
    setDate(d);
    updatePhotoDate(photo.id, d.toISOString());
  };

  const onDelete = () => {
    deletePhoto(photo.id);
    toast.success(t('photos.deletedToast'));
    router.back();
  };

  return (
    <Screen scroll contentClassName="px-5 pb-10">
      <TopBar title={date.toISOString().slice(0, 10)} showBack showAvatar={false} />

      <FadeInUp>
        <View className="overflow-hidden rounded-2xl bg-ink-800">
          <Image
            source={{ uri: photo.uri }}
            style={{ width: '100%', aspectRatio: 0.8 }}
            contentFit="contain"
            transition={150}
          />
        </View>

        {/* Date — tap to edit with the wheel picker. */}
        <Pressable onPress={() => setEditingDate((v) => !v)} accessibilityRole="button">
          <Card className="mt-4 flex-row items-center justify-between">
            <Text className="text-sm text-ink-400">{t('photos.date')}</Text>
            <View className="flex-row items-center">
              <Text className="text-base font-semibold text-ink-50">
                {date.toISOString().slice(0, 10)}
              </Text>
              <ChevronRightIcon color="#566077" size={18} />
            </View>
          </Card>
        </Pressable>
        {editingDate ? (
          <View className="mt-2">
            <DatePicker value={date} onChange={onChangeDate} />
          </View>
        ) : null}

        {photo.weightKg != null ? (
          <Card className="mt-4 flex-row items-center justify-between">
            <Text className="text-sm text-ink-400">{t('profile.weight')}</Text>
            <Text className="text-base font-semibold text-ink-50">{photo.weightKg} kg</Text>
          </Card>
        ) : null}

        <View className="mt-6">
          <Button label={t('photos.delete')} variant="danger" onPress={onDelete} />
        </View>
      </FadeInUp>
    </Screen>
  );
};

export default PhotoViewer;
