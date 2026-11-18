import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { ShareIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  ChipRow,
  Screen,
  SegmentedControl,
  Slider,
  type ChipItem,
  type Segment,
} from '@/components/ui';
import type { MediaAlign, ProgressPhoto, ProgressPose } from '@/db/schema';
import { LockGate } from '@/features/app-lock/LockGate';
import { useAuth } from '@/features/auth/auth-context';
import {
  commonestPose,
  comparable,
  isPose,
  photoForPose,
  poseLabelKey,
  POSES,
} from '@/features/photos/checkins';
import { AlignedPhoto } from '@/features/photos/components/AlignedPhoto';
import { CompareCaption } from '@/features/photos/components/CompareCaption';
import { CompareDeltas } from '@/features/photos/components/CompareDeltas';
import { ComparePicker } from '@/features/photos/components/ComparePicker';
import { CompareWipe } from '@/features/photos/components/CompareWipe';
import { mediaUri } from '@/features/photos/media';
import { setMediaAlign } from '@/features/photos/photos.repo';
import { MAX_PANELS, spreadPicks } from '@/features/photos/share-model';
import { compareDelta } from '@/features/photos/stats';
import { useProgressLog, type ProgressEntry } from '@/features/photos/useProgressLog';
import { useT } from '@/i18n';
import { useUnits } from '@/lib/useUnits';
import { useTheme } from '@/theme/theme-context';

type Mode = 'side' | 'slider' | 'fade' | 'grid';
const MODES: Mode[] = ['side', 'slider', 'fade', 'grid'];
type Slot = 'before' | 'after';

/** The screen's side padding (px-5) and the gaps between photos. */
const INSET = 40;
const GAP = 12;
const GRID_GAP = 8;
/** One photo never takes more than this share of the screen's height. */
const MAX_STAGE_HEIGHT = 0.6;

const CompareContent = () => {
  const { user } = useAuth();
  const t = useT();
  const router = useRouter();
  const { units } = useUnits();
  const { brandContrast } = useTheme();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const params = useLocalSearchParams<{ a?: string; b?: string; pose?: string }>();
  const { entries, keySite } = useProgressLog(user?.id ?? '', user?.sex ?? null);

  const [poseChoice, setPoseChoice] = useState<ProgressPose | null>(
    isPose(params.pose) ? params.pose : null,
  );
  const [mode, setMode] = useState<Mode>('side');
  const [picks, setPicks] = useState<{ before: string | null; after: string | null }>({
    before: params.a ?? null,
    after: params.b ?? null,
  });
  const [slot, setSlot] = useState<Slot>('before');
  const [gridIds, setGridIds] = useState<string[] | null>(null);
  const [fade, setFade] = useState(0.5);
  const [aligning, setAligning] = useState(false);

  if (!user) return <Redirect href="/progress" />;

  // Only poses two check-ins share can be compared; open on the asked one, else the commonest.
  const poses = POSES.filter((p) => comparable(entries, p).length >= 2);
  const commonest = commonestPose(entries);
  const pose =
    poseChoice && poses.includes(poseChoice)
      ? poseChoice
      : poses.includes(commonest)
        ? commonest
        : (poses[0] ?? null);

  if (!pose) {
    return (
      <Screen
        scroll
        contentClassName="px-5 pb-10"
        header={<TopBar showBack showAvatar={false} title={t('photos.compare')} />}
      >
        <Card>
          <Text className="text-sm text-ink-300">{t('compare.needTwo')}</Text>
        </Card>
      </Screen>
    );
  }

  const list = comparable(entries, pose);
  const find = (id: string | null) => list.find((e) => e.checkin.id === id);
  const before = find(picks.before) ?? list[0];
  const pickedAfter = find(picks.after);
  const after =
    pickedAfter && pickedAfter !== before
      ? pickedAfter
      : (list.filter((e) => e !== before).at(-1) ?? list[list.length - 1]);
  const gridPicked = gridIds ? list.filter((e) => gridIds.includes(e.checkin.id)) : [];
  const grid = gridPicked.length ? gridPicked : spreadPicks(list);

  const photo = (entry: ProgressEntry): ProgressPhoto => photoForPose(entry, pose) as ProgressPhoto;
  const ends = mode === 'grid' ? [grid[0], grid[grid.length - 1]] : [before, after];
  // Chronological, whichever slot the lifter filled first.
  const [first, last] = [...ends].sort((a, b) => (a.checkin.date < b.checkin.date ? -1 : 1));
  const delta = compareDelta(
    { date: first.checkin.date, stats: first.stats },
    { date: last.checkin.date, stats: last.stats },
  );

  const beforeLetter = t('photos.before').charAt(0).toUpperCase();
  const afterLetter = t('photos.after').charAt(0).toUpperCase();
  const marks = new Map<string, string>(
    mode === 'grid'
      ? grid.map((e, i) => [e.checkin.id, `${i + 1}`])
      : [
          [before.checkin.id, beforeLetter],
          [after.checkin.id, afterLetter],
        ],
  );

  const pick = (id: string) => {
    if (mode === 'grid') {
      const current = grid.map((e) => e.checkin.id);
      if (current.includes(id)) {
        if (current.length > 1) setGridIds(current.filter((c) => c !== id));
      } else if (current.length < MAX_PANELS) {
        setGridIds([...current, id]);
      }
      return;
    }
    // Picking the other side's check-in swaps the two.
    const b = before.checkin.id;
    const a = after.checkin.id;
    setPicks(
      slot === 'before'
        ? { before: id, after: id === a ? b : a }
        : { before: id === b ? a : b, after: id },
    );
    setSlot(slot === 'before' ? 'after' : 'before');
  };

  const saveAlign = (media: ProgressPhoto) => (align: MediaAlign | null) =>
    setMediaAlign(media.id, user.id, align);
  const resetAlign = () => {
    for (const entry of [before, after]) setMediaAlign(photo(entry).id, user.id, null);
  };

  const stageW = screenW - INSET;
  const frameW = Math.min(stageW, (screenH * MAX_STAGE_HEIGHT * 3) / 4);
  const sideW = Math.min((stageW - GAP) / 2, frameW);
  const gridW = (stageW - GRID_GAP) / 2;
  const canAlign = mode === 'side' || mode === 'fade';

  const share = () => {
    const ids = (mode === 'grid' ? grid : [first, last]).map((e) => e.checkin.id);
    router.push({ pathname: '/progress/share', params: { ids: ids.join(','), pose } });
  };

  const poseItems: ChipItem<ProgressPose>[] = poses.map((p) => ({
    value: p,
    label: t(poseLabelKey(p)),
  }));
  const modeSegments: Segment<Mode>[] = MODES.map((m) => ({
    value: m,
    label: t(`compare.mode.${m}`),
  }));
  const slotSegments: Segment<Slot>[] = [
    { value: 'before', label: t('photos.before') },
    { value: 'after', label: t('photos.after') },
  ];

  const stage = () => {
    switch (mode) {
      case 'side':
        return (
          <View className="flex-row justify-center" style={{ gap: GAP }}>
            {[
              { entry: before, side: t('photos.before') },
              { entry: after, side: t('photos.after') },
            ].map(({ entry, side }) => {
              const media = photo(entry);
              return (
                <View key={side} style={{ width: sideW }}>
                  <AlignedPhoto
                    uri={mediaUri(media.uri)}
                    image={media}
                    align={media.align}
                    width={sideW}
                    editable={aligning}
                    onAlignEnd={saveAlign(media)}
                    className={`rounded-card ${aligning ? 'border-2 border-dashed border-brand' : ''}`}
                  />
                  <CompareCaption side={side} entry={entry} units={units} />
                </View>
              );
            })}
          </View>
        );
      case 'slider':
        return (
          <View className="items-center">
            <CompareWipe before={photo(before)} after={photo(after)} width={frameW} />
          </View>
        );
      case 'fade': {
        const under = photo(before);
        const over = photo(after);
        return (
          <View className="items-center">
            <View style={{ width: frameW }} className="overflow-hidden rounded-card">
              <AlignedPhoto
                uri={mediaUri(under.uri)}
                image={under}
                align={under.align}
                width={frameW}
              />
              <View style={{ position: 'absolute', left: 0, top: 0 }}>
                <AlignedPhoto
                  uri={mediaUri(over.uri)}
                  image={over}
                  align={over.align}
                  width={frameW}
                  opacity={fade}
                  editable={aligning}
                  onAlignEnd={saveAlign(over)}
                />
              </View>
            </View>
            <View style={{ width: frameW }} className="mt-2">
              <Slider
                value={fade}
                onChange={setFade}
                accessibilityLabel={t('compare.blend')}
                valueText={(v) => t('compare.percent', { n: Math.round(v * 100) })}
              />
              <View className="flex-row justify-between">
                <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
                  {t('photos.before')}
                </Text>
                <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
                  {t('photos.after')}
                </Text>
              </View>
            </View>
          </View>
        );
      }
      case 'grid':
        return (
          <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
            {grid.map((entry, i) => {
              const media = photo(entry);
              return (
                <View key={entry.checkin.id} style={{ width: gridW }}>
                  <AlignedPhoto
                    uri={mediaUri(media.uri)}
                    image={media}
                    align={media.align}
                    width={gridW}
                    className="rounded-card"
                  />
                  <CompareCaption side={`${i + 1}`} entry={entry} units={units} />
                </View>
              );
            })}
          </View>
        );
    }
  };

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-10"
      header={<TopBar showBack showAvatar={false} title={t('photos.compare')} />}
    >
      <View className="gap-3">
        <ChipRow items={poseItems} value={pose} onChange={setPoseChoice} />
        <SegmentedControl
          segments={modeSegments}
          value={mode}
          onChange={(next) => {
            setMode(next);
            setAligning(false);
          }}
        />
      </View>

      <View className="mt-4">{stage()}</View>

      {canAlign ? (
        <View className="mt-3">
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                size="sm"
                variant={aligning ? 'brand' : 'secondary'}
                label={aligning ? t('compare.alignDone') : t('compare.align')}
                onPress={() => setAligning((on) => !on)}
              />
            </View>
            {aligning ? (
              <View className="flex-1">
                <Button size="sm" variant="ghost" label={t('compare.reset')} onPress={resetAlign} />
              </View>
            ) : null}
          </View>
          {aligning ? (
            <Text className="mt-2 text-sm text-ink-400">{t('compare.alignHint')}</Text>
          ) : null}
        </View>
      ) : null}

      <View className="mt-4">
        <CompareDeltas delta={delta} keySite={keySite} units={units} />
      </View>

      <View className="mt-5 gap-2">
        {mode === 'grid' ? (
          <Text className="text-sm text-ink-400">{t('compare.pickGrid')}</Text>
        ) : (
          <>
            <SegmentedControl size="sm" segments={slotSegments} value={slot} onChange={setSlot} />
            <Text className="text-sm text-ink-400">{t('compare.pickSlot')}</Text>
          </>
        )}
        <ComparePicker entries={list} pose={pose} marks={marks} onPick={pick} />
      </View>

      <View className="mt-6">
        <Button
          variant="brand"
          label={t('share.action')}
          leftIcon={<ShareIcon color={brandContrast} size={18} />}
          onPress={share}
        />
      </View>
    </Screen>
  );
};

/** Behind the private-section lock when the lifter turned it on (`features/app-lock`). */
const Compare = () => (
  <LockGate section="photos">
    <CompareContent />
  </LockGate>
);

export default Compare;
