import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { TopBar } from '@/components/TopBar';
import { Card, Screen } from '@/components/ui';
import { buildSharedProgram } from '@/features/plan/program-share';
import { encodeProgramShare, ShareTooLargeError } from '@/features/plan/program-share-codec';
import { QR_INK, QR_PAPER } from '@/features/plan/qr-colors';
import { useI18n, useT, type Locale, type TranslationKey } from '@/i18n';
import { captureError } from '@/lib/telemetry';

/** Long enough for the scanner to lock a code, short enough that a full sweep takes seconds. */
const FRAME_MS = 400;
/** Its own tag: a session's keep-awake underneath must survive this screen closing. */
const KEEP_AWAKE_TAG = 'program-share';

type Built = { name: string; codes: string[] } | { error: TranslationKey };

const build = (programId: string, userProgramId: string | null, locale: Locale): Built => {
  try {
    const program = buildSharedProgram(programId, userProgramId, locale);
    if (!program) return { error: 'programShare.empty' };
    return { name: program.name, codes: encodeProgramShare(program) };
  } catch (e) {
    if (e instanceof ShareTooLargeError) return { error: 'programShare.tooBig' };
    captureError(e);
    return { error: 'programShare.failed' };
  }
};

/**
 * A program as a cycling run of QR codes for another phone's scanner
 * (`/training/scan`). Only the plan travels — the codec's payload rule — and
 * the codes are dark on a white quiet zone whatever the theme: a camera needs
 * the contrast. The screen stays awake while it is shown.
 */
const ShareProgram = () => {
  const { id, up } = useLocalSearchParams<{ id: string; up?: string }>();
  const t = useT();
  const { locale } = useI18n();
  const { width } = useWindowDimensions();
  useKeepAwake(KEEP_AWAKE_TAG, { suppressDeactivateWarnings: true });
  const programId = typeof id === 'string' ? id : '';
  const [built] = useState(() =>
    build(programId, typeof up === 'string' && up ? up : null, locale),
  );
  const [frame, setFrame] = useState(0);
  const total = 'codes' in built ? built.codes.length : 0;

  useEffect(() => {
    if (total < 2) return;
    const timer = setInterval(() => setFrame((n) => (n + 1) % total), FRAME_MS);
    return () => clearInterval(timer);
  }, [total]);

  if (!programId) return <Redirect href="/training" />;
  const size = Math.min(width - 88, 340);

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-10"
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={t('programShare.title')}
          subtitle={'codes' in built ? built.name : undefined}
        />
      }
    >
      {'codes' in built ? (
        <>
          <Card className="items-center">
            <View
              className="items-center justify-center rounded-field p-3"
              style={{ backgroundColor: QR_PAPER }}
              accessible
              accessibilityRole="image"
              accessibilityLabel={t('programShare.codeOf', { i: frame + 1, n: total })}
            >
              <QRCode
                value={built.codes[frame]}
                size={size}
                ecl="L"
                color={QR_INK}
                backgroundColor={QR_PAPER}
                quietZone={12}
              />
            </View>
            <Text className="mt-3 font-mono-medium text-sm text-ink-200">
              {t('programShare.codeOf', { i: frame + 1, n: total })}
            </Text>
          </Card>
          <Text className="mt-4 text-sm leading-6 text-ink-300">{t('programShare.body')}</Text>
          <Text className="mt-2 text-xs leading-5 text-ink-500">{t('programShare.onlyPlan')}</Text>
        </>
      ) : (
        <Card>
          <Text className="text-sm leading-6 text-ink-300">{t(built.error)}</Text>
        </Card>
      )}
    </Screen>
  );
};

export default ShareProgram;
