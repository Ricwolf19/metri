import { Image } from 'expo-image';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { ShareIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Button, ChipRow, HoldButton, Screen, SectionLabel, useToast } from '@/components/ui';
import type { ProgressPhoto, ProgressPose } from '@/db/schema';
import { keepUnlockedWhile } from '@/features/app-lock/lock';
import { LockGate } from '@/features/app-lock/LockGate';
import { useAuth } from '@/features/auth/auth-context';
import { poseLabelKey, POSES } from '@/features/photos/checkins';
import { ClipPlayer } from '@/features/photos/components/ClipPlayer';
import { mediaUri } from '@/features/photos/media';
import { deleteMedia, setMediaPose } from '@/features/photos/photos.repo';
import { useProgressLog, type ProgressEntry } from '@/features/photos/useProgressLog';
import { formatClockTime } from '@/features/training/schedule';
import { useT } from '@/i18n';
import { shareFailed, shareFile } from '@/lib/share-file';
import { useClockFormat } from '@/lib/useClockFormat';
import { useDateFormat } from '@/lib/useDateFormat';
import { useTheme } from '@/theme/theme-context';

type ScreenProps = {
  media: ProgressPhoto;
  entry: ProgressEntry;
  /** The photo or clip was deleted: the parent leaves once this screen is gone. */
  onDeleted: () => void;
};

const MediaScreen = ({ media, entry, onDeleted }: ScreenProps) => {
  const toast = useToast();
  const t = useT();
  const { brand } = useTheme();
  const { user } = useAuth();
  const { date, dateKey } = useDateFormat();
  const clock = useClockFormat();
  const [sharing, setSharing] = useState(false);
  const isClip = media.kind === 'video';
  const uri = mediaUri(media.uri);
  const aspect = media.width && media.height ? media.width / media.height : 3 / 4;
  const at = media.takenAt;
  const when = {
    date: date(at),
    time: formatClockTime(at.getHours() * 60 + at.getMinutes(), clock),
  };

  const title = isClip
    ? t('photos.clip')
    : media.pose
      ? t(poseLabelKey(media.pose))
      : t('photos.untagged');

  // A clip leaves the phone only here, by the lifter's own hand. A closed share
  // sheet is an answer, not a failure. The sheet is another activity on
  // Android: the trip must not relock (and unmount) the viewer under it.
  const shareClip = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const outcome = await keepUnlockedWhile(() => shareFile(uri, 'video', t('photos.shareClip')));
      if (shareFailed(outcome)) toast.error(t('share.failed'));
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-10"
      header={
        <TopBar showBack showAvatar={false} title={title} subtitle={dateKey(entry.checkin.date)} />
      }
    >
      {isClip ? (
        <ClipPlayer uri={uri} aspect={aspect} />
      ) : (
        <View className="overflow-hidden rounded-card bg-ink-800">
          <Image
            source={{ uri }}
            style={{ width: '100%', aspectRatio: aspect }}
            contentFit="contain"
            transition={150}
            accessibilityLabel={title}
          />
        </View>
      )}

      <Text className="mt-3 text-xs text-ink-400">
        {t(isClip ? 'photos.recordedAt' : 'photos.takenAt', when)}
      </Text>

      {isClip ? (
        <View className="mt-6">
          <Button
            variant="brandSoft"
            label={t('photos.shareClip')}
            loading={sharing}
            leftIcon={<ShareIcon color={brand} size={18} />}
            onPress={() => void shareClip()}
          />
        </View>
      ) : (
        <>
          <SectionLabel label={t('photos.pose')} hint={t('photos.poseHint')} className="mt-6" />
          <ChipRow<ProgressPose>
            items={POSES.map((pose) => ({ value: pose, label: t(poseLabelKey(pose)) }))}
            value={media.pose}
            onChange={(pose) => setMediaPose(media.id, user?.id ?? '', pose)}
          />
        </>
      )}

      <View className="mt-8">
        <HoldButton
          variant="danger"
          label={t(isClip ? 'photos.deleteClip' : 'photos.delete')}
          onComplete={() => {
            deleteMedia(media.id, user?.id ?? '');
            toast.success(t(isClip ? 'photos.clipDeleted' : 'photos.deletedToast'));
            onDeleted();
          }}
        />
      </View>
    </Screen>
  );
};

const MediaContent = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { entries } = useProgressLog(user?.id ?? '', user?.sex ?? null);
  // Read live, so a re-tagged pose shows at once. Deep-linkable: the entries are
  // the signed-in user's own, so another account's id finds nothing.
  let found: { media: ProgressPhoto; entry: ProgressEntry } | null = null;
  for (const entry of entries) {
    const media = [...entry.photos, ...entry.videos].find((m) => m.id === id);
    if (media) {
      found = { media, entry };
      break;
    }
  }
  // Deleted here: draw nothing, and go back once this screen is gone (the
  // "gone" redirect below would navigate a second time).
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (leaving) router.back();
  }, [leaving, router]);

  if (!user) return <Redirect href="/" />;
  if (leaving) return null;
  if (!found) return <Redirect href="/progress" />;
  return (
    <MediaScreen
      key={found.media.id}
      media={found.media}
      entry={found.entry}
      onDeleted={() => setLeaving(true)}
    />
  );
};

/** Behind the private-section lock when the lifter turned it on (`features/app-lock`). */
const MediaViewer = () => (
  <LockGate section="photos">
    <MediaContent />
  </LockGate>
);

export default MediaViewer;
