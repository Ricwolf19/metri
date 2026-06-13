import { Text, View } from 'react-native';

import { FFMI_BANDS, FFMI_SCALE_MAX, FFMI_SCALE_MIN } from '../calc';

const SPAN = FFMI_SCALE_MAX - FFMI_SCALE_MIN;
const TICKS = [16, 18, 20, 22, 24, 26, 28, 30];

/** Each band's width as a flex weight, clamped to the visible 16–30 scale. */
const segments = (() => {
  let start = FFMI_SCALE_MIN;
  const out: { flex: number; color: string }[] = [];
  for (const band of FFMI_BANDS) {
    const end = Math.min(band.max, FFMI_SCALE_MAX);
    if (end <= start) continue;
    out.push({ flex: end - start, color: band.color });
    start = end;
    if (start >= FFMI_SCALE_MAX) break;
  }
  return out;
})();

/** Horizontal colour scale with a marker at the current FFMI value. */
export const FfmiScale = ({ value }: { value: number | null }) => {
  const pct =
    value === null ? null : Math.max(0, Math.min(1, (value - FFMI_SCALE_MIN) / SPAN)) * 100;

  return (
    <View>
      {/* Marker */}
      <View className="h-3">
        {pct !== null ? (
          <View
            style={{
              left: `${pct}%`,
              marginLeft: -6,
              width: 0,
              height: 0,
              borderLeftWidth: 6,
              borderRightWidth: 6,
              borderTopWidth: 8,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: '#eef1f6',
            }}
            className="absolute"
          />
        ) : null}
      </View>

      {/* Colour bar */}
      <View className="h-3 flex-row overflow-hidden rounded-full">
        {segments.map((s, i) => (
          <View key={i} style={{ flex: s.flex, backgroundColor: s.color }} />
        ))}
      </View>

      {/* Ticks */}
      <View className="mt-1 flex-row justify-between">
        {TICKS.map((tick) => (
          <Text key={tick} className="text-[10px] text-ink-400">
            {tick}
          </Text>
        ))}
      </View>
    </View>
  );
};
