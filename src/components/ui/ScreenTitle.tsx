import { Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
};

/**
 * The large page title, rendered as the first block of a screen's CONTENT (not
 * in the navbar) so it scrolls away and gives the height back — the iOS
 * large-title pattern. Full width by design: it never competes with the back
 * chevron or the header accessories, so long titles and subtitles wrap instead
 * of truncating.
 */
export const ScreenTitle = ({ title, subtitle }: Props) => (
  <View className="mb-5">
    <Text className="text-[28px] font-sans-bold leading-9 text-ink-50">{title}</Text>
    {subtitle ? <Text className="mt-1.5 text-sm leading-5 text-ink-400">{subtitle}</Text> : null}
  </View>
);
