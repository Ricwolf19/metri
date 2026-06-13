import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BrandLogo, Button, Input, Screen, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';
import { LocaleToggle } from '@/i18n/LocaleToggle';

const SignIn = () => {
  const { signIn } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const t = useT();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!identifier.trim() || !password) {
      setError(t('auth.errEnterCreds'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(identifier, password);
      toast.success(t('auth.welcomeToast'));
      router.replace('/(tabs)');
    } catch {
      setError(t('auth.errSignIn'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentClassName="grow justify-center px-6 py-10">
      <View className="absolute right-6 top-3 z-10">
        <LocaleToggle />
      </View>

      <View className="items-center">
        <BrandLogo width={160} />
      </View>

      <Text className="mt-6 text-center text-2xl font-bold text-ink-50">
        {t('auth.welcomeBack')}
      </Text>
      <Text className="mb-8 mt-1 text-center text-sm text-ink-400">{t('auth.signInSubtitle')}</Text>

      <View className="gap-4">
        <Input
          label={t('auth.identifier')}
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="username"
          autoComplete="username"
          placeholder={t('auth.phIdentifier')}
          returnKeyType="next"
        />
        <Input
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          autoComplete="current-password"
          placeholder="••••••••"
          returnKeyType="go"
          onSubmitEditing={onSubmit}
          error={error ?? undefined}
        />

        <Button label={t('auth.signIn')} onPress={onSubmit} loading={loading} />
      </View>

      <Pressable
        onPress={() => router.push('/(auth)/sign-up')}
        className="mt-8 flex-row items-center justify-center"
        accessibilityRole="button"
      >
        <Text className="text-sm text-ink-300">{t('auth.newHere')} </Text>
        <Text className="text-sm font-semibold text-accent">{t('auth.createAccount')}</Text>
      </Pressable>
    </Screen>
  );
};

export default SignIn;
