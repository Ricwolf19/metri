import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Button, Input, Screen, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignUp = () => {
  const { signUp } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const t = useT();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!displayName.trim()) return t('auth.errName');
    if (!EMAIL_RE.test(email.trim())) return t('auth.errEmail');
    if (username.trim().length < 3) return t('auth.errUsername');
    if (password.length < 6) return t('auth.errPassword');
    if (password !== confirm) return t('auth.errMismatch');
    return null;
  };

  const onSubmit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp({ email, username, password, displayName });
      toast.success(t('auth.createdToast'));
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.errEmail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentClassName="grow px-6 pb-10">
      <TopBar
        title={t('auth.createTitle')}
        subtitle={t('auth.localSubtitle')}
        showBack
        showAvatar={false}
      />

      <View className="mt-2 gap-4">
        <Input
          label={t('auth.name')}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Alex Doe"
          autoCapitalize="words"
        />
        <Input
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Input
          label={t('auth.username')}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="fakeuser"
          hint={t('auth.usernameHint')}
        />
        <Input
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder={t('auth.passwordMin')}
        />
        <Input
          label={t('auth.confirmPassword')}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder={t('auth.passwordRepeat')}
          error={error ?? undefined}
          onSubmitEditing={onSubmit}
          returnKeyType="go"
        />

        <Button label={t('auth.createCta')} onPress={onSubmit} loading={loading} />
      </View>

      <Pressable
        onPress={() => router.push('/(auth)/sign-in')}
        className="mt-8 flex-row items-center justify-center"
        accessibilityRole="button"
      >
        <Text className="text-sm text-ink-300">{t('auth.alreadyHave')} </Text>
        <Text className="text-sm font-semibold text-lime-400">{t('auth.signIn')}</Text>
      </Pressable>
    </Screen>
  );
};

export default SignUp;
