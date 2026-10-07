import { Text } from 'react-native';

/** The small mono section heading the weight sheet repeats above each control. */
export const LoadSectionLabel = ({ label, first = false }: { label: string; first?: boolean }) => (
  <Text
    className={[
      'mb-1.5 font-mono-medium text-xs uppercase tracking-wider text-ink-300',
      first ? '' : 'mt-4',
    ].join(' ')}
  >
    {label}
  </Text>
);
