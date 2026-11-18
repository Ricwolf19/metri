import { Text, View } from 'react-native';

import { SHARE } from '@/components/ui/share/palette';

import { mediaUri } from '../media';
import type { SharePanel } from '../share-model';
import { AlignedPhoto } from './AlignedPhoto';

/** Below this width a panel keeps only its first label line. */
const TWO_LINES_FROM = 120;

/**
 * One photo of a progress card: the aligned photo, the face band when asked,
 * and a mono uppercase label pill over its foot ("CUT · WEEK 6" over "12 AUG").
 * Card text never scales with the OS font size: the card is a fixed-size PNG.
 */
export const ShareCardPanel = ({
  panel,
  width,
  showLabel,
  blurTop,
}: {
  panel: SharePanel;
  width: number;
  showLabel: boolean;
  blurTop: number | null;
}) => (
  <View
    style={{ width, borderColor: SHARE.tileBorder }}
    className="overflow-hidden rounded-xl border"
  >
    <AlignedPhoto
      uri={mediaUri(panel.uri)}
      image={panel.image}
      align={panel.align}
      width={width}
      blurTop={blurTop}
    />
    {showLabel ? (
      <View
        style={{ backgroundColor: SHARE.scrim, maxWidth: width - 12 }}
        className="absolute bottom-1.5 left-1.5 rounded-md px-1.5 py-1"
      >
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={{ color: SHARE.brand }}
          className="font-mono-medium text-[9px] uppercase tracking-wider"
        >
          {panel.label}
        </Text>
        {panel.sublabel && width >= TWO_LINES_FROM ? (
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={{ color: SHARE.line }}
            className="font-mono text-[9px] uppercase tracking-wider"
          >
            {panel.sublabel}
          </Text>
        ) : null}
      </View>
    ) : null}
  </View>
);
