import { Text, View } from 'react-native';

/**
 * A single headline number with its label above and an optional unit beside it
 * — the building block of the stat rows on Progress and Analytics. Flexes to
 * share a row with its siblings, so 2–3 per `<Card className="flex-row">`.
 */
export const Stat = ({ label, value, unit }: { label: string; value: string; unit?: string }) => (
  <View className="flex-1">
    <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">{label}</Text>
    <View className="mt-1 flex-row items-baseline">
      <Text className="text-2xl font-sans-bold text-ink-50">{value}</Text>
      {unit ? <Text className="ml-1 text-sm text-ink-400">{unit}</Text> : null}
    </View>
  </View>
);
