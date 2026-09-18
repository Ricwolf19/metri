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
  Select,
  type SelectItem,
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
import { DATE_FORMATS, formatDate, type DateFormat } from '@/lib/date-format';
import { useDateFormat } from '@/lib/useDateFormat';
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
  const { user, isPremium, isLocalOnly, tier, updateMyProfile, signOut } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const { brand } = useTheme();
  const toast = useToast();
  const dialog = useDialog();
  const router = useRouter();

  const [name, setName] = useState(user?.displayName ?? '');
  const [saving, setSaving] = useState(false);

  const [clock, setClock] = useState<ClockFormat>(settings.getClockFormat());
  const dateFormat = useDateFormat();
  const [sampleDate] = useState(() => new Date());
  if (!user) return null;

  const dirty = name.trim() !== (user.displayName ?? '');

  const saveAccount = () => {
    if (!user) return;
    if (!name.trim()) return toast.error(t('profile.errNameEmpty'));
    setSaving(true);
    updateMyProfile({ displayName: name.trim() });
    toast.success(t('profile.accountUpdatedToast'));
    setSaving(false);
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
  // Every preset shows today's date in that shape, so the choice is concrete.
  const dateFormatItems: SelectItem<DateFormat>[] = DATE_FORMATS.map((f) => ({
    value: f,
    label:
      f === 'system'
        ? `${t('dateFormat.system')} · ${formatDate(sampleDate, f, locale)}`
        : f === 'full'
          ? `${t('dateFormat.full')} · ${formatDate(sampleDate, f, locale)}`
          : formatDate(sampleDate, f, locale),
  }));

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
          {name || user.displayName || user.email || t('plan.tier.local')}
        </Text>
        <Text className="mb-3 text-sm text-ink-400">{user.email ?? t('profile.localAccount')}</Text>
        <View className="flex-row items-center gap-2">
          <RoleBadge role={user.role} />
          {isPremium ? (
            <View className="flex-row items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1">
              <StarIcon color={brand} size={11} />
              <Text className="font-mono-medium text-xs uppercase tracking-wider text-brand">
                {t('plan.premium')}
              </Text>
            </View>
          ) : null}
        </View>
      </Card>

      {/* Plan status — always shows the current tier; details live on /plan. */}
      <PressableScale onPress={() => router.push('/plan')} className="mt-7">
        <Card className="flex-row items-center border-brand/30 bg-brand/10">
          <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-brand">
            <StarIcon color="#08090d" size={20} />
          </View>
          <View className="flex-1 pr-2">
            <Text className="text-base font-sans-semibold text-ink-50">
              {t('plan.currentTier', { tier: t(`plan.tier.${tier}`) })}
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
          {/* Email is the cloud-account identity — managed on metri.info, read-only here. */}
          {user.email ? (
            <Input
              label={t('auth.email')}
              value={user.email}
              disabled
              hint={t('profile.emailLocked')}
            />
          ) : null}
        </View>

        <View className="mt-5">
          <Button
            variant="brand"
            label={t('common.saveChanges')}
            onPress={saveAccount}
            loading={saving}
            disabled={!dirty}
          />
        </View>
      </Card>

      {/* Password — managed on the web (single auth surface, like the email).
          Local users have no credentials anywhere, so the section hides. */}
      {isLocalOnly ? null : (
        <>
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
        </>
      )}

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

      {/* Date format */}
      <Text className="mb-2 mt-7 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('dateFormat.title')}
      </Text>
      <Card>
        <Select items={dateFormatItems} value={dateFormat.format} onChange={dateFormat.setFormat} />
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

      {/* Sign out — or, for local users, the account upgrade CTA: signing out
          of a device-only profile would just orphan their data. */}
      <View className="mt-8">
        {isLocalOnly ? (
          <Button
            label={t('profile.createAccountCta')}
            variant="secondary"
            onPress={() => router.push('/(auth)/sign-up')}
          />
        ) : (
          <Button
            label={t('profile.signOut')}
            variant="danger"
            onPress={onSignOut}
            leftIcon={<LogOutIcon color="#f87171" size={18} />}
          />
        )}
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
