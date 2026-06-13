import { Text, View } from 'react-native';

import type { UserRole } from '@/db/schema';

/** Small pill that surfaces a user's role; admin gets the lime accent. */
export const RoleBadge = ({ role }: { role: UserRole }) => {
  const isAdmin = role === 'admin';
  return (
    <View
      className={[
        'self-start rounded-full px-2.5 py-1',
        isAdmin ? 'bg-lime-400/15' : 'bg-ink-700',
      ].join(' ')}
    >
      <Text
        className={[
          'text-xs font-semibold uppercase tracking-wider',
          isAdmin ? 'text-accent' : 'text-ink-300',
        ].join(' ')}
      >
        {role}
      </Text>
    </View>
  );
};
