import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { ControlledInput, useSaveForm } from '@/components/form';
import { TopBar } from '@/components/TopBar';
import { Button, Screen, ScreenTitle } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { TermsCheckbox } from '@/features/auth/components/TermsCheckbox';
import { useT } from '@/i18n';
import { LocaleToggle } from '@/i18n/LocaleToggle';

/** Local-only start: a name and the terms — nothing to authenticate. A later account adopts this row (AGENTS.md). */
const LocalSetup = () => {
  const { startLocal, isAuthenticated } = useAuth();
  const router = useRouter();
  const t = useT();
  const [error, setError] = useState<string | null>(null);

  // `create`: ONE local row. The keyboard's "go" and the button could both
  // land before the first `startLocal` resolved, minting a second user and
  // orphaning the first (AGENTS.md: never two rows for one person).
  const form = useSaveForm<{ displayName: string; acceptedTerms: boolean }>({
    kind: 'create',
    defaultValues: { displayName: '', acceptedTerms: false },
    onSave: async ({ displayName, acceptedTerms }) => {
      if (!displayName.trim()) {
        setError(t('auth.errName'));
        return false;
      }
      if (!acceptedTerms) {
        setError(t('auth.errTerms'));
        return false;
      }
      setError(null);
      await startLocal(displayName.trim());
      router.replace('/(tabs)');
    },
  });
  const onSubmit = () => form.submit();
  const acceptedTerms = useWatch({ control: form.control, name: 'acceptedTerms' });

  // Re-entering setup while signed in (local users pass the group gate) would
  // mint a second local row and orphan the first.
  if (isAuthenticated) return <Redirect href="/(tabs)" />;

  return (
    <Screen
      scroll
      contentClassName="grow px-5 pb-10"
      header={<TopBar showBack showAvatar={false} right={<LocaleToggle />} />}
    >
      <ScreenTitle title={t('auth.localTitle')} subtitle={t('auth.localSubtitle')} />

      <View className="gap-3">
        <ControlledInput
          control={form.control}
          name="displayName"
          label={t('auth.name')}
          placeholder={t('auth.phName')}
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
          error={error ?? undefined}
          onSubmitEditing={onSubmit}
          returnKeyType="go"
        />

        <Controller
          control={form.control}
          name="acceptedTerms"
          render={({ field }) => (
            <TermsCheckbox
              checked={field.value}
              // Checking the box opens the terms so the user actually reads them.
              onToggle={() => {
                const next = !field.value;
                field.onChange(next);
                if (next) router.push('/legal');
              }}
            />
          )}
        />

        <Button
          variant="brand"
          label={t('auth.localStart')}
          onPress={onSubmit}
          loading={form.saving}
          disabled={!acceptedTerms}
        />

        {/* Honest trade-off, up front: what local mode gives up. */}
        <Text className="mt-2 text-xs leading-5 text-ink-500">{t('auth.localTradeoff')}</Text>
      </View>
    </Screen>
  );
};

export default LocalSetup;
