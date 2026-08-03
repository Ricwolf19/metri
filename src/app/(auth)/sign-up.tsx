import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { BrandLogo, Button, Input, Screen, ScreenTitle, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';
import { captureError } from '@/lib/telemetry';
import { LocaleToggle } from '@/i18n/LocaleToggle';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignUp = () => {
  const { signUpRemote } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const t = useT();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Checking the box opens the terms so the user actually reads them.
  const onToggleTerms = () => {
    const next = !acceptedTerms;
    setAcceptedTerms(next);
    if (next) router.push('/legal');
  };

  const validate = (): string | null => {
    if (!displayName.trim()) return t('auth.errName');
    if (!EMAIL_RE.test(email.trim())) return t('auth.errEmail');
    if (password.length < 6) return t('auth.errPassword');
    if (password !== confirm) return t('auth.errMismatch');
    if (!acceptedTerms) return t('auth.errTerms');
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
      const { needsVerification } = await signUpRemote(email, password, displayName);
      if (needsVerification) {
        toast.success(t('auth.verifySent'));
        router.replace('/(auth)/sign-in');
        return;
      }
      toast.success(t('auth.createdToast'));
      router.replace('/(tabs)');
      router.push('/beta');
    } catch (e) {
      // Server strings are technical and EN-only ("captcha_failed:
      // missing_token") — never user copy. Sentry gets the real one.
      captureError(e);
      setError(t('auth.errSignUp'));
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
      <ScreenTitle title={t('auth.createTitle')} subtitle={t('auth.cloudNote')} />

      <View className="mb-6 mt-1 items-center">
        <BrandLogo width={120} />
      </View>

      <View className="gap-4">
        <Input
          label={t('auth.name')}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t('auth.phName')}
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
        />
        <Input
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          placeholder={t('auth.phEmail')}
        />
        <Input
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          placeholder={t('auth.phPassword')}
        />
        <Input
          label={t('auth.confirmPassword')}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          placeholder={t('auth.passwordRepeat')}
          error={error ?? undefined}
          onSubmitEditing={onSubmit}
          returnKeyType="go"
        />

        {/* Mandatory terms — tapping opens them to read. */}
        <Pressable
          onPress={onToggleTerms}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedTerms }}
          className="flex-row items-center gap-3"
        >
          <View
            className={[
              'h-6 w-6 items-center justify-center rounded-md border',
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
          label={t('auth.createCta')}
          onPress={onSubmit}
          loading={loading}
          disabled={!acceptedTerms}
        />
      </View>

      <Pressable
        onPress={() => router.push('/(auth)/sign-in')}
        className="mt-8 flex-row items-center justify-center"
        accessibilityRole="button"
      >
        <Text className="text-sm text-ink-300">{t('auth.alreadyHave')} </Text>
        <Text className="text-sm font-sans-semibold text-brand">{t('auth.signIn')}</Text>
      </Pressable>
    </Screen>
  );
};

export default SignUp;
