import { useCameraPermissions, type CameraType, type CameraView } from 'expo-camera';
import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Text, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EyeIcon,
  EyeOffIcon,
  FlipCameraIcon,
  GalleryIcon,
  GridIcon,
  XIcon,
} from '@/components/icons';
import {
  Button,
  IconButton,
  SegmentedControl,
  Slider,
  useToast,
  type Segment,
} from '@/components/ui';
import type { ProgressPose } from '@/db/schema';
import { keepUnlockedWhile } from '@/features/app-lock/lock';
import { LockGate } from '@/features/app-lock/LockGate';
import { useAuth } from '@/features/auth/auth-context';
import { pickClipFromLibrary, pickFromLibrary } from '@/features/photos/capture';
import {
  CLIP_IMPORT_MAX_MS,
  CLIP_MAX_S,
  GHOST_OPACITY,
  nextTimer,
  poseAfterSave,
  recordedMs,
  recordingText,
  type TimerSeconds,
} from '@/features/photos/capture-flow';
import { ghostFor, isPose, nextMissingPose, poseLabelKey } from '@/features/photos/checkins';
import { CaptureFrame, type CaptureReview } from '@/features/photos/components/CaptureFrame';
import { CapturePoseStrip } from '@/features/photos/components/CapturePoseStrip';
import { CaptureShutter } from '@/features/photos/components/CaptureShutter';
import { CaptureTimerButton } from '@/features/photos/components/CaptureTimerButton';
import { mediaUri } from '@/features/photos/media';
import { addMedia, getCheckin } from '@/features/photos/photos.repo';
import { useProgressLog } from '@/features/photos/useProgressLog';
import { useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/sounds';
import { captureError } from '@/lib/telemetry';
import { useTodayKey } from '@/lib/useTodayKey';
import { useTheme } from '@/theme/theme-context';

type Mode = 'photo' | 'video';

/** Its own tag: a session's keep-awake must survive this screen closing. */
const KEEP_AWAKE_TAG = 'progress-capture';

// Remembered for the life of the process, so the next check-in opens set up
// the way the last one was shot (a phone propped on the same shelf, 10 s).
// The front camera first: the lifter sees themselves and the ghost while posing.
let lastFacing: CameraType = 'front';
let lastTimer: TimerSeconds = 0;
const lastLook = { grid: true, ghost: true, ghostOpacity: GHOST_OPACITY };

/**
 * The guided progress camera (`/progress/capture`): the five poses of a
 * check-in in order, each in the same 3:4 frame with the thirds grid and last
 * time's photo of that pose laid over the view, a self-timer that counts down
 * out loud, and silent clips of up to 15 s. Every shot is reviewed, then saved
 * straight into the app (never the gallery), and the walk moves to the next
 * pose still missing.
 *
 * Params: `checkin` (add to that one, and return to it when done), `pose`
 * (start there), `mode` ('video' opens on clips). With no check-in named, the
 * shots join today's latest check-in, or a new one created on the FIRST save
 * — leaving without saving leaves nothing behind.
 */
const CaptureContent = () => {
  const params = useLocalSearchParams<{ checkin?: string; pose?: string; mode?: string }>();
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { muted, brand, navTheme } = useTheme();
  // The nav text colour: light glyphs on the camera surface.
  const light = String(navTheme.colors.text);
  const { user } = useAuth();
  useKeepAwake(KEEP_AWAKE_TAG, { suppressDeactivateWarnings: true });
  const today = useTodayKey();
  const { entries } = useProgressLog(user?.id ?? '', user?.sex ?? null);
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);

  const [opened] = useState(() => {
    const named =
      user && typeof params.checkin === 'string' && getCheckin(params.checkin, user.id)
        ? params.checkin
        : null;
    const id = named ?? entries.find((e) => e.checkin.date === today)?.checkin.id ?? null;
    const entry = entries.find((e) => e.checkin.id === id) ?? null;
    return {
      fromCheckin: named !== null,
      checkinId: id,
      pose: isPose(params.pose) ? params.pose : (nextMissingPose(entry) ?? 'front'),
      mode: (params.mode === 'video' ? 'video' : 'photo') as Mode,
    };
  });
  const [checkinId, setCheckinId] = useState(opened.checkinId);
  const [pose, setPose] = useState<ProgressPose>(opened.pose);
  const [mode, setMode] = useState<Mode>(opened.mode);
  const [facing, setFacing] = useState<CameraType>(lastFacing);
  const [timer, setTimer] = useState<TimerSeconds>(lastTimer);
  const [grid, setGrid] = useState(lastLook.grid);
  const [ghostShown, setGhostShown] = useState(lastLook.ghost);
  const [ghostOpacity, setGhostOpacity] = useState(lastLook.ghostOpacity);
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordingSince, setRecordingSince] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [shooting, setShooting] = useState(false);
  const [review, setReview] = useState<CaptureReview | null>(null);
  const [saving, setSaving] = useState(false);
  const [frame, setFrame] = useState<{ width: number; height: number } | null>(null);

  // The countdown and the recording clock, cleared if the screen goes first.
  const timers = useRef<{
    countdown: ReturnType<typeof setTimeout> | null;
    clock: ReturnType<typeof setInterval> | null;
  }>({ countdown: null, clock: null });
  useEffect(() => {
    const live = timers.current;
    return () => {
      if (live.countdown) clearTimeout(live.countdown);
      if (live.clock) clearInterval(live.clock);
    };
  }, []);

  // Ask for the camera on arrival, once; a refusal leaves the card's button.
  const asked = useRef(false);
  useEffect(() => {
    if (!permission || permission.granted || !permission.canAskAgain || asked.current) return;
    asked.current = true;
    void keepUnlockedWhile(requestPermission);
  }, [permission, requestPermission]);

  if (!user) return <Redirect href="/progress" />;

  const entry = entries.find((e) => e.checkin.id === checkinId) ?? null;
  const done = new Set(entry?.photos.flatMap((p) => (p.pose ? [p.pose] : [])) ?? []);
  const ghost =
    mode === 'photo'
      ? ghostFor(entries, pose, { id: checkinId, date: entry?.checkin.date ?? today })
      : null;
  const recording = recordingSince !== null;
  const busy = countdown !== null || recording || shooting || saving;
  // Mid-sentence: "your first left side photo".
  const poseWord = t(poseLabelKey(pose)).toLocaleLowerCase();
  // Something is already in this check-in: Done opens it.
  const doneId = entry && entry.photos.length + entry.videos.length > 0 ? entry.checkin.id : null;

  const finish = (id: string | null) => {
    if (opened.fromCheckin || !id) router.back();
    else router.replace({ pathname: '/progress/checkin/[id]', params: { id } });
  };

  const takePhoto = async () => {
    const cam = camera.current;
    if (!cam) return;
    setShooting(true);
    try {
      const shot = await cam.takePictureAsync({ quality: 0.92 });
      if (shot?.uri) setReview({ kind: 'photo', uri: shot.uri });
    } catch (e) {
      captureError(e);
      toast.error(t('capture.shotFailed'));
    } finally {
      setShooting(false);
    }
  };

  const record = async () => {
    const cam = camera.current;
    if (!cam) return;
    const startedAt = Date.now();
    setRecordingSince(startedAt);
    setElapsedMs(0);
    timers.current.clock = setInterval(() => setElapsedMs(Date.now() - startedAt), 250);
    try {
      const clip = await cam.recordAsync({ maxDuration: CLIP_MAX_S });
      if (clip?.uri) {
        setReview({ kind: 'video', uri: clip.uri, durationMs: recordedMs(startedAt, Date.now()) });
      }
    } catch (e) {
      captureError(e);
      toast.error(t('capture.shotFailed'));
    } finally {
      if (timers.current.clock) clearInterval(timers.current.clock);
      timers.current.clock = null;
      setRecordingSince(null);
    }
  };

  const capture = () => void (mode === 'photo' ? takePhoto() : record());

  const tick = (left: number) => {
    if (left <= 0) {
      timers.current.countdown = null;
      setCountdown(null);
      capture();
      return;
    }
    setCountdown(left);
    playSound('timerTick');
    haptic('tick');
    AccessibilityInfo.announceForAccessibility(String(left));
    timers.current.countdown = setTimeout(() => tick(left - 1), 1000);
  };

  const cancelCountdown = () => {
    if (timers.current.countdown) clearTimeout(timers.current.countdown);
    timers.current.countdown = null;
    setCountdown(null);
  };

  const onShutter = () => {
    if (recording) {
      camera.current?.stopRecording();
      return;
    }
    if (busy || review) return;
    if (timer > 0) tick(timer);
    else capture();
  };

  const fromGallery = async () => {
    if (busy) return;
    try {
      if (mode === 'photo') {
        const uri = await pickFromLibrary();
        if (uri) setReview({ kind: 'photo', uri });
        return;
      }
      const clip = await pickClipFromLibrary();
      if (!clip) return;
      if (clip.durationMs != null && clip.durationMs > CLIP_IMPORT_MAX_MS) {
        toast.error(t('capture.clipTooLong'));
        return;
      }
      setReview({ kind: 'video', uri: clip.uri, durationMs: clip.durationMs });
    } catch (e) {
      captureError(e);
      toast.error(t('capture.shotFailed'));
    }
  };

  const onUse = async () => {
    if (!review || saving) return;
    setSaving(true);
    try {
      // The check-in the shots go into, else today's new one — created by the
      // first save itself, so a save that fails leaves nothing behind.
      const into = checkinId && getCheckin(checkinId, user.id) ? checkinId : null;
      const saved = await addMedia(user.id, {
        ...(into ? { checkinId: into } : { checkinId: null, date: today }),
        kind: review.kind,
        // A clip is a posing round or a set, not one of the five poses.
        pose: review.kind === 'photo' ? pose : null,
        srcUri: review.uri,
        durationMs: review.kind === 'video' ? review.durationMs : null,
      });
      const id = saved.checkinId ?? into;
      setCheckinId(id);
      haptic('confirm');
      setReview(null);
      if (review.kind === 'video') {
        finish(id);
        return;
      }
      const next = poseAfterSave(done, pose);
      if (next) {
        setPose(next);
        return;
      }
      toast.success(t('capture.checkinDone'));
      finish(id);
    } catch (e) {
      captureError(e);
      toast.error(t('capture.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const onArea = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    const w = Math.floor(Math.min(width, (height * 3) / 4));
    const next = { width: w, height: Math.floor((w * 4) / 3) };
    setFrame((prev) =>
      prev && prev.width === next.width && prev.height === next.height ? prev : next,
    );
  };

  const modes: Segment<Mode>[] = [
    { value: 'photo', label: t('capture.modePhoto') },
    { value: 'video', label: t('capture.modeClip') },
  ];

  // The line under the frame: the ghost's strength while lining up, else what to know.
  const hint = (() => {
    if (review) {
      return review.kind === 'photo' && done.has(pose)
        ? t('capture.retakeHint', { pose: poseWord })
        : null;
    }
    if (mode === 'video') return t('capture.clipHint');
    if (!ghost) return t('capture.ghostFirst', { pose: poseWord });
    return ghostShown ? null : t('capture.ghostHidden');
  })();
  const showSlider = !review && mode === 'photo' && ghost !== null && ghostShown;

  return (
    <View className="flex-1 bg-ink-950" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center justify-between px-4">
        <IconButton
          icon={<XIcon color={light} size={18} />}
          onPress={() => router.back()}
          accessibilityLabel={t('capture.close')}
          disabled={recording}
        />
        <View className="flex-row items-center gap-3">
          <CaptureTimerButton
            seconds={timer}
            disabled={busy || review !== null}
            onPress={() => {
              const next = nextTimer(timer);
              lastTimer = next;
              haptic('tick');
              setTimer(next);
            }}
          />
          <IconButton
            icon={<GridIcon color={grid ? brand : muted} size={17} />}
            onPress={() => {
              lastLook.grid = !grid;
              haptic(grid ? 'toggleOff' : 'toggleOn');
              setGrid(!grid);
            }}
            accessibilityLabel={t(grid ? 'capture.gridOn' : 'capture.gridOff')}
          />
          {mode === 'photo' && ghost ? (
            <IconButton
              icon={
                ghostShown ? (
                  <EyeIcon color={brand} size={17} />
                ) : (
                  <EyeOffIcon color={muted} size={17} />
                )
              }
              onPress={() => {
                lastLook.ghost = !ghostShown;
                haptic(ghostShown ? 'toggleOff' : 'toggleOn');
                setGhostShown(!ghostShown);
              }}
              accessibilityLabel={t(ghostShown ? 'capture.ghostOn' : 'capture.ghostOff')}
            />
          ) : null}
          {doneId ? (
            <Button
              size="sm"
              variant="brandSoft"
              fullWidth={false}
              label={t('capture.done')}
              disabled={busy}
              onPress={() => finish(doneId)}
            />
          ) : null}
        </View>
      </View>

      {mode === 'photo' ? (
        <View className="mt-3 px-4">
          <CapturePoseStrip
            current={pose}
            done={done}
            disabled={busy || review !== null}
            onPick={setPose}
          />
        </View>
      ) : null}

      {/* Measured INSIDE the side margins: a padded box reports its padding as
          room, and the frame came out wider than the screen allows. */}
      <View className="mt-3 flex-1 px-3">
        <View className="flex-1 items-center justify-center" onLayout={onArea}>
          {frame ? (
            <CaptureFrame
              size={frame}
              cameraRef={camera}
              permission={permission}
              requestPermission={requestPermission}
              facing={facing}
              mode={mode}
              ghostUri={ghost && ghostShown ? mediaUri(ghost.uri) : null}
              ghostOpacity={ghostOpacity}
              grid={grid}
              countdown={countdown}
              onCancelCountdown={cancelCountdown}
              recordingLabel={recording ? recordingText(elapsedMs) : null}
              review={review}
              onReady={() => setReady(true)}
              onMountError={() => toast.error(t('capture.shotFailed'))}
            />
          ) : null}
        </View>
      </View>

      <View className="px-5" style={{ paddingBottom: insets.bottom + 12 }}>
        <View className="min-h-11 justify-center">
          {showSlider ? (
            <Slider
              value={ghostOpacity}
              onChange={(v) => {
                lastLook.ghostOpacity = v;
                setGhostOpacity(v);
              }}
              accessibilityLabel={t('capture.ghostOpacity')}
              valueText={(v) => t('compare.percent', { n: Math.round(v * 100) })}
            />
          ) : hint ? (
            <Text numberOfLines={2} className="text-center text-xs leading-5 text-ink-300">
              {hint}
            </Text>
          ) : null}
        </View>

        <View className="mt-2">
          <SegmentedControl
            size="sm"
            segments={modes}
            value={mode}
            onChange={setMode}
            disabled={busy || review !== null}
          />
        </View>

        {review ? (
          <View className="mt-4 min-h-[72px] flex-row items-center gap-3">
            <View className="flex-1">
              <Button
                label={t('capture.retake')}
                variant="secondary"
                disabled={saving}
                onPress={() => setReview(null)}
              />
            </View>
            <View className="flex-1">
              <Button
                label={t(review.kind === 'photo' ? 'capture.use' : 'capture.useClip')}
                variant="brand"
                loading={saving}
                onPress={() => void onUse()}
              />
            </View>
          </View>
        ) : (
          <View className="mt-4 flex-row items-center justify-between px-6">
            <IconButton
              icon={<GalleryIcon color={light} size={18} />}
              onPress={() => void fromGallery()}
              accessibilityLabel={t(mode === 'photo' ? 'capture.gallery' : 'capture.galleryClip')}
              disabled={busy}
            />
            <CaptureShutter
              mode={mode}
              recording={recording}
              disabled={!permission?.granted || !ready || (busy && !recording)}
              onPress={onShutter}
              accessibilityLabel={
                mode === 'photo'
                  ? t('capture.shutter', { pose: poseWord })
                  : t(recording ? 'capture.stop' : 'capture.record')
              }
            />
            <IconButton
              icon={<FlipCameraIcon color={light} size={18} />}
              onPress={() => {
                const next = facing === 'front' ? 'back' : 'front';
                lastFacing = next;
                setFacing(next);
              }}
              accessibilityLabel={t('capture.flip')}
              disabled={busy}
            />
          </View>
        )}
      </View>
    </View>
  );
};

/** Behind the private-section lock: the ghost is an earlier progress photo. */
const Capture = () => (
  <LockGate section="photos">
    <CaptureContent />
  </LockGate>
);

export default Capture;
