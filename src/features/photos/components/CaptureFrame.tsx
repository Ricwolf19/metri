import { CameraView, type CameraType, type PermissionResponse } from 'expo-camera';
import { Image } from 'expo-image';
import type { Ref } from 'react';
import { Text, View } from 'react-native';

import { CaptureClipPreview } from './CaptureClipPreview';
import { CaptureCountdown } from './CaptureCountdown';
import { CaptureGrid } from './CaptureGrid';
import { CapturePermission } from './CapturePermission';

export type CaptureReview =
  { kind: 'photo'; uri: string } | { kind: 'video'; uri: string; durationMs: number | null };

/**
 * The 3:4 frame every progress photo is taken in: the live camera (4:3 on
 * Android, so the preview fits rather than crops — what is seen is what is
 * saved), the thirds grid, last time's photo as a ghost to line up against,
 * the self-timer and the recording clock on top — or, after a shot, the shot
 * itself to keep or retake.
 *
 * The front preview is a mirror while every saved photo is the true image, so
 * the ghost is flipped with the preview: on screen they always line up.
 */
export const CaptureFrame = ({
  size,
  cameraRef,
  permission,
  requestPermission,
  facing,
  mode,
  ghostUri,
  ghostOpacity,
  grid,
  countdown,
  onCancelCountdown,
  recordingLabel,
  review,
  onReady,
  onMountError,
}: {
  size: { width: number; height: number };
  cameraRef: Ref<CameraView>;
  permission: PermissionResponse | null;
  requestPermission: () => Promise<PermissionResponse>;
  facing: CameraType;
  mode: 'photo' | 'video';
  /** Already resolved through `mediaUri`; null = no ghost (hidden, a clip, a first photo). */
  ghostUri: string | null;
  ghostOpacity: number;
  grid: boolean;
  countdown: number | null;
  onCancelCountdown: () => void;
  /** "0:07 / 0:15" while recording, else null. */
  recordingLabel: string | null;
  review: CaptureReview | null;
  onReady: () => void;
  onMountError: () => void;
}) => (
  <View style={size} className="overflow-hidden rounded-card bg-ink-900">
    {permission?.granted ? (
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        mode={mode === 'photo' ? 'picture' : 'video'}
        ratio="4:3"
        mute
        videoQuality="1080p"
        active={review === null}
        onCameraReady={onReady}
        onMountError={onMountError}
      />
    ) : permission ? (
      <CapturePermission permission={permission} request={requestPermission} />
    ) : null}

    {permission?.granted && !review && ghostUri ? (
      <Image
        source={{ uri: ghostUri }}
        pointerEvents="none"
        contentFit="cover"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: ghostOpacity,
          transform: facing === 'front' ? [{ scaleX: -1 }] : undefined,
        }}
      />
    ) : null}
    {permission?.granted && grid && !review ? <CaptureGrid /> : null}

    {recordingLabel ? (
      <View
        pointerEvents="none"
        className="absolute left-0 right-0 top-3 items-center"
        accessibilityLiveRegion="none"
      >
        <View className="flex-row items-center gap-2 rounded-full bg-ink-950/80 px-3 py-1.5">
          <View className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <Text className="font-mono-medium text-xs text-ink-50">{recordingLabel}</Text>
        </View>
      </View>
    ) : null}

    {countdown !== null ? (
      <CaptureCountdown seconds={countdown} onCancel={onCancelCountdown} />
    ) : null}

    {review ? (
      <View className="absolute inset-0 bg-ink-950">
        {review.kind === 'photo' ? (
          <Image
            source={{ uri: review.uri }}
            contentFit="cover"
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <CaptureClipPreview key={review.uri} uri={review.uri} />
        )}
      </View>
    ) : null}
  </View>
);
