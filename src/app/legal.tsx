import Markdown from 'react-native-markdown-display';

import { TopBar } from '@/components/TopBar';
import { Card, Screen } from '@/components/ui';
import { markdownStyles } from '@/features/docs/markdownStyles';
import { getLegal } from '@/features/legal/content';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const Legal = () => {
  const { t, locale } = useI18n();
  const { scheme } = useTheme();

  return (
    <Screen scroll contentClassName="px-5 pb-12">
      <TopBar title={t('legal.title')} showBack showAvatar={false} />
      <Card>
        <Markdown style={markdownStyles(scheme)}>{getLegal(locale)}</Markdown>
      </Card>
    </Screen>
  );
};

export default Legal;
