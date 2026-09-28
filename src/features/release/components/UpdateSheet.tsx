import { useRouter } from 'expo-router';
import { Linking, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { Button, ScrollArea, SectionLabel, Sheet, TextLink } from '@/components/ui';
import { markdownRules } from '@/features/docs/MarkdownTable';
import { markdownStyles } from '@/features/docs/markdownStyles';
import { openContentLink } from '@/features/docs/openContentLink';
import { useT } from '@/i18n';
import { useDateFormat } from '@/lib/useDateFormat';
import { useTheme } from '@/theme/theme-context';

import { startUpdate } from '../start-update';
import type { AppUpdate } from '../useAppUpdate';

type Props = {
  update: AppUpdate;
  visible: boolean;
  onClose: () => void;
};

const BYTES_PER_MB = 1_000_000;

/**
 * The release in full: version, date, download size and the changelog. The
 * action sits ABOVE the notes so a long changelog never pushes it off-screen.
 */
export const UpdateSheet = ({ update, visible, onClose }: Props) => {
  const t = useT();
  const router = useRouter();
  const { scheme } = useTheme();
  const { date } = useDateFormat();
  const { release, kind } = update;

  const published = new Date(release.publishedAt);
  const meta = [date(published)];
  // The APK size is what the browser downloads; an OTA bundle is far smaller.
  if (kind === 'apk' && release.sizeBytes > 0) {
    meta.push(t('release.size', { size: (release.sizeBytes / BYTES_PER_MB).toFixed(1) }));
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollArea inSheet>
        <Text numberOfLines={1} className="text-lg font-sans-bold text-ink-50">
          {t('release.sheetTitle', { version: release.version })}
        </Text>
        <Text className="mt-0.5 text-sm text-ink-400">{meta.join(' · ')}</Text>
        <Text className="mt-3 text-sm leading-6 text-ink-300">
          {kind === 'ota' ? t('release.otaHint') : t('release.apkHint')}
        </Text>

        <View className="mt-4">
          <Button
            variant="brand"
            fullWidth
            label={kind === 'ota' ? t('release.restart') : t('release.download')}
            onPress={() => startUpdate(update)}
          />
        </View>

        <SectionLabel label={t('release.whatsNew')} />
        {release.notes.trim() ? (
          <Markdown
            style={markdownStyles(scheme)}
            rules={markdownRules}
            onLinkPress={(href) => openContentLink(href, router)}
          >
            {release.notes}
          </Markdown>
        ) : (
          <Text className="text-sm text-ink-400">{t('release.noNotes')}</Text>
        )}

        <TextLink
          label={t('release.releasePage')}
          className="mb-2 mt-4"
          onPress={() => void Linking.openURL(release.releaseUrl).catch(() => {})}
        />
      </ScrollArea>
    </Sheet>
  );
};
