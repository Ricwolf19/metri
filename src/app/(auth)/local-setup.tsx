import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Button, Input, Screen, ScreenTitle } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';
import { LocaleToggle } from '@/i18n/LocaleToggle';

/** Local-only start: a name and the terms — nothing to authenticate. A later account adopts this row (AGENTS.md). */
const LocalSetup = () => {
  const { startLocal, isAuthenticated } = useAuth();
  const router = useRouter();
  const t = useT();

  const [displayName, setDisplayName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-entering setup while signed in (local users pass the group gate) would
  // mint a second local row and orphan the first.
  if (isAuthenticated) return <Redirect href="/(tabs)" />;

  // Checking the box opens the terms so the user actually reads them.
  const onToggleTerms = () => {
    const next = !acceptedTerms;
    setAcceptedTerms(next);
    if (next) router.push('/legal');
  };

  const onSubmit = async () => {
    if (!displayName.trim()) return setError(t('auth.errName'));
    if (!acceptedTerms) return setError(t('auth.errTerms'));
    setError(null);
    setLoading(true);
    try {
      await startLocal(displayName.trim());
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      scroll
      contentClassName="grow px-5 pb-10"
      header={<TopBar showBack showAvatar={false} right={<LocaleToggle />} />}
    >
      <ScreenTitle title={t('auth.localTitle')} subtitle={t('auth.localSubtitle')} />

      <View className="gap-3">
        <Input
          label={t('auth.name')}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t('auth.phName')}
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
          error={error ?? undefined}
          onSubmitEditing={onSubmit}
          returnKeyType="go"
        />

        <Pressable
          onPress={onToggleTerms}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedTerms }}
          className="flex-row items-center gap-3"
        >
          <View
            className={[
              'h-6 w-6 items-center justify-center rounded-field border',
              acceptedTerms ? 'border-brand bg-brand' : 'border-ink-500 bg-transparent',
            ].join(' ')}
          >
            {acceptedTerms ? <CheckIcon color="#08090d" size={16} /> : null}
          </View>
          <Text className="flex-1 text-sm text-ink-300">
            {t('auth.agree')}{' '}
            <Text className="font-sans-semibold text-brand">{t('legal.title')}</Text>
          </Text>
        </Pressable>

        <Button
          variant="brand"
          label={t('auth.localStart')}
          onPress={onSubmit}
          loading={loading}
          disabled={!acceptedTerms}
        />

        {/* Honest trade-off, up front: what local mode gives up. */}
        <Text className="mt-2 text-xs leading-5 text-ink-500">{t('auth.localTradeoff')}</Text>
      </View>
    </Screen>
  );
};

export default LocalSetup;
