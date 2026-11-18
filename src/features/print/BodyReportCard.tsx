import { Text, View } from 'react-native';

import { Button, Card } from '@/components/ui';
import type { Sex } from '@/db/schema';
import { useBodyLog } from '@/features/body/useBodyLog';
import { useI18n, useT } from '@/i18n';
import { settings } from '@/lib/storage';
import { useDateFormat } from '@/lib/useDateFormat';

import { bodyReportHtml } from './body-report';
import { bodyReportInput } from './body-report-data';
import { usePdfActions } from './usePdfActions';

/**
 * The "Body & training report" entry on the data screen: the metri.info body
 * page's printable report, built on the phone from the lifter's own log and
 * shared or printed from there.
 */
export const BodyReportCard = ({ userId, sex }: { userId: string; sex: Sex | null }) => {
  const t = useT();
  const { locale } = useI18n();
  const { date, dateKey } = useDateFormat();
  const log = useBodyLog(userId, sex);
  const pdf = usePdfActions();

  const onOpen = () =>
    pdf.open(t('print.bodyTitle'), () => ({
      title: t('print.bodyTitle'),
      html: bodyReportHtml(
        bodyReportInput({
          userId,
          sex,
          log,
          units: settings.getUnits(),
          locale,
          t,
          printedOn: t('print.printedOn', { date: date(new Date()) }),
          dateKey,
        }),
        t,
      ),
    }));

  return (
    <Card>
      <Text className="text-base font-sans-semibold text-ink-50">{t('print.bodyTitle')}</Text>
      <Text className="mt-1 text-sm leading-6 text-ink-400">{t('print.bodyCardBody')}</Text>
      <View className="mt-4">
        <Button label={t('print.bodyReport')} variant="secondary" onPress={onOpen} />
      </View>
      {pdf.overlay}
    </Card>
  );
};
