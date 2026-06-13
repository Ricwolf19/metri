import { View } from 'react-native';

import MetriLogo from '@/assets/images/metri-logo.svg';

/**
 * The Metri wordmark on a constant near-black rounded badge. The logo's letters
 * are white and the "e" has a dark knockout, so it only reads on a dark surface —
 * this badge guarantees that on **any** app theme (light or dark). `ink-950` is
 * the one non-themed ink token (always near-black), so the badge never inverts.
 */
export const BrandLogo = ({ width = 190 }: { width?: number }) => (
  <View className="rounded-3xl bg-ink-950 px-7 py-6">
    <MetriLogo width={width} height={width * 0.73} />
  </View>
);
