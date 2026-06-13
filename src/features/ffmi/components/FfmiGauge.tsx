import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { FFMI_SCALE_MAX, FFMI_SCALE_MIN } from '../calc';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 220;
const STROKE = 16;
const R = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const C = 2 * Math.PI * R;
const SWEEP = 0.75; // 270° gauge, open at the bottom
const ARC = C * SWEEP;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

type Props = {
  /** The FFMI value the arc points to (clamped to the 16–30 scale). */
  value: number | null;
  /** Classification colour for the filled arc. */
  color: string;
  children?: React.ReactNode;
};

/**
 * A 270° circular gauge for FFMI. The filled arc animates smoothly whenever the
 * value changes, so editing height/weight/body-fat visibly moves the needle.
 */
export const FfmiGauge = ({ value, color, children }: Props) => {
  const progress = clamp01(
    ((value ?? FFMI_SCALE_MIN) - FFMI_SCALE_MIN) / (FFMI_SCALE_MAX - FFMI_SCALE_MIN),
  );
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value === null ? 0 : progress,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [anim, progress, value]);

  const dashoffset = anim.interpolate({ inputRange: [0, 1], outputRange: [ARC, 0] });

  return (
    <View style={{ width: SIZE, height: SIZE }} className="items-center justify-center">
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        {/* Rotate so the 270° arc opens at the bottom. */}
        <G rotation={135} origin={`${CX}, ${CX}`}>
          <Circle
            cx={CX}
            cy={CX}
            r={R}
            stroke="#222a39"
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${ARC} ${C}`}
          />
          <AnimatedCircle
            cx={CX}
            cy={CX}
            r={R}
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${ARC} ${C}`}
            strokeDashoffset={dashoffset}
          />
        </G>
      </Svg>
      <View className="items-center">{children}</View>
    </View>
  );
};
