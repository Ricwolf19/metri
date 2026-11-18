import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { SegmentedControl, type Segment } from '@/components/ui';
import { useT } from '@/i18n';

type Speed = '0.25' | '0.5' | '1';
const SPEEDS: readonly Speed[] = ['0.25', '0.5', '1'];

/** The player is a native object the hook owns; its rate is set through it, never by React state. */
const playAt = (player: VideoPlayer, speed: Speed) => {
  player.playbackRate = Number(speed);
};

/**
 * A progress clip, looping and silent (clips are recorded without sound), with
 * the system controls for scrubbing and a speed pick for reading form frame
 * by frame: 0.25×, 0.5×, 1×. The player is released with the view.
 */
export const ClipPlayer = ({ uri, aspect }: { uri: string; aspect: number }) => {
  const t = useT();
  const { height } = useWindowDimensions();
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  const [speed, setSpeed] = useState<Speed>('1');
  const segments: Segment<Speed>[] = SPEEDS.map((value) => ({ value, label: `${value}×` }));

  return (
    <View>
      <View className="items-center overflow-hidden rounded-card bg-ink-950">
        <VideoView
          player={player}
          nativeControls
          contentFit="contain"
          allowsPictureInPicture={false}
          // Capped so the speed switch and the actions stay on screen: a 9:16
          // clip at full width is taller than most phones leave below the bar.
          style={{ width: '100%', aspectRatio: aspect, maxHeight: Math.round(height * 0.55) }}
        />
      </View>
      <View className="mt-4">
        <SegmentedControl
          label={t('photos.speed')}
          segments={segments}
          value={speed}
          onChange={(next) => {
            setSpeed(next);
            playAt(player, next);
          }}
        />
      </View>
    </View>
  );
};
