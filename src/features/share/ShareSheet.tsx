import { View } from 'react-native';

import { Button, ScrollArea, Sheet, ShareCard, useToast } from '@/components/ui';
import { useT } from '@/i18n';
import { useShareCard } from '@/lib/useShareCard';

import type { ShareModel } from './models';

/**
 * The one place a card is previewed and captured: a sheet with the card as the
 * lifter will send it and a Share button that hands the PNG to the OS. Every
 * entry point builds a `ShareModel` and opens this; nothing else calls
 * `useShareCard`. A dismissed share sheet is a choice, not a failure.
 */
export const ShareSheet = ({
  model,
  visible,
  onClose,
}: {
  model: ShareModel | null;
  visible: boolean;
  onClose: () => void;
}) => {
  const t = useT();
  const toast = useToast();
  const { ref, share, busy } = useShareCard(t('share.action'));
  const onShare = async () => {
    if (!(await share())) toast.error(t('dayDetail.shareFailed'));
  };
  return (
    <Sheet visible={visible && model !== null} onClose={onClose}>
      <ScrollArea inSheet>
        <View className="items-center pb-6">
          {model ? <ShareCard ref={ref} {...model} /> : null}
          <View className="mt-4 w-full">
            <Button
              variant="brand"
              label={t('share.action')}
              loading={busy}
              onPress={() => void onShare()}
            />
          </View>
        </View>
      </ScrollArea>
    </Sheet>
  );
};
