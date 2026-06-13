import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { CameraIcon, LogOutIcon, ShieldIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Avatar,
  AVATAR_COLORS,
  Button,
  Card,
  Input,
  PressableScale,
  Screen,
  SegmentedControl,
  useToast,
  type Segment,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { RoleBadge } from '@/features/auth/components/RoleBadge';
import { RoleGate } from '@/features/auth/components/RoleGate';
import { pickFromCamera, pickFromLibrary } from '@/features/photos/capture';
import { deletePhotoFiles, persistAvatar } from '@/features/photos/media';
import { LOCALES, useI18n, type Locale } from '@/i18n';
import { settings, type ClockFormat } from '@/lib/storage';
import { ThemeSelect } from '@/theme/ThemeSelect';
import { useTheme } from '@/theme/theme-context';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MetricRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-sm text-ink-400">{label}</Text>
      <Text className="text-sm font-medium text-ink-100">{value}</Text>
    </View>
  );
};

const Profile = () => {
  const { user, updateMyProfile, updateMyAccount, changeMyPassword, signOut } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const { accent } = useTheme();
  const toast = useToast();
  const router = useRouter();

  const [name, setName] = useState(user?.displayName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [color, setColor] = useState(user?.avatarColor ?? AVATAR_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [clock, setClock] = useState<ClockFormat>(settings.getClockFormat());

  if (!user) return null;

  const dirty =
    name.trim() !== (user.displayName ?? '') ||
    username.trim().toLowerCase() !== user.username ||
    email.trim().toLowerCase() !== user.email ||
    color !== (user.avatarColor ?? '');

  const saveAccount = async () => {
    if (!user) return;
    if (!name.trim()) return toast.error(t('profile.errNameEmpty'));
    if (username.trim().length < 3) return toast.error(t('auth.errUsername'));
    if (!EMAIL_RE.test(email.trim())) return toast.error(t('auth.errEmail'));

    setSaving(true);
    try {
      const nextUsername = username.trim().toLowerCase();
      const nextEmail = email.trim().toLowerCase();
      if (nextUsername !== user.username || nextEmail !== user.email) {
        await updateMyAccount({ username: nextUsername, email: nextEmail });
      }
      updateMyProfile({ displayName: name.trim(), avatarColor: color });
      toast.success(t('profile.accountUpdatedToast'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('auth.errEmail'));
    } finally {
      setSaving(false);
    }
  };

  const changePw = async () => {
    if (newPassword.length < 6) return toast.error(t('auth.errPassword'));
    setChangingPw(true);
    try {
      await changeMyPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      toast.success(t('profile.passwordUpdatedToast'));
    } catch {
      toast.error(t('profile.errCurrentPassword'));
    } finally {
      setChangingPw(false);
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
    Alert.alert(t('photos.chooseTitle'), undefined, [
      { text: t('photos.camera'), onPress: () => setPhoto('camera') },
      { text: t('photos.library'), onPress: () => setPhoto('library') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
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
  };
  const hasMetrics = typeof user.age === 'number';

  return (
    <Screen scroll edges={['top']} contentClassName="px-5 pb-10">
      <TopBar title={t('profile.title')} showAvatar={false} />

      <Card className="items-center">
        <Pressable onPress={onChangePhoto} accessibilityRole="button" className="relative">
          <Avatar name={name || user.username} uri={user.avatarUri} color={color} size={84} />
          <View className="absolute -bottom-0.5 -right-0.5 h-7 w-7 items-center justify-center rounded-full border-2 border-ink-800 bg-accentFill">
            <CameraIcon color="#08090d" size={13} />
          </View>
        </Pressable>
        <Text className="mt-3 text-xl font-bold text-ink-50">{name || user.username}</Text>
        <Text className="mb-3 text-sm text-ink-400">
          @{user.username} · {user.email}
        </Text>
        <RoleBadge role={user.role} />
      </Card>

      {/* Account */}
      <Text className="mb-2 mt-7 text-xs font-semibold uppercase tracking-wider text-ink-400">
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
          <Input
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>

        <Text className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-ink-300">
          {t('profile.avatarColor')}
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {AVATAR_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              accessibilityRole="button"
              accessibilityState={{ selected: c === color }}
              style={{ backgroundColor: c }}
              className={[
                'h-9 w-9 rounded-full',
                c === color ? 'border-2 border-ink-50' : 'border border-ink-600',
              ].join(' ')}
            />
          ))}
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

      {/* Change password */}
      <Text className="mb-2 mt-7 text-xs font-semibold uppercase tracking-wider text-ink-400">
        {t('profile.changePassword')}
      </Text>
      <Card>
        <View className="gap-4">
          <Input
            label={t('profile.currentPassword')}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            textContentType="password"
            autoComplete="current-password"
          />
          <Input
            label={t('profile.newPassword')}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            placeholder={t('auth.passwordMin')}
          />
        </View>
        <View className="mt-5">
          <Button
            label={t('profile.updatePassword')}
            variant="secondary"
            onPress={changePw}
            loading={changingPw}
            disabled={!currentPassword || !newPassword}
          />
        </View>
      </Card>

      {/* Appearance */}
      <Text className="mb-2 mt-7 text-xs font-semibold uppercase tracking-wider text-ink-400">
        {t('theme.title')}
      </Text>
      <Card>
        <ThemeSelect />
      </Card>

      {/* Language */}
      <Text className="mb-2 mt-7 text-xs font-semibold uppercase tracking-wider text-ink-400">
        {t('profile.language')}
      </Text>
      <Card>
        <SegmentedControl segments={localeSegments} value={locale} onChange={setLocale} />
      </Card>

      {/* Time format */}
      <Text className="mb-2 mt-7 text-xs font-semibold uppercase tracking-wider text-ink-400">
        {t('profile.timeFormat')}
      </Text>
      <Card>
        <SegmentedControl segments={clockSegments} value={clock} onChange={onClockChange} />
      </Card>

      {/* Body metrics */}
      <Text className="mb-2 mt-7 text-xs font-semibold uppercase tracking-wider text-ink-400">
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
            onPress={() => router.push('/calculators/bmr')}
          />
        </View>
      </Card>

      {/* Admin-only shortcut — rendered through the role gate. */}
      <RoleGate role="admin">
        <PressableScale onPress={() => router.push('/(tabs)/admin')} className="mt-7">
          <Card className="flex-row items-center">
            <View className="mr-4 h-11 w-11 items-center justify-center rounded-xl bg-lime-400/15">
              <ShieldIcon color={accent} size={22} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-ink-50">{t('profile.adminPanel')}</Text>
              <Text className="mt-0.5 text-sm text-ink-400">{t('profile.adminPanelDesc')}</Text>
            </View>
          </Card>
        </PressableScale>
      </RoleGate>

      {/* Sign out */}
      <View className="mt-8">
        <Button
          label={t('profile.signOut')}
          variant="danger"
          onPress={onSignOut}
          leftIcon={<LogOutIcon color="#f87171" size={18} />}
        />
      </View>

      <Pressable
        onPress={() => router.push('/legal')}
        accessibilityRole="button"
        className="mt-6 items-center"
      >
        <Text className="text-xs font-semibold text-ink-400">{t('legal.title')}</Text>
      </Pressable>
    </Screen>
  );
};

export default Profile;
