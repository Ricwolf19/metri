import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { PlaySolidIcon } from '@/components/icons';
import { Button, Card, PressableScale } from '@/components/ui';
import type { Program } from '@/db/schema';
import { presetProgramCopy } from '@/features/training/programs';
import { useI18n, useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

type Props = { program: Program };

/** Fixed-height program tile: body opens the detail (edit/delete live there); Start goes to validation + schedule. */
export const ProgramCard = ({ program }: Props) => {
  const router = useRouter();
  const t = useT();
  const { locale } = useI18n();
  const { brandContrast } = useTheme();
  const preset = presetProgramCopy(program.id, locale);

  return (
    <PressableScale
      onPress={() =>
        router.push({ pathname: '/training/program/[id]', params: { id: program.id } })
      }
    >
      <Card className="h-44 justify-between">
        <View>
          <Text className="text-base font-sans-semibold text-ink-50" numberOfLines={1}>
            {preset?.name ?? program.name}
          </Text>
          <Text
            className={[
              'mt-1 min-h-10 text-sm leading-5',
              program.description ? 'text-ink-300' : 'text-ink-500',
            ].join(' ')}
            numberOfLines={2}
          >
            {preset?.description ?? (program.description || t('training.noDescription'))}
          </Text>
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
