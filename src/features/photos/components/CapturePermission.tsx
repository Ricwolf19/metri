import type { PermissionResponse } from 'expo-camera';
import { Linking, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { keepUnlockedWhile } from '@/features/app-lock/lock';
import { useT } from '@/i18n';

/**
 * What the camera frame shows without camera access: why metri wants it, and
 * the one way forward — ask again while the OS still allows it, else its
 * settings page.
 */
export const CapturePermission = ({
  permission,
  request,
}: {
  permission: PermissionResponse;
  request: () => Promise<PermissionResponse>;
}) => {
  const t = useT();
  const canAsk = permission.canAskAgain;
  return (
    <View className="flex-1 justify-center p-5">
      <Text className="text-base font-sans-semibold text-ink-50">{t('capture.permTitle')}</Text>
      <Text className="mt-1 text-sm leading-6 text-ink-300">{t('capture.permBody')}</Text>
      <View className="mt-4">
        <Button
          label={t(canAsk ? 'capture.permAllow' : 'capture.permSettings')}
          variant="brand"
          onPress={() => void (canAsk ? keepUnlockedWhile(request) : Linking.openSettings())}
        />
      </View>
    </View>
  );
};
