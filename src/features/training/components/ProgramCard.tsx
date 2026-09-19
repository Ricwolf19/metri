import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { PlaySolidIcon } from '@/components/icons';
import { Button, Card, ClampedText, PressableScale } from '@/components/ui';
import type { Program } from '@/db/schema';
import { presetProgramCopy } from '@/features/training/programs';
import { useI18n, useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

type Props = { program: Program };

/** Program tile: body opens the detail (edit/delete live there); Start goes to validation + schedule. */
export const ProgramCard = ({ program }: Props) => {
  const router = useRouter();
  const t = useT();
  const { locale } = useI18n();
  const { brandContrast } = useTheme();
  const preset = presetProgramCopy(program.id, locale);
  const openDetail = () =>
    router.push({ pathname: '/training/program/[id]', params: { id: program.id } });

  return (
    <PressableScale onPress={openDetail}>
      <Card className="gap-4">
        <View>
          <Text className="text-base font-sans-semibold text-ink-50" numberOfLines={1}>
            {preset?.name ?? program.name}
          </Text>
          <ClampedText
            lines={2}
            onReadMore={openDetail}
            className={[
              'mt-1 text-sm leading-5',
              program.description ? 'text-ink-300' : 'text-ink-500',
            ].join(' ')}
          >
            {preset?.description ?? (program.description || t('training.noDescription'))}
          </ClampedText>
        </View>
        <Button
          variant="brand"
          size="xl"
          label={t('training.start')}
          leftIcon={<PlaySolidIcon size={18} color={brandContrast} />}
          onPress={() =>
            router.push({ pathname: '/training/start/[id]', params: { id: program.id } })
          }
        />
      </Card>
    </PressableScale>
  );
};
