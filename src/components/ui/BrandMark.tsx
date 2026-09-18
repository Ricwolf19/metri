import { View } from 'react-native';

import MetriIcon from '@/assets/images/metri-icon.svg';

/** Icon-only brand badge (lime glyph on its near-black rounded square) for auth screens and loaders;
 * `BrandLogo` stays for hero placements. */
export const BrandMark = ({ size = 96 }: { size?: number }) => (
  <View style={{ borderRadius: size * 0.24 }} className="overflow-hidden">
    <MetriIcon width={size} height={size} />
  </View>
);
