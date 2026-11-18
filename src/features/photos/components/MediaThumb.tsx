import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { PlaySolidIcon, VideoIcon } from '@/components/icons';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import type { ProgressPhoto } from '@/db/schema';
import { useTheme } from '@/theme/theme-context';

import { clipLengthText } from '../format';
import { mediaUri } from '../media';

/**
 * A photo or clip as a 3:4 tile (the capture frame): its thumbnail, and on a
 * clip a play glyph with the length. It fills its parent's width (the height
 * follows the ratio). Decorative — the pressable around it names what it opens.
 */
export const MediaThumb = ({
  media,
}: {
  media: Pick<ProgressPhoto, 'kind' | 'thumbUri' | 'durationMs'>;
}) => {
  const { muted, brandContrast } = useTheme();
  const thumb = mediaUri(media.thumbUri);
  return (
    <View className="overflow-hidden rounded-field bg-ink-800" style={{ aspectRatio: 3 / 4 }}>
      {thumb ? (
        <Image
          source={{ uri: thumb }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={120}
          recyclingKey={thumb}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <VideoIcon color={muted} size={22} />
        </View>
      )}
      {media.kind === 'video' ? (
        <View className="absolute bottom-1 left-1 flex-row items-center gap-1 rounded-full bg-ink-950/80 px-1.5 py-0.5">
          <View className="h-3.5 w-3.5 items-center justify-center rounded-full bg-brand">
            <PlaySolidIcon color={brandContrast} size={8} />
          </View>
          {/* A badge on a ~64 dp tile: it follows the OS font size only so far, or
              "0:04" outgrows the tile it labels. */}
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={CONTROL_FONT_SCALE}
            className="font-mono-medium text-[10px] text-ink-50"
          >
            {clipLengthText(media.durationMs) ?? ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
};
