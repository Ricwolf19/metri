import { Pressable, Text, View } from 'react-native';

import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import type { ProgressPose } from '@/db/schema';
import { useT } from '@/i18n';

import { photoForPose, poseLabelKey, POSES, type CheckinEntry } from '../checkins';
import { MediaThumb } from './MediaThumb';
import { PoseSlot } from './PoseSlot';

/** Three to a row: five poses read as 3 + 2, each tile wide enough to judge the photo. */
const ROWS: ProgressPose[][] = [POSES.slice(0, 3), POSES.slice(3)];

/**
 * A check-in's five poses as a grid of 3:4 tiles, each named under it. A
 * taken pose opens its photo; an empty one opens the camera on that pose.
 */
export const PoseGrid = ({
  entry,
  onOpen,
  onTake,
}: {
  entry: CheckinEntry;
  onOpen: (mediaId: string) => void;
  onTake: (pose: ProgressPose) => void;
}) => {
  const t = useT();
  return (
    <View className="gap-3">
      {ROWS.map((row) => (
        <View key={row.join()} className="flex-row gap-3">
          {[0, 1, 2].map((i) => {
            const pose = row[i];
            if (!pose) return <View key={`gap-${i}`} className="flex-1" />;
            const photo = photoForPose(entry, pose);
            const label = t(poseLabelKey(pose));
            return (
              <Pressable
                key={pose}
                onPress={() => (photo ? onOpen(photo.id) : onTake(pose))}
                accessibilityRole="button"
                accessibilityLabel={
                  photo
                    ? t('photos.openPose', { pose: label })
                    : t('photos.addPose', { pose: label })
                }
                className="min-w-0 flex-1"
              >
                {photo ? <MediaThumb media={photo} /> : <PoseSlot />}
                <Text
                  numberOfLines={1}
                  maxFontSizeMultiplier={CONTROL_FONT_SCALE}
                  className={`mt-1 text-center text-xs ${photo ? 'text-ink-200' : 'text-ink-500'}`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};
