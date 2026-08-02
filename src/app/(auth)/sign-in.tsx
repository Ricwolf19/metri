import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BrandLogo, Button, Input, Screen, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';
import { LocaleToggle } from '@/i18n/LocaleToggle';

const SignIn = () => {
  const { signInRemote } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const t = useT();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setError(t('auth.errEnterCreds'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { restored } = await signInRemote(email, password);
      toast.success(t(restored ? 'auth.profileRestored' : 'auth.welcomeToast'));
      router.replace('/(tabs)');
      router.push('/beta');
    } catch (e) {
      setError((e as Error).message ?? t('auth.errSignIn'));
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

      <Text className="mt-6 text-center text-2xl font-sans-bold text-ink-50">
        {t('auth.welcomeBack')}
      </Text>
      <Text className="mb-6 mt-1 text-center text-sm text-ink-400">{t('auth.signInSubtitle')}</Text>

      <View className="gap-4">
        <Input
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          placeholder="you@email.com"
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

        <Text className="text-xs text-ink-500">{t('auth.cloudNote')}</Text>

        <Button label={t('auth.signIn')} onPress={onSubmit} loading={loading} />
      </View>

      <Pressable
        onPress={() => router.push('/(auth)/sign-up')}
        className="mt-8 flex-row items-center justify-center"
        accessibilityRole="button"
      >
        <Text className="text-sm text-ink-300">{t('auth.newHere')} </Text>
        <Text className="text-sm font-sans-semibold text-brand">{t('auth.createAccount')}</Text>
      </Pressable>
    </Screen>
  );
};

export default SignIn;
