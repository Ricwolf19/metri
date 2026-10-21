import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Text, View } from 'react-native';

import { BlockingOverlay, Button, Card, useToast } from '@/components/ui';
import { useT } from '@/i18n';
import { captureError } from '@/lib/telemetry';
import { useBlockingTask } from '@/lib/useBlockingTask';

import { shareExportFile, writeExportFile } from './export';
import { importUserData } from './import';
import { validateImport } from './validate-import';

/**
 * The lifter's data in and out of the device as ONE .json file: export
 * builds it behind the blocking overlay and hands it to the OS share sheet;
 * import picks a file and restores it behind the same overlay. No pasted
 * text: a real export is far too big for a text field. Validation, id remap
 * and the transaction live in the plain modules.
 */
export const DataCard = ({ userId }: { userId: string }) => {
  const t = useT();
  const toast = useToast();
  const blocking = useBlockingTask<'exporting' | 'importing'>();

  const onExport = () => {
    if (!userId) return;
    // The overlay covers building the file; the share sheet then stands on its own.
    blocking.start('exporting', async () => {
      let uri: string;
      try {
        uri = await writeExportFile(userId);
      } catch (e) {
        captureError(e);
        toast.error(t('plan.exportErrFailed'));
        return;
      }
      void shareExportFile(uri, t('premium.exportCta'))
        .then((shared) => shared && toast.success(t('premium.exportedToast')))
        .catch((e: unknown) => captureError(e));
    });
  };

  const runImport = (text: string) => {
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      toast.error(t('plan.importErrInvalid'));
      return;
    }
    const check = validateImport(raw);
    if (!check.ok) {
      toast.error(
        t(check.reason === 'version' ? 'plan.importErrVersion' : 'plan.importErrInvalid'),
      );
      return;
    }
    try {
      const summary = importUserData(userId, raw as Parameters<typeof importUserData>[1]);
      const total = Object.values(summary).reduce((s, n) => s + n, 0);
      toast.success(t('plan.importSuccess', { n: total }));
    } catch (e) {
      captureError(e);
      toast.error(t('plan.importErrFailed'));
    }
  };

  const onImport = async () => {
    if (!userId) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      const uri = res.assets?.[0]?.uri;
      if (res.canceled || !uri) return;
      const text = await FileSystem.readAsStringAsync(uri);
      blocking.start('importing', () => runImport(text));
    } catch (e) {
      // A cancelled picker returned above; a file the device could not read is a surprise.
      captureError(e);
      toast.error(t('plan.importErrInvalid'));
    }
  };

  return (
    <Card>
      <Text className="text-sm leading-6 text-ink-300">{t('plan.dataBody')}</Text>
      <View className="mt-4 gap-2">
        <Button label={t('premium.exportCta')} variant="brand" onPress={onExport} />
        <Button label={t('plan.importPick')} variant="secondary" onPress={() => void onImport()} />
      </View>
      <Text className="mt-3 text-xs leading-5 text-ink-500">{t('plan.jsonOnly')}</Text>
      <BlockingOverlay
        visible={blocking.busy !== null}
        label={blocking.busy === 'exporting' ? t('plan.exporting') : t('plan.importing')}
        onShow={blocking.onShow}
      />
    </Card>
  );
};
