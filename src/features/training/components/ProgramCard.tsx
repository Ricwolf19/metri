import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { PlaySolidIcon } from '@/components/icons';
import { Button, Card, PressableScale } from '@/components/ui';
import type { Program } from '@/db/schema';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

type Props = { program: Program };

/** Fixed-height program tile: body opens the detail (edit/delete live there); Start goes to validation + schedule. */
export const ProgramCard = ({ program }: Props) => {
  const router = useRouter();
  const t = useT();
  const { brandContrast } = useTheme();

  return (
    <PressableScale
      onPress={() =>
        router.push({ pathname: '/training/program/[id]', params: { id: program.id } })
      }
    >
      <Card className="h-44 justify-between">
        <View>
          <Text className="text-base font-sans-semibold text-ink-50" numberOfLines={1}>
            {program.name}
          </Text>
          <Text
            className={[
              'mt-1 min-h-10 text-sm leading-5',
              program.description ? 'text-ink-300' : 'text-ink-500',
            ].join(' ')}
            numberOfLines={2}
          >
            {program.description || t('training.noDescription')}
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
