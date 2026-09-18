import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Input, useToast } from '@/components/ui';
import { useT } from '@/i18n';
import { captureError } from '@/lib/telemetry';

import { importUserData } from './import';
import { validateImport } from './validate-import';

/** Restore an export file (pick or paste JSON). Validation, id remap and the transaction live in the plain modules;
 * this only collects text and reports the outcome. */
export const ImportPanel = ({ userId }: { userId: string }) => {
  const t = useT();
  const toast = useToast();
  const [pasted, setPasted] = useState('');
  const [busy, setBusy] = useState(false);

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
      setPasted('');
    } catch (e) {
      captureError(e);
      toast.error(t('plan.importErrFailed'));
    }
  };

  const pickFile = async () => {
    setBusy(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      const uri = res.assets?.[0]?.uri;
      if (res.canceled || !uri) return;
      const text = await FileSystem.readAsStringAsync(uri);
      runImport(text);
    } catch {
      toast.error(t('plan.importErrInvalid'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="gap-3">
      <Button label={t('plan.importPick')} variant="secondary" onPress={pickFile} loading={busy} />
      <Input
        value={pasted}
        onChangeText={setPasted}
        placeholder={t('plan.importPlaceholder')}
        multiline
        numberOfLines={4}
        autoCapitalize="none"
        autoCorrect={false}
        className="min-h-[88px] font-mono text-xs"
      />
      {pasted.trim() ? (
        <Button label={t('plan.importCta')} onPress={() => runImport(pasted.trim())} />
      ) : null}
      <Text className="text-xs leading-5 text-ink-500">{t('plan.importBody')}</Text>
    </View>
  );
};
