import Svg, { Circle, Polyline } from 'react-native-svg';

import { SHARE } from './palette';

/** A bare trend line for the card: no axes, the last point marked. */
export const ShareSparkline = ({
  values,
  width,
  height = 44,
}: {
  values: readonly number[];
  width: number;
  height?: number;
}) => {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const pad = 4;
  const pts = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * (width - pad * 2),
    y: pad + (1 - (v - lo) / span) * (height - pad * 2),
  }));
  const last = pts[pts.length - 1];
  return (
    <Svg width={width} height={height}>
      <Polyline
        points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke={SHARE.brand}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Circle cx={last.x} cy={last.y} r={3.5} fill={SHARE.brand} />
    </Svg>
  );
};
