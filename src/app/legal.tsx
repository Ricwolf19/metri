import Markdown from 'react-native-markdown-display';

import { TopBar } from '@/components/TopBar';
import { Button, Card, Screen, ScreenTitle } from '@/components/ui';
import { markdownStyles } from '@/features/docs/markdownStyles';
import { getLegal } from '@/features/legal/content';
import { useRouter } from 'expo-router';

import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const Legal = () => {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { scheme } = useTheme();

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-12"
      header={<TopBar showBack showAvatar={false} />}
      footer={
        <Button
          label={t('common.continue')}
          variant="brand"
          fullWidth
          onPress={() => router.back()}
        />
      }
    >
      <ScreenTitle title={t('legal.title')} />
      <Card>
        <Markdown style={markdownStyles(scheme)}>{getLegal(locale)}</Markdown>
      </Card>
    </Screen>
  );
};

export default Legal;
