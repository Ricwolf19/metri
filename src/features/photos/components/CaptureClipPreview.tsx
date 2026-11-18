import { useVideoPlayer, VideoView } from 'expo-video';

/**
 * A just-recorded (or picked) clip, looping without sound while the lifter
 * decides. Its own component so the player lives and dies with the review.
 */
export const CaptureClipPreview = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      nativeControls={false}
      contentFit="cover"
      style={{ width: '100%', height: '100%' }}
    />
  );
};
