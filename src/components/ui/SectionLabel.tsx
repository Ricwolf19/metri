import { Text, View } from 'react-native';

type Props = { label: string; icon?: React.ReactNode; className?: string };

/** Mono, uppercase section heading (the small label above a card group). */
export const SectionLabel = ({ label, icon, className }: Props) => (
  <View className={['mb-2 flex-row items-center gap-2', className ?? 'mt-7'].join(' ')}>
    {icon}
    <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">{label}</Text>
  </View>
);
