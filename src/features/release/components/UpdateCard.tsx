import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { DownloadIcon, SparksIcon, XIcon } from '@/components/icons';
import { Button, Card, TextLink } from '@/components/ui';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { startUpdate } from '../start-update';
import type { AppUpdate } from '../useAppUpdate';
import { UpdateSheet } from './UpdateSheet';

type Props = {
  update: AppUpdate;
  /** Shows a dismiss cross (Home); Profile keeps the card until the update lands. */
  onDismiss?: () => void;
  className?: string;
};

/**
 * "A newer metri is out", with the action this install can actually take: an
 * OTA release is already downloaded, so it restarts; a new runtime needs the
 * APK, so it downloads. The changelog opens in `UpdateSheet`.
 */
export const UpdateCard = ({ update, onDismiss, className }: Props) => {
  const t = useT();
  const { brandContrast, muted } = useTheme();
  const [open, setOpen] = useState(false);
  const { release, kind } = update;
  const ota = kind === 'ota';

  return (
    <>
      <Card className={['border-brand/30 bg-brand/10', className ?? ''].join(' ')}>
        <View className="flex-row items-center">
          <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-brand">
            {ota ? (
              <SparksIcon color={brandContrast} size={20} />
            ) : (
              <DownloadIcon color={brandContrast} size={20} />
            )}
          </View>
          <View className="flex-1 pr-2">
            <Text numberOfLines={1} className="text-base font-sans-semibold text-ink-50">
              {ota ? t('release.readyTitle') : t('release.updateTitle')}
            </Text>
            <Text className="mt-0.5 text-sm text-ink-400">
              {t(ota ? 'release.readyBody' : 'release.updateBody', { version: release.version })}
            </Text>
          </View>
          {onDismiss ? (
            <Pressable
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('release.dismiss')}
              onPress={onDismiss}
            >
              <XIcon color={muted} size={18} />
            </Pressable>
          ) : null}
        </View>
        <View className="mt-4">
          <Button
            variant="brand"
            size="sm"
            label={ota ? t('release.restart') : t('release.download')}
            onPress={() => startUpdate(update)}
          />
        </View>
        <TextLink
          label={t('release.viewChangelog')}
          center
          className="mt-3"
          onPress={() => setOpen(true)}
        />
      </Card>
      <UpdateSheet update={update} visible={open} onClose={() => setOpen(false)} />
    </>
  );
};
