import { useRouter } from 'expo-router';
import { useState } from 'react';

import { BookIcon } from '@/components/icons';
import { PromoBanner } from '@/components/ui';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

/** "Learn before you lift": points new users at the guides. Dismiss or open snoozes it 30 days. */
export const DocsPromoBanner = () => {
  const t = useT();
  const router = useRouter();
  const { brand } = useTheme();
  const [hidden, setHidden] = useState(() => Date.now() < settings.getDocsPromoSnoozedUntil());

  if (hidden) return null;

  const snooze = () => {
    settings.snoozeDocsPromo();
    setHidden(true);
  };

  return (
    <PromoBanner
      icon={<BookIcon color={brand} size={22} />}
      title={t('home.docsPromoTitle')}
      body={t('home.docsPromoBody')}
      ctaLabel={t('home.docsPromoCta')}
      onPress={() => {
        snooze();
        router.push('/explore');
      }}
      onDismiss={snooze}
      dismissLabel={t('common.cancel')}
    />
  );
};
