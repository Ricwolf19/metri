import { Pressable, Text, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

/**
 * "I agree to the terms" as one checkbox row, shared by sign-up and the
 * local start. The caller owns the state (and opens the terms on check).
 */
export const TermsCheckbox = ({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) => {
  const t = useT();
  const { brandContrast } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className="min-h-11 flex-row items-center gap-3"
    >
      <View
        className={[
          // Border-2 ink-500: the unchecked box must read (it was 1.91:1).
          'h-6 w-6 items-center justify-center rounded-field border-2',
          checked ? 'border-brand bg-brand' : 'border-ink-500 bg-transparent',
        ].join(' ')}
      >
        {checked ? <CheckIcon color={brandContrast} size={16} /> : null}
      </View>
      <Text className="flex-1 text-sm text-ink-300">
        {t('auth.agree')} <Text className="font-sans-semibold text-brand">{t('legal.title')}</Text>
      </Text>
    </Pressable>
  );
};
