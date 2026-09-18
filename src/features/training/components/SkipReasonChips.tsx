import { Pressable, Text, View } from 'react-native';

import { SKIP_REASONS, type SkipReason } from '@/db/schema';
import { useT, type TranslationKey } from '@/i18n';

/** The "why was it missed?" chip row shared by the day sheet and the catch-up banner. */
export const SkipReasonChips = ({ onPick }: { onPick: (reason: SkipReason) => void }) => {
  const t = useT();
  return (
    <View className="mt-4 flex-row flex-wrap gap-2">
      {SKIP_REASONS.map((r) => (
        <Pressable
          key={r}
          onPress={() => onPick(r)}
          accessibilityRole="button"
          className="rounded-full border border-ink-700 bg-ink-800 px-3 py-1.5"
        >
          <Text className="text-xs font-sans-medium text-ink-300">
            {t(`reason.${r}` as TranslationKey)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};
