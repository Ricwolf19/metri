import { AppleIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { ComingSoon, Screen } from '@/components/ui';
import { useT } from '@/i18n';

/** Nutrition — announced as a main section; the tracker ships later. */
const Nutrition = () => {
  const t = useT();
  return (
    <Screen edges={['top']} header={<TopBar menu showFaq showBeta />}>
      <ComingSoon Icon={AppleIcon} title={t('nutrition.title')} body={t('nutrition.comingBody')} />
    </Screen>
  );
};

export default Nutrition;
