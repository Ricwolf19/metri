import { Text, View } from 'react-native';

import { ScrollArea, Sheet } from '@/components/ui';
import { useT } from '@/i18n';
import { muscleHeadKey, type MuscleHead } from '@/features/training/muscles';
import type { MuscleBalance, MuscleFatigue, MuscleStrength } from '@/features/training/muscle-load';
import { balanceFill, DETRAINED_DAYS } from '@/features/training/muscle-colors';
import { useTheme } from '@/theme/theme-context';

export type MuscleDetail = {
  balance: MuscleBalance;
  fatigue: MuscleFatigue;
  strength: MuscleStrength;
  /** Exercises that trained this head in the window, most volume first. */
  exercises: { id: string; name: string; sets: number }[];
};

type Props = {
  /** Heads behind the tapped region — several, since the figure draws one
   * shape for e.g. all three deltoid heads. This is where that detail returns. */
  heads: MuscleHead[];
  details: ReadonlyMap<MuscleHead, MuscleDetail>;
  onClose: () => void;
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row items-center justify-between py-1">
    <Text className="text-xs text-ink-400">{label}</Text>
    <Text className="text-xs font-sans-semibold text-ink-100">{value}</Text>
  </View>
);

const HeadBlock = ({ head, detail }: { head: MuscleHead; detail: MuscleDetail }) => {
  const t = useT();
  const theme = useTheme();
  const { balance, fatigue, strength, exercises } = detail;

  return (
    <View className="mb-5">
      <View className="mb-2 flex-row items-center gap-2">
        <View
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: balanceFill(theme, balance.status) }}
        />
        <Text className="text-base font-sans-semibold text-ink-50">{t(muscleHeadKey(head))}</Text>
      </View>

      <Row label={t('stats.weeklySets')} value={String(balance.sets)} />
      <Row label={t('stats.fatigue')} value={`${Math.round(fatigue.index * 100)}%`} />
      <Row
        label={t('stats.lastTrained')}
        value={
          strength.daysSince == null
            ? t('stats.never')
            : strength.daysSince === 0
              ? t('stats.today')
              : t('stats.daysAgo', { n: strength.daysSince })
        }
      />
      {strength.bestE1rmKg != null ? (
        <Row label={t('stats.bestE1rm')} value={`${strength.bestE1rmKg} kg`} />
      ) : null}
      {strength.daysSince != null && strength.daysSince >= DETRAINED_DAYS ? (
        <Text className="mt-2 text-xs leading-5 text-amber-500">{t('stats.detrained')}</Text>
      ) : null}

      {exercises.length ? (
        <View className="mt-3">
          <Text className="mb-1 font-mono-medium text-[10px] uppercase tracking-wider text-ink-500">
            {t('stats.viaExercises')}
          </Text>
          {exercises.slice(0, 5).map((e) => (
            <View key={e.id} className="flex-row items-center justify-between py-0.5">
              <Text className="flex-1 text-xs text-ink-300" numberOfLines={1}>
                {e.name}
              </Text>
              <Text className="ml-3 text-xs text-ink-500">{e.sets}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

/** Per-muscle breakdown behind a tapped region on the body map. */
export const MuscleDetailSheet = ({ heads, details, onClose }: Props) => {
  const t = useT();
  return (
    <Sheet visible={heads.length > 0} onClose={onClose} snapPoints={['55%', '92%']} expandable>
      <ScrollArea inSheet className="px-5 pb-6">
        <Text className="mb-4 mt-1 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
          {t('stats.muscleDetail')}
        </Text>
        {heads.map((head) => {
          const detail = details.get(head);
          return detail ? <HeadBlock key={head} head={head} detail={detail} /> : null;
        })}
      </ScrollArea>
    </Sheet>
  );
};
