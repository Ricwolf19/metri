import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { CameraIcon, ChevronRightIcon, LogOutIcon, StarIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Avatar,
  Button,
  Card,
  Input,
  PressableScale,
  Screen,
  ScreenTitle,
  SegmentedControl,
  type Segment,
  useDialog,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { RoleBadge } from '@/features/auth/components/RoleBadge';
import { pushProfile } from '@/features/auth/profile-sync';
import { betaLinks } from '@/features/beta/links';
import { pickFromCamera, pickFromLibrary } from '@/features/photos/capture';
import { deletePhotoFiles, persistAvatar } from '@/features/photos/media';
import { LOCALES, useI18n, type Locale } from '@/i18n';
import { settings, type ClockFormat } from '@/lib/storage';
import { ThemeSelect } from '@/theme/ThemeSelect';
import { useTheme } from '@/theme/theme-context';

const MetricRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-sm text-ink-400">{label}</Text>
      <Text className="text-sm font-sans-medium text-ink-100">{value}</Text>
    </View>
  );
};

const Profile = () => {
  const { user, isPremium, updateMyProfile, updateMyAccount, signOut } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const { brand } = useTheme();
  const toast = useToast();
  const dialog = useDialog();
  const router = useRouter();

  const [name, setName] = useState(user?.displayName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [saving, setSaving] = useState(false);

  const [clock, setClock] = useState<ClockFormat>(settings.getClockFormat());
  if (!user) return null;

  const dirty =
    name.trim() !== (user.displayName ?? '') || username.trim().toLowerCase() !== user.username;

  const saveAccount = async () => {
    if (!user) return;
    if (!name.trim()) return toast.error(t('profile.errNameEmpty'));
    if (username.trim().length < 3) return toast.error(t('auth.errUsername'));

    setSaving(true);
    try {
      const nextUsername = username.trim().toLowerCase();
      if (nextUsername !== user.username) {
        await updateMyAccount({ username: nextUsername });
      }
      updateMyProfile({ displayName: name.trim() });
      toast.success(t('profile.accountUpdatedToast'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('auth.errUsername'));
    } finally {
      setSaving(false);
    }
  };

  const onSignOut = () => {
    signOut();
    router.replace('/(auth)/sign-in');
  };

  const setPhoto = async (source: 'camera' | 'library') => {
    if (!user) return;
    const uri = source === 'camera' ? await pickFromCamera() : await pickFromLibrary();
    if (!uri) return;
    try {
      const saved = await persistAvatar(uri);
      const old = user.avatarUri;
      updateMyProfile({ avatarUri: saved });
      deletePhotoFiles(old);
      toast.success(t('photos.savedToast'));
    } catch {
      toast.error(t('photos.permDenied'));
    }
  };

  const onChangePhoto = () => {
    dialog.show({
      title: t('photos.chooseTitle'),
      actions: [
        { label: t('photos.camera'), onPress: () => setPhoto('camera') },
        { label: t('photos.library'), onPress: () => setPhoto('library') },
        { label: t('common.cancel'), style: 'cancel' },
      ],
    });
  };

  const localeSegments: Segment<Locale>[] = LOCALES.map((l) => ({
    value: l.value,
    label: t(l.key),
  }));
  const clockSegments: Segment<ClockFormat>[] = [
    { value: '24', label: t('clock.24') },
    { value: '12', label: t('clock.12') },
  ];
  const onClockChange = (next: ClockFormat) => {
    settings.setClockFormat(next);
    setClock(next);
    if (user) pushProfile(user);
  };
  const onLocaleChange = (next: Locale) => {
    setLocale(next);
    if (user) pushProfile(user);
  };
  const hasMetrics = typeof user.age === 'number';

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-10"
      header={<TopBar showBack showAvatar={false} />}
    >
      <ScreenTitle title={t('profile.title')} />

      <Card className="items-center">
        <Pressable onPress={onChangePhoto} accessibilityRole="button" className="relative">
          <Avatar uri={user.avatarUri} size={84} />
          <View className="absolute -bottom-0.5 -right-0.5 h-7 w-7 items-center justify-center rounded-full border-2 border-ink-800 bg-brand/10">
            <CameraIcon color={brand} size={13} />
          </View>
        </Pressable>
        <Text className="mt-3 text-xl font-sans-bold text-ink-50">
          {name || user.displayName || user.email}
        </Text>
        <Text className="mb-3 text-sm text-ink-400">{user.email}</Text>
        <View className="flex-row items-center gap-2">
          <RoleBadge role={user.role} />
          {user.plan === 'premium' ? (
            <View className="flex-row items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1">
              <StarIcon color={brand} size={11} />
              <Text className="font-mono-medium text-xs uppercase tracking-wider text-brand">
                {t('plan.premium')}
              </Text>
            </View>
          ) : null}
        </View>
      </Card>

      {/* Premium upsell / status */}
      <PressableScale onPress={() => router.push('/premium')} className="mt-7">
        <Card className="flex-row items-center border-brand/30 bg-brand/10">
          <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-brand">
            <StarIcon color="#08090d" size={20} />
          </View>
          <View className="flex-1 pr-2">
            <Text className="text-base font-sans-semibold text-ink-50">
              {user.plan === 'premium' ? t('plan.premium') : t('premium.upsellRow')}
            </Text>
            <Text className="mt-0.5 text-sm text-ink-400">{t('premium.upsellSub')}</Text>
          </View>
          <ChevronRightIcon color={brand} />
        </Card>
      </PressableScale>

      {/* Sync is automatic with Premium — no button. The ring around the avatar
          in the top bar is the status surface. */}
      {isPremium ? (
        <Text className="mt-4 text-center text-xs text-ink-400">{t('sync.autoHint')}</Text>
      ) : null}

      {/* Account */}
      <Text className="mb-2 mt-7 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('profile.account')}
      </Text>
      <Card>
        <View className="gap-4">
          <Input
            label={t('profile.displayName')}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <Input
            label={t('auth.username')}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {/* Email is the cloud-account identity — managed on metri.info, read-only here. */}
          <Input
            label={t('auth.email')}
            value={user.email}
            editable={false}
            className="text-ink-400"
            hint={t('profile.emailLocked')}
          />
        </View>

        <View className="mt-5">
          <Button
            label={t('common.saveChanges')}
            onPress={saveAccount}
            loading={saving}
            disabled={!dirty}
          />
        </View>
      </Card>

      {/* Password — managed on the web (single auth surface, like the email). */}
      <Text className="mb-2 mt-7 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('profile.security')}
      </Text>
      <Card>
        <Text className="text-sm leading-6 text-ink-300">{t('profile.passwordWeb')}</Text>
        <Pressable
          onPress={() => Linking.openURL('https://metri.info')}
          accessibilityRole="link"
          className="mt-3 self-start"
        >
          <Text className="text-sm font-sans-semibold text-brand">metri.info</Text>
        </Pressable>
      </Card>

      {/* Feedback — ideas & bug reports straight to the team (beta lifeline). */}
      <Text className="mb-2 mt-7 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('faq.feedbackTitle')}
      </Text>
      <Card>
        <Text className="text-sm leading-6 text-ink-300">{t('faq.feedbackBody')}</Text>
        <View className="mt-4">
          <Button
            label={t('faq.feedbackCta')}
            variant="secondary"
            onPress={() => Linking.openURL(betaLinks.feedback)}
          />
        </View>
      </Card>

      {/* Appearance */}
      <Text className="mb-2 mt-7 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('theme.title')}
      </Text>
      <Card>
        <ThemeSelect />
      </Card>

      {/* Language */}
      <Text className="mb-2 mt-7 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('profile.language')}
      </Text>
      <Card>
        <SegmentedControl segments={localeSegments} value={locale} onChange={onLocaleChange} />
      </Card>

      {/* Time format */}
      <Text className="mb-2 mt-7 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('profile.timeFormat')}
      </Text>
      <Card>
        <SegmentedControl segments={clockSegments} value={clock} onChange={onClockChange} />
      </Card>

      {/* Body metrics */}
      <Text className="mb-2 mt-7 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('profile.bodyMetrics')}
      </Text>
      <Card>
        {hasMetrics ? (
          <>
            <MetricRow
              label={t('profile.sex')}
              value={user.sex === 'female' ? t('bmr.female') : t('bmr.male')}
            />
            <MetricRow label={t('profile.age')} value={`${user.age}`} />
            <MetricRow label={t('profile.height')} value={`${user.heightCm} cm`} />
            <MetricRow label={t('profile.weight')} value={`${user.weightKg} kg`} />
            {user.activityLevel ? (
              <MetricRow
                label={t('profile.activity')}
                value={t(`activity.${user.activityLevel}`)}
              />
            ) : null}
          </>
        ) : (
          <Text className="text-sm text-ink-400">{t('profile.noMetricsSaved')}</Text>
        )}
        <View className="mt-4">
          <Button
            label={hasMetrics ? t('profile.updateViaCalc') : t('profile.addMetrics')}
            variant="secondary"
            onPress={() => router.push('/calculators/tdee')}
          />
        </View>
      </Card>

      {/* Sign out */}
      <View className="mt-8">
        <Button
          label={t('profile.signOut')}
          variant="danger"
          onPress={onSignOut}
          leftIcon={<LogOutIcon color="#f87171" size={18} />}
        />
      </View>

      <View className="mt-6 flex-row items-center justify-center gap-3">
        <Pressable onPress={() => router.push('/beta')} accessibilityRole="button">
          <Text className="text-xs font-sans-semibold text-ink-400">{t('profile.beta')}</Text>
        </Pressable>
        <Text className="text-xs text-ink-600">·</Text>
        <Pressable onPress={() => router.push('/legal')} accessibilityRole="button">
          <Text className="text-xs font-sans-semibold text-ink-400">{t('legal.title')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
};

export default Profile;
