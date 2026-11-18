import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ControlledInput, useSaveForm } from '@/components/form';
import { CameraIcon, ChevronDownIcon, ChevronRightIcon, VideoIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  DatePicker,
  HoldButton,
  Screen,
  SectionLabel,
  Stat,
  useToast,
  useUnsavedGuard,
} from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import type { ProgressPose } from '@/db/schema';
import { LockGate } from '@/features/app-lock/LockGate';
import { useAuth } from '@/features/auth/auth-context';
import { siteLabelKey, type SiteId } from '@/features/body/sites';
import { fromCm, lengthUnitFor } from '@/features/body/units';
import { daysBetween } from '@/features/body/weekly';
import { photoForPose, POSES, nextMissingPose } from '@/features/photos/checkins';
import { MediaRow } from '@/features/photos/components/MediaRow';
import { PoseGrid } from '@/features/photos/components/PoseGrid';
import { avgWeightValue, phaseLine } from '@/features/photos/format';
import { deleteCheckin, updateCheckin } from '@/features/photos/photos.repo';
import { useProgressLog, type ProgressEntry } from '@/features/photos/useProgressLog';
import { dateFromKey, localDateKey } from '@/features/training/dates';
import { useT } from '@/i18n';
import { useDateFormat } from '@/lib/useDateFormat';
import { useUnits } from '@/lib/useUnits';
import { useTheme } from '@/theme/theme-context';

/** The newest earlier check-in sharing a pose with this one, and that pose (POSES order). */
const previousComparable = (
  entries: readonly ProgressEntry[],
  index: number,
): { id: string; pose: ProgressPose } | null => {
  const entry = entries[index];
  for (const older of entries.slice(index + 1)) {
    const pose = POSES.find((p) => photoForPose(entry, p) && photoForPose(older, p));
    if (pose) return { id: older.checkin.id, pose };
  }
  return null;
};

type ScreenProps = {
  entry: ProgressEntry;
  entries: ProgressEntry[];
  keySite: SiteId;
  /** The check-in was deleted: the parent leaves once this screen is gone. */
  onDeleted: () => void;
};

const CheckinScreen = ({ entry, entries, keySite, onDeleted }: ScreenProps) => {
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const { muted, brand } = useTheme();
  const { user } = useAuth();
  const { dateKey } = useDateFormat();
  const { units } = useUnits();
  const userId = user?.id ?? '';
  const { checkin, stats } = entry;
  const [editingDate, setEditingDate] = useState(false);

  const form = useSaveForm<{ note: string }>({
    defaultValues: { note: checkin.note ?? '' },
    normalize: (v) => ({ note: v.note.trim() }),
    onSave: ({ note }) => {
      updateCheckin(checkin.id, userId, { note: note || null });
      toast.success(t('photos.noteSaved'));
    },
  });
  useUnsavedGuard({ dirty: form.isDirty, onSave: form.saveNow });

  const index = entries.indexOf(entry);
  const previous = entries[index + 1] ?? null;
  const compareTo = previousComparable(entries, index);
  const sharePose = entry.photos.find((p) => p.pose)?.pose ?? null;
  const missing = POSES.filter((pose) => !photoForPose(entry, pose));
  const untagged = entry.photos.filter((p) => !p.pose);

  const openMedia = (id: string) => router.push({ pathname: '/progress/[id]', params: { id } });
  const capture = (params: { pose?: ProgressPose; mode?: 'video' }) =>
    router.push({ pathname: '/progress/capture', params: { checkin: checkin.id, ...params } });

  const avg = avgWeightValue(stats, units) ?? '—';
  const site = stats.siteCm == null ? '—' : `${fromCm(stats.siteCm, units)}`;
  const since = previous ? daysBetween(previous.checkin.date, checkin.date) : null;

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-10"
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={dateKey(checkin.date)}
          subtitle={phaseLine(t, stats) ?? undefined}
        />
      }
    >
      <Card className="flex-row gap-3">
        <Stat
          label={t('photos.statAvg')}
          value={avg}
          unit={stats.avgKg == null ? undefined : units}
        />
        <Stat
          label={t(siteLabelKey(keySite))}
          value={site}
          unit={stats.siteCm == null ? undefined : lengthUnitFor(units)}
        />
        <Stat
          label={t('photos.statSince')}
          value={since == null ? '—' : `${since}`}
          unit={since == null ? undefined : t('photos.daysUnit')}
        />
      </Card>

      <SectionLabel label={t('photos.poses')} hint={t('photos.posesHint')} className="mt-6" />
      <PoseGrid entry={entry} onOpen={openMedia} onTake={(pose) => capture({ pose })} />
      {missing.length ? (
        <View className="mt-4">
          <Button
            variant="brandSoft"
            label={t('photos.takeMissing', { n: missing.length })}
            leftIcon={<CameraIcon color={brand} size={18} />}
            onPress={() => capture({ pose: nextMissingPose(entry) ?? undefined })}
          />
        </View>
      ) : null}

      {untagged.length ? (
        <>
          <SectionLabel
            label={t('photos.otherPhotos')}
            hint={t('photos.otherHint')}
            className="mt-6"
          />
          <MediaRow items={untagged} onOpen={openMedia} />
        </>
      ) : null}

      <SectionLabel label={t('photos.clips')} hint={t('photos.clipsHint')} className="mt-6" />
      {entry.videos.length ? <MediaRow items={entry.videos} onOpen={openMedia} /> : null}
      <View className={entry.videos.length ? 'mt-3' : ''}>
        <Button
          variant="secondary"
          label={t('photos.recordClip')}
          leftIcon={<VideoIcon color={muted} size={18} />}
          onPress={() => capture({ mode: 'video' })}
        />
      </View>

      <Pressable
        onPress={() => setEditingDate((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: editingDate }}
        className="mt-6"
      >
        <Card className="min-h-11 flex-row items-center justify-between gap-3">
          <Text maxFontSizeMultiplier={CONTROL_FONT_SCALE} className="text-sm text-ink-400">
            {t('photos.date')}
          </Text>
          <View className="min-w-0 shrink flex-row items-center gap-1">
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={CONTROL_FONT_SCALE}
              className="shrink text-base font-sans-semibold text-ink-50"
            >
              {dateKey(checkin.date)}
            </Text>
            {editingDate ? (
              <ChevronDownIcon color={muted} size={18} />
            ) : (
              <ChevronRightIcon color={muted} size={18} />
            )}
          </View>
        </Card>
      </Pressable>
      {editingDate ? (
        <View className="mt-2">
          <DatePicker
            value={dateFromKey(checkin.date)}
            onChange={(d) => updateCheckin(checkin.id, userId, { date: localDateKey(d) })}
          />
        </View>
      ) : null}

      <View className="mt-6">
        <ControlledInput
          control={form.control}
          name="note"
          label={t('photos.note')}
          placeholder={t('photos.notePlaceholder')}
          multiline
          maxLength={280}
        />
        <View className="mt-3">
          <Button
            variant="secondary"
            label={t('common.saveChanges')}
            disabled={!form.canSave}
            onPress={() => form.submit()}
          />
        </View>
      </View>

      <View className="mt-8 gap-3">
        {compareTo ? (
          <Button
            variant="outline"
            label={t('photos.compareWithPrevious')}
            onPress={() =>
              router.push({
                pathname: '/progress/compare',
                params: { a: compareTo.id, b: checkin.id, pose: compareTo.pose },
              })
            }
          />
        ) : null}
        {sharePose ? (
          <Button
            variant="brand"
            label={t('photos.makeCard')}
            onPress={() =>
              router.push({
                pathname: '/progress/share',
                params: { ids: checkin.id, pose: sharePose },
              })
            }
          />
        ) : null}
        <HoldButton
          variant="danger"
          label={t('photos.deleteCheckin')}
          onComplete={() => {
            deleteCheckin(checkin.id, userId);
            toast.success(t('photos.checkinDeleted'));
            onDeleted();
          }}
        />
      </View>
    </Screen>
  );
};

const CheckinContent = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { entries, keySite } = useProgressLog(user?.id ?? '', user?.sex ?? null);
  // A deep-linkable route: the entries are the signed-in user's own, so an id
  // from another account on a shared device finds nothing.
  const entry = entries.find((e) => e.checkin.id === id) ?? null;
  // Deleted here: draw nothing, then go back once the screen (and its unsaved-note
  // guard) is gone — a back in the same tick was held by the guard, and the
  // "gone" redirect below would have navigated a second time.
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (leaving) router.back();
  }, [leaving, router]);

  if (!user) return <Redirect href="/" />;
  if (leaving) return null;
  // Gone with its last photo (deleted from the viewer).
  if (!entry) return <Redirect href="/progress" />;
  // Keyed: the note form reads its baseline once, per check-in.
  return (
    <CheckinScreen
      key={entry.checkin.id}
      entry={entry}
      entries={entries}
      keySite={keySite}
      onDeleted={() => setLeaving(true)}
    />
  );
};

/** Behind the private-section lock when the lifter turned it on (`features/app-lock`). */
const CheckinDetail = () => (
  <LockGate section="photos">
    <CheckinContent />
  </LockGate>
);

export default CheckinDetail;
