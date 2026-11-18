import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Redirect, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { AccessibilityInfo, Linking, Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { BlockingOverlay, Button, Card, ClampedText, Screen, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { importSharedProgram, missingCatalogExercises } from '@/features/plan/program-share';
import {
  addScannedCode,
  programCounts,
  type ShareScan,
  type SharedProgram,
} from '@/features/plan/program-share-codec';
import { useT } from '@/i18n';
import { captureError } from '@/lib/telemetry';
import { useBlockingTask } from '@/lib/useBlockingTask';

/** Why the scan cannot finish here; the message says what to do. */
type Blocked = 'programShare.newer' | 'programShare.missing';
/** A passing remark under the camera; the scan carries on. */
type Notice = 'programShare.foreign' | 'programShare.other' | 'programShare.corrupt';

/**
 * Receive a program from another phone (its `/training/program/share/[id]`).
 * The camera reads codes in any order until the set is complete, then a card
 * names what arrived and the lifter decides; adding writes a NEW custom
 * template of theirs and opens it — nothing is enrolled. Frames are read on
 * the device and never kept or sent anywhere.
 */
const ScanProgram = () => {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const blocking = useBlockingTask<'importing'>();

  // The camera reports the same code many times a second: the collection lives
  // in a ref, and state changes only when something new happened.
  const scan = useRef<ShareScan>(null);
  // Set once the scan is decided (a program in, or a newer build's code): reports
  // the camera already had in flight must not start a new collection under the card.
  const settled = useRef(false);
  const [progress, setProgress] = useState<{ have: number; total: number } | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [received, setReceived] = useState<SharedProgram | null>(null);
  const [blocked, setBlocked] = useState<Blocked | null>(null);

  if (!user) return <Redirect href="/training" />;

  const reset = () => {
    scan.current = null;
    settled.current = false;
    setProgress(null);
    setNotice(null);
    setReceived(null);
    setBlocked(null);
  };

  const onScanned = ({ data }: BarcodeScanningResult) => {
    if (settled.current) return;
    const step = addScannedCode(scan.current, data);
    switch (step.kind) {
      case 'progress':
        scan.current = step.scan;
        if (step.fresh) {
          setProgress({ have: step.have, total: step.total });
          setNotice(null);
          AccessibilityInfo.announceForAccessibility(
            t('programShare.progress', { have: step.have, total: step.total }),
          );
        }
        return;
      case 'complete':
        scan.current = null;
        settled.current = true;
        setProgress(null);
        setNotice(null);
        if (missingCatalogExercises(step.program).length) setBlocked('programShare.missing');
        else setReceived(step.program);
        return;
      case 'newer':
        settled.current = true;
        setBlocked('programShare.newer');
        return;
      case 'corrupt':
        scan.current = null;
        setProgress(null);
        setNotice('programShare.corrupt');
        return;
      case 'other':
        setNotice('programShare.other');
        return;
      case 'foreign':
        setNotice('programShare.foreign');
        return;
    }
  };

  const onAdd = (program: SharedProgram) =>
    blocking.start('importing', () => {
      let id: string;
      try {
        id = importSharedProgram(user.id, program);
      } catch (e) {
        captureError(e);
        toast.error(t('programShare.failed'));
        return;
      }
      toast.success(t('programShare.added'));
      router.replace({ pathname: '/training/program/[id]', params: { id } });
    });

  const camera = (
    <View className="aspect-square w-full overflow-hidden rounded-card bg-ink-900">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={received || blocked ? undefined : onScanned}
      />
    </View>
  );

  const body = (() => {
    if (blocked) {
      return (
        <Card>
          <Text className="text-sm leading-6 text-ink-200">{t(blocked)}</Text>
          <View className="mt-4">
            <Button label={t('programShare.scanAgain')} variant="secondary" onPress={reset} />
          </View>
        </Card>
      );
    }
    if (received) {
      const counts = programCounts(received);
      return (
        <Card>
          <Text className="text-base font-sans-semibold text-ink-50">
            {t('programShare.confirmTitle', { name: received.name })}
          </Text>
          <Text className="mt-1 font-mono-medium text-xs text-ink-400">
            {t('programShare.confirmCounts', counts)}
          </Text>
          {received.description ? (
            <ClampedText className="mt-3 text-sm leading-6 text-ink-300" lines={3}>
              {received.description}
            </ClampedText>
          ) : null}
          <Text className="mt-3 text-xs leading-5 text-ink-500">
            {t('programShare.confirmBody')}
          </Text>
          <View className="mt-4 gap-2">
            <Button label={t('programShare.add')} variant="brand" onPress={() => onAdd(received)} />
            <Button label={t('programShare.scanAgain')} variant="ghost" onPress={reset} />
          </View>
        </Card>
      );
    }
    if (!permission) return null;
    if (!permission.granted) {
      const canAsk = permission.canAskAgain;
      return (
        <Card>
          <Text className="text-base font-sans-semibold text-ink-50">
            {t('programShare.permTitle')}
          </Text>
          <Text className="mt-1 text-sm leading-6 text-ink-300">{t('programShare.permBody')}</Text>
          <View className="mt-4">
            <Button
              label={t(canAsk ? 'programShare.permAllow' : 'programShare.permSettings')}
              variant="brand"
              onPress={() => void (canAsk ? requestPermission() : Linking.openSettings())}
            />
          </View>
        </Card>
      );
    }
    return (
      <>
        {camera}
        <Text className="mt-4 text-sm leading-6 text-ink-300">{t('programShare.scanHint')}</Text>
        {progress ? (
          <View className="mt-3">
            <View className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
              <View
                className="h-full rounded-full bg-lime-400"
                style={{ width: `${(progress.have / progress.total) * 100}%` }}
              />
            </View>
            <Text className="mt-1.5 font-mono-medium text-xs text-ink-200">
              {t('programShare.progress', progress)}
            </Text>
          </View>
        ) : null}
        {notice ? <Text className="mt-3 text-xs leading-5 text-amber-500">{t(notice)}</Text> : null}
      </>
    );
  })();

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-10"
      header={<TopBar showBack showAvatar={false} title={t('programShare.scanTitle')} />}
    >
      {body}
      <BlockingOverlay
        visible={blocking.busy !== null}
        onShow={blocking.onShow}
        label={t('programShare.adding')}
      />
    </Screen>
  );
};

export default ScanProgram;
