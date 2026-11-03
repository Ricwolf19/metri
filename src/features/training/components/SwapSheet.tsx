import { Pressable, Text, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { PICKER_STOPS, ScrollArea, Sheet } from '@/components/ui';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

export type SwapOption = { id: string; label: string; hint?: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  /** The exercise on the card, listed first and checked. */
  current: SwapOption;
  /** The slot's alternatives and the equipment variants: the plan's own movement. */
  variants: SwapOption[];
  /** Other movements for the same muscles, for when no variant is within reach. */
  others: SwapOption[];
  onPick: (exerciseId: string) => void;
};

const Row = ({
  option,
  active,
  onPress,
}: {
  option: SwapOption;
  active: boolean;
  onPress: () => void;
}) => {
  const { brand } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="flex-row items-center justify-between rounded-field px-3 py-3 active:bg-ink-700"
    >
      <View className="flex-1 pr-3">
        <Text
          className={['text-base', active ? 'font-sans-semibold text-ink-50' : 'text-ink-200'].join(
            ' ',
          )}
        >
          {option.label}
        </Text>
        {option.hint ? (
          <Text numberOfLines={1} className="mt-0.5 text-xs text-ink-500">
            {option.hint}
          </Text>
        ) : null}
      </View>
      {active ? <CheckIcon color={brand} size={18} /> : null}
    </Pressable>
  );
};

/**
 * What a planned exercise can become today. The variants come first — the
 * same movement on other kit keeps the routine's structure, and that is the
 * swap to reach for. Below them, set apart, other movements for the same
 * muscles: a bigger change for the day no variant is within reach.
 */
export const SwapSheet = ({ visible, onClose, current, variants, others, onPick }: Props) => {
  const t = useT();
  const pick = (id: string) => {
    onClose();
    if (id !== current.id) onPick(id);
  };
  return (
    <Sheet visible={visible} onClose={onClose} snapPoints={PICKER_STOPS}>
      <ScrollArea inSheet>
        <Text className="mb-1 px-2 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
          {t('training.swapVariants')}
        </Text>
        <Row option={current} active onPress={() => pick(current.id)} />
        {variants.map((o) => (
          <Row key={o.id} option={o} active={false} onPress={() => pick(o.id)} />
        ))}
        {variants.length === 0 ? (
          <Text className="px-3 py-2 text-xs text-ink-500">{t('training.swapNoVariants')}</Text>
        ) : null}
        {others.length ? (
          <View className="mt-4 border-t border-ink-700 pt-3">
            <Text className="px-2 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
              {t('training.swapOthers')}
            </Text>
            <Text className="mb-1 mt-1 px-2 text-xs leading-4 text-ink-500">
              {t('training.swapOthersHint')}
            </Text>
            {others.map((o) => (
              <Row key={o.id} option={o} active={false} onPress={() => pick(o.id)} />
            ))}
          </View>
        ) : null}
      </ScrollArea>
    </Sheet>
  );
};
