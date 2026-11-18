import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { ShareIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  Screen,
  SegmentedControl,
  Slider,
  useToast,
  type Segment,
} from '@/components/ui';
import { keepUnlockedWhile } from '@/features/app-lock/lock';
import { LockGate } from '@/features/app-lock/LockGate';
import { useAuth } from '@/features/auth/auth-context';
import { siteLabelKey } from '@/features/body/sites';
import { isPose } from '@/features/photos/checkins';
import {
  CARD_WIDTH,
  ProgressShareCard,
  type ShareStyle,
} from '@/features/photos/components/ProgressShareCard';
import { ShareToggle } from '@/features/photos/components/ShareToggle';
import {
  FORMAT_RATIO,
  progressShareModel,
  type ShareFormat,
  type ShareStatsMode,
} from '@/features/photos/share-model';
import { useProgressLog } from '@/features/photos/useProgressLog';
import { dateFromKey } from '@/features/training/dates';
import { useT } from '@/i18n';
import { useDateFormat } from '@/lib/useDateFormat';
import { useShareCard } from '@/lib/useShareCard';
import { useUnits } from '@/lib/useUnits';
import { useTheme } from '@/theme/theme-context';

/** Every card leaves 1080 px wide, whatever the phone's density. */
const OUTPUT_WIDTH = 1080;
/** The preview never takes more than this share of the screen's height. */
const PREVIEW_HEIGHT = 0.55;
const INSET = 40;
/** The face band's range, as a fraction of each photo's height. */
const BAND_MIN = 0.1;
const BAND_MAX = 0.5;

const FORMATS: ShareFormat[] = ['story', 'post', 'square'];
const LOOKS: ShareStyle[] = ['frame', 'clean'];
const STATS: ShareStatsMode[] = ['changes', 'full', 'none'];

/**
 * Compose a progress card from 1–4 check-ins of one pose (`ids`, any order;
 * drawn oldest first) and hand it to the OS share sheet. The card is built on
 * this phone from photos that never leave it otherwise; nothing is uploaded,
 * and the default numbers are CHANGES only — a body weight is printed only
 * when the lifter picks "Full".
 */
const ShareContent = () => {
  const { user } = useAuth();
  const t = useT();
  const toast = useToast();
  const { units } = useUnits();
  const { dayMonth } = useDateFormat();
  const { brandContrast } = useTheme();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const params = useLocalSearchParams<{ ids?: string; pose?: string }>();
  const { entries, keySite } = useProgressLog(user?.id ?? '', user?.sex ?? null);
  const { ref, share, busy } = useShareCard(t('progressShare.title'));

  const [format, setFormat] = useState<ShareFormat>('post');
  const [look, setLook] = useState<ShareStyle>('frame');
  const [stats, setStats] = useState<ShareStatsMode>('changes');
  const [showDates, setShowDates] = useState(true);
  const [hideFace, setHideFace] = useState(false);
  const [band, setBand] = useState(0.3);

  if (!user) return <Redirect href="/progress" />;
  const pose = isPose(params.pose) ? params.pose : null;
  const ids = new Set((params.ids ?? '').split(',').filter(Boolean));
  // `entries` is newest first: the card reads oldest first.
  const chosen = entries.filter((e) => ids.has(e.checkin.id)).reverse();
  const model = pose
    ? progressShareModel({
        entries: chosen,
        pose,
        stats,
        units,
        siteLabel: t(siteLabelKey(keySite)),
        dayMonth: (key) => dayMonth(dateFromKey(key)),
        t,
      })
    : null;
  // A deep link naming nothing that holds the pose (or a check-in since deleted).
  if (!model || model.panels.length === 0) return <Redirect href="/progress" />;

  const cardH = CARD_WIDTH * FORMAT_RATIO[format];
  const scale = Math.min(1, (screenW - INSET) / CARD_WIDTH, (screenH * PREVIEW_HEIGHT) / cardH);
  const faceBand = hideFace ? BAND_MIN + band * (BAND_MAX - BAND_MIN) : null;

  // The share sheet is another activity on Android: the trip must not relock
  // the composer and throw away the card being made.
  const onShare = async () => {
    const size = { width: OUTPUT_WIDTH, height: OUTPUT_WIDTH * FORMAT_RATIO[format] };
    const sent = await keepUnlockedWhile(() => share(size));
    if (!sent) toast.error(t('progressShare.failed'));
  };

  const formatSegments: Segment<ShareFormat>[] = FORMATS.map((f) => ({
    value: f,
    label: t(`progressShare.format.${f}`),
  }));
  const lookSegments: Segment<ShareStyle>[] = LOOKS.map((l) => ({
    value: l,
    label: t(`progressShare.style.${l}`),
  }));
  const statsSegments: Segment<ShareStatsMode>[] = STATS.map((s) => ({
    value: s,
    label: t(`progressShare.stats.${s}`),
  }));

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-10"
      header={<TopBar showBack showAvatar={false} title={t('progressShare.title')} />}
    >
      {/* The card is laid out at its own size and only DRAWN scaled: the capture
          renders the view itself, so the PNG is the full card either way. */}
      <View
        accessible
        accessibilityLabel={t('progressShare.preview')}
        style={{ width: CARD_WIDTH * scale, height: cardH * scale }}
        className="self-center overflow-hidden rounded-card border border-ink-700"
      >
        <View
          style={{
            width: CARD_WIDTH,
            height: cardH,
            transform: [{ scale }],
            transformOrigin: 'top left',
          }}
        >
          <ProgressShareCard
            ref={ref}
            model={model}
            format={format}
            look={look}
            showDates={showDates}
            faceBand={faceBand}
            footer={t('share.footer')}
          />
        </View>
      </View>

      <View className="mt-5 gap-4">
        <SegmentedControl
          label={t('progressShare.format')}
          segments={formatSegments}
          value={format}
          onChange={setFormat}
        />
        <SegmentedControl
          label={t('progressShare.style')}
          segments={lookSegments}
          value={look}
          onChange={setLook}
        />
        <View>
          <SegmentedControl
            label={t('progressShare.stats')}
            segments={statsSegments}
            value={stats}
            onChange={setStats}
          />
          <Text className="mt-1.5 text-xs text-ink-400">{t('progressShare.statsHint')}</Text>
        </View>
        <Card className="gap-1">
          {look === 'clean' ? (
            <ShareToggle
              label={t('progressShare.dates')}
              value={showDates}
              onValueChange={setShowDates}
            />
          ) : null}
          <ShareToggle
            label={t('progressShare.hideFace')}
            value={hideFace}
            onValueChange={setHideFace}
          />
          {hideFace ? (
            <Slider
              value={band}
              onChange={setBand}
              accessibilityLabel={t('progressShare.faceBand')}
              valueText={(v) =>
                t('compare.percent', {
                  n: Math.round((BAND_MIN + v * (BAND_MAX - BAND_MIN)) * 100),
                })
              }
            />
          ) : null}
        </Card>
        <Text className="text-xs text-ink-400">{t('progressShare.privacy')}</Text>
        <Button
          variant="brand"
          label={t('share.action')}
          loading={busy}
          leftIcon={<ShareIcon color={brandContrast} size={18} />}
          onPress={() => void onShare()}
        />
      </View>
    </Screen>
  );
};

/** Behind the private-section lock when the lifter turned it on (`features/app-lock`). */
const ProgressShare = () => (
  <LockGate section="photos">
    <ShareContent />
  </LockGate>
);

export default ProgressShare;
