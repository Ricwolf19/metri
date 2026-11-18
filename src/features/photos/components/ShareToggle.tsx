import { Text, View } from 'react-native';

import { Switch } from '@/components/ui';

/** One on/off option of the share composer: the name beside its switch, the name allowed two lines. */
export const ShareToggle = ({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => (
  <View className="min-h-11 flex-row items-center gap-3">
    <Text numberOfLines={2} className="min-w-0 flex-1 text-sm font-sans-semibold text-ink-50">
      {label}
    </Text>
    <Switch value={value} onValueChange={onValueChange} accessibilityLabel={label} />
  </View>
);
