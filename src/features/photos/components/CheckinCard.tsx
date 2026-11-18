import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { Card, PressableScale, ScrollRow } from '@/components/ui';
import type { ProgressPhoto, ProgressPose } from '@/db/schema';
import { siteLabelKey, type SiteId } from '@/features/body/sites';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';
import { useDateFormat } from '@/lib/useDateFormat';
import { useTheme } from '@/theme/theme-context';

import { photoForPose, poseLabelKey, POSES, type TimelineFilter } from '../checkins';
import { avgWeightText, mediaLabel, phaseLine, siteText } from '../format';
import type { ProgressEntry } from '../useProgressLog';
import { MediaThumb } from './MediaThumb';
import { PoseSlot } from './PoseSlot';

type Props = {
  entry: ProgressEntry;
  filter: TimelineFilter;
  keySite: SiteId;
  units: Units;
  onOpen: (checkinId: string) => void;
  onOpenMedia: (mediaId: string) => void;
  onAddPose: (checkinId: string, pose: ProgressPose) => void;
};

/**
 * One check-in on the timeline: its date, the phase week and what the body
 * log said that week, then what it holds for the filter in force — every pose
 * slot in capture order (an empty one opens the camera on it) with photos that
 * have no pose and the clips under them, ONE pose large beside the numbers, or
 * only the clips. The header opens the check-in, a thumbnail opens that photo
 * or clip.
 */
export const CheckinCard = ({
  entry,
  filter,
  keySite,
  units,
  onOpen,
  onOpenMedia,
  onAddPose,
}: Props) => {
  const t = useT();
  const { dateKey } = useDateFormat();
  const { muted } = useTheme();
  const { checkin, stats } = entry;
  const date = dateKey(checkin.date);
  const phase = phaseLine(t, stats);
  const avg = avgWeightText(stats, units);
  const site = siteText(stats.siteCm, units);
  const pills = [
    avg ? t('photos.weekAvg', { value: avg }) : null,
    site ? `${t(siteLabelKey(keySite))} ${site}` : null,
  ].filter((p): p is string => p !== null);

  // Under the pose slots: photos from before poses existed, then the clips.
  const extras =
    filter === 'video' ? entry.videos : [...entry.photos.filter((p) => !p.pose), ...entry.videos];

  const open = () => onOpen(checkin.id);

  const facts = (
    <>
      <Text
        numberOfLines={1}
        className="text-base font-sans-semibold text-ink-50"
        accessibilityRole="header"
      >
        {date}
      </Text>
      {phase ? (
        <Text numberOfLines={1} className="mt-0.5 text-xs text-ink-400">
          {phase}
        </Text>
      ) : null}
      {pills.length ? (
        <View className="mt-2 flex-row gap-1.5">
          {pills.map((pill) => (
            <View
              key={pill}
              className="min-w-0 shrink rounded-full border border-ink-700 bg-ink-900 px-2 py-0.5"
            >
              <Text numberOfLines={1} className="font-mono-medium text-[11px] text-ink-200">
                {pill}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );

  // An untagged photo or a clip in the strip under the slots.
  const extraThumb = (m: ProgressPhoto, width: string) => (
    <Pressable
      key={m.id}
      onPress={() => onOpenMedia(m.id)}
      accessibilityRole="button"
      accessibilityLabel={mediaLabel(t, m)}
      className={width}
    >
      <MediaThumb media={m} />
    </Pressable>
  );

  if (filter !== 'all' && filter !== 'video') {
    const photo = photoForPose(entry, filter);
    return (
      <Card padded={false} className="mb-3 flex-row items-center gap-4 p-3">
        {photo ? (
          <Pressable
            onPress={() => onOpenMedia(photo.id)}
            accessibilityRole="button"
            accessibilityLabel={mediaLabel(t, photo)}
            className="w-28"
          >
            <MediaThumb media={photo} />
          </Pressable>
        ) : null}
        <PressableScale
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel={t('photos.openCheckin', { date })}
          className="min-w-0 flex-1 flex-row items-center"
        >
          <View className="min-w-0 flex-1 pr-2">{facts}</View>
          <ChevronRightIcon color={muted} size={18} />
        </PressableScale>
      </Card>
    );
  }

  return (
    <Card padded={false} className="mb-3 p-4">
      <PressableScale
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={t('photos.openCheckin', { date })}
        className="min-h-11 flex-row items-center"
      >
        <View className="min-w-0 flex-1 pr-2">{facts}</View>
        <ChevronRightIcon color={muted} size={18} />
      </PressableScale>

      {filter === 'all' ? (
        <View className="mt-3 flex-row gap-1.5">
          {POSES.map((pose) => {
            const photo = photoForPose(entry, pose);
            return photo ? (
              <Pressable
                key={pose}
                onPress={() => onOpenMedia(photo.id)}
                accessibilityRole="button"
                accessibilityLabel={mediaLabel(t, photo)}
                className="flex-1"
              >
                <MediaThumb media={photo} />
              </Pressable>
            ) : (
              <Pressable
                key={pose}
                onPress={() => onAddPose(checkin.id, pose)}
                accessibilityRole="button"
                accessibilityLabel={t('photos.addPose', { pose: t(poseLabelKey(pose)) })}
                className="flex-1"
              >
                <PoseSlot />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {extras.length ? (
        <View className="mt-3">
          <ScrollRow cues={false} className="gap-1.5">
            {extras.map((m) => extraThumb(m, filter === 'video' ? 'w-20' : 'w-16'))}
          </ScrollRow>
        </View>
      ) : null}
    </Card>
  );
};
