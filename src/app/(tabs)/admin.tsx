import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';

import { ShieldIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Card, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { countUsers } from '@/features/auth/users.repo';
import { useT } from '@/i18n';

const Admin = () => {
  const { user, hasRole } = useAuth();
  const t = useT();

  // Hard guard — even if the route is reached directly, non-admins are bounced.
  if (!hasRole('admin')) {
    return <Redirect href="/(tabs)" />;
  }

  const total = countUsers();

  return (
    <Screen scroll edges={['top']} contentClassName="px-5 pb-8">
      <TopBar title={t('admin.title')} subtitle={t('admin.subtitle')} />

      <Card>
        <View className="mb-3 flex-row items-center">
          <ShieldIcon color="#bef82b" size={18} />
          <Text className="ml-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
            {t('admin.accessGranted')}
          </Text>
        </View>
        <Text className="text-sm text-ink-300">
          {t('admin.signedInAs', { username: user?.username ?? '' })}
        </Text>
      </Card>

      <Card className="mt-4 flex-row items-center justify-between">
        <Text className="text-sm text-ink-400">{t('admin.registeredAccounts')}</Text>
        <Text className="text-2xl font-bold text-ink-50">{total}</Text>
      </Card>

      <Text className="mt-6 text-center text-xs text-ink-500">{t('admin.userMgmtSoon')}</Text>
    </Screen>
  );
};

export default Admin;
