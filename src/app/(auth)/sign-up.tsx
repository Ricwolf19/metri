import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { ControlledInput, useSaveForm } from '@/components/form';
import { TopBar } from '@/components/TopBar';
import { BrandMark, Button, Screen, ScreenTitle, useToast } from '@/components/ui';
import { AuthRejectedError, useAuth } from '@/features/auth/auth-context';
import { TermsCheckbox } from '@/features/auth/components/TermsCheckbox';
import { useT } from '@/i18n';
import { captureError } from '@/lib/telemetry';
import { LocaleToggle } from '@/i18n/LocaleToggle';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SignUpDraft = {
  displayName: string;
  email: string;
  password: string;
  confirm: string;
  acceptedTerms: boolean;
};

const SignUp = () => {
  const { signUpRemote } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const t = useT();
  const [error, setError] = useState<string | null>(null);

  const validate = (v: SignUpDraft): string | null => {
    if (!v.displayName.trim()) return t('auth.errName');
    if (!EMAIL_RE.test(v.email.trim())) return t('auth.errEmail');
    if (v.password.length < 6) return t('auth.errPassword');
    if (v.password !== v.confirm) return t('auth.errMismatch');
    if (!v.acceptedTerms) return t('auth.errTerms');
    return null;
  };

  // `create`: one request per attempt — the keyboard's "go" and the button used
  // to race each other into two sign-ups. A refusal reopens the form.
  const form = useSaveForm<SignUpDraft>({
    kind: 'create',
    defaultValues: { displayName: '', email: '', password: '', confirm: '', acceptedTerms: false },
    onSave: async (v) => {
      const invalid = validate(v);
      if (invalid) {
        setError(invalid);
        return false;
      }
      setError(null);
      try {
        const { needsVerification } = await signUpRemote(v.email, v.password, v.displayName);
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
        // missing_token") — never user copy. A rejected sign-up (address taken,
        // weak password) is an expected answer, so only surprises are reported.
        if (!(e instanceof AuthRejectedError)) captureError(e);
        setError(t('auth.errSignUp'));
        return false;
      }
    },
  });
  const onSubmit = () => form.submit();
  const acceptedTerms = useWatch({ control: form.control, name: 'acceptedTerms' });

  return (
    <Screen
      scroll
      contentClassName="grow px-5 pb-10"
      header={<TopBar showBack showAvatar={false} right={<LocaleToggle />} />}
    >
      <View className="mb-4 items-center">
        <BrandMark size={72} />
      </View>
      <ScreenTitle title={t('auth.createTitle')} subtitle={t('auth.cloudNote')} />

      <View className="gap-3">
        <ControlledInput
          control={form.control}
          name="displayName"
          label={t('auth.name')}
          placeholder={t('auth.phName')}
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
        />
        <ControlledInput
          control={form.control}
          name="email"
          label={t('auth.email')}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          placeholder={t('auth.phEmail')}
        />
        <ControlledInput
          control={form.control}
          name="password"
          label={t('auth.password')}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          placeholder={t('auth.phPassword')}
        />
        <ControlledInput
          control={form.control}
          name="confirm"
          label={t('auth.confirmPassword')}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          placeholder={t('auth.passwordRepeat')}
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
          label={t('auth.createCta')}
          onPress={onSubmit}
          loading={form.saving}
          disabled={!acceptedTerms}
        />
      </View>

      <Pressable
        onPress={() => router.push('/(auth)/sign-in')}
        className="mt-8 flex-row items-center justify-center"
        accessibilityRole="button"
      >
        {/* One Text with a nested run: the pair wraps as a sentence (see sign-in). */}
        <Text className="shrink text-center text-sm text-ink-300">
          {t('auth.alreadyHave')}{' '}
          <Text className="font-sans-semibold text-brand">{t('auth.signIn')}</Text>
        </Text>
      </Pressable>
    </Screen>
  );
};

export default SignUp;
