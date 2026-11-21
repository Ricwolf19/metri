import { Pressable, Text, View } from 'react-native';

import { PlusIcon, XIcon } from '@/components/icons';
import { Input } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

import type { JumpText } from '../../load-sheet';
import { UnitSuffix } from '../UnitSuffix';

/**
 * Where a stack's plates, or a rack's dumbbells, change step: one row per
 * change ("from 50, every 10"), each removable, and a link that adds one.
 * Presentational — the sheet owns the list and reads it through
 * `parseJumpTexts` (a half-typed row simply does not count yet).
 */
export const StepJumpsEditor = ({
  unit,
  jumps,
  onChange,
  addLabel,
}: {
  unit: Units;
  jumps: JumpText[];
  onChange: (next: JumpText[]) => void;
  /** What adding a row means here ("Heavier plates from…", "A wider step from…"). */
  addLabel: string;
}) => {
  const t = useT();
  const { brand, muted } = useTheme();
  const patch = (index: number, next: Partial<JumpText>) =>
    onChange(jumps.map((j, i) => (i === index ? { ...j, ...next } : j)));

  return (
    <View className="mt-3 gap-2">
      {jumps.map((jump, index) => (
        // Rows are only ever appended or removed, and every field is controlled.
        <View key={index} className="flex-row items-end gap-2">
          <View className="flex-1">
            <Input
              label={t('load.jumpFrom')}
              rightSlot={<UnitSuffix label={unit} />}
              value={jump.fromText}
              onChangeText={(fromText) => patch(index, { fromText })}
              keyboardType="decimal-pad"
              maxLength={6}
            />
          </View>
          <View className="flex-1">
            <Input
              label={t('load.jumpStep')}
              rightSlot={<UnitSuffix label={unit} />}
              value={jump.stepText}
              onChangeText={(stepText) => patch(index, { stepText })}
              keyboardType="decimal-pad"
              maxLength={6}
            />
          </View>
          <Pressable
            onPress={() => onChange(jumps.filter((_, i) => i !== index))}
            accessibilityRole="button"
            accessibilityLabel={t('load.removeJump')}
            className="h-12 w-11 items-center justify-center rounded-full active:bg-ink-700"
          >
            <XIcon color={muted} size={16} />
          </Pressable>
        </View>
      ))}
      <Pressable
        onPress={() => onChange([...jumps, { fromText: '', stepText: '' }])}
        accessibilityRole="button"
        className="min-h-11 flex-row items-center gap-1 self-start"
      >
        <PlusIcon color={brand} size={14} />
        <Text
          maxFontSizeMultiplier={CONTROL_FONT_SCALE}
          className="text-xs font-sans-semibold text-brand"
        >
          {addLabel}
        </Text>
      </Pressable>
    </View>
  );
};
