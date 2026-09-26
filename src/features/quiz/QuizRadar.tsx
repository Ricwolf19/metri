import { Text, View } from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';

import { useT, type TranslationKey } from '@/i18n';
import { THEME_VARS } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-context';

import { QUIZ_AREAS, QUIZ_MAX_LEVEL } from './areas';
import type { QuizScores } from './scores';

export const AREA_KEY: Record<(typeof QUIZ_AREAS)[number], TranslationKey> = {
  nutrition: 'quiz.area.nutrition',
  training: 'quiz.area.training',
  body: 'quiz.area.body',
  fundamentals: 'quiz.area.fundamentals',
};

export const LEVEL_KEY: TranslationKey[] = [
  'quiz.level0',
  'quiz.level1',
  'quiz.level2',
  'quiz.level3',
  'quiz.level4',
];

const SIZE = 220;
const R = SIZE / 2 - 12;

/** Axis `i` of `n`, starting at 12 o'clock and running clockwise. */
const point = (i: number, n: number, fraction: number): [number, number] => {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return [SIZE / 2 + Math.cos(angle) * R * fraction, SIZE / 2 + Math.sin(angle) * R * fraction];
};

const polygon = (fractions: number[]) =>
  fractions.map((f, i) => point(i, fractions.length, f).join(',')).join(' ');

/**
 * Per-area knowledge as a radar: one axis per area, one ring per level. The
 * table beside it carries the same numbers in words, so the shape is never the
 * only way to read a score.
 */
export const QuizRadar = ({ scores }: { scores: QuizScores }) => {
  const t = useT();
  const { brand, scheme } = useTheme();
  const ink = (token: string) => `rgb(${THEME_VARS[scheme][token]})`;
  const n = QUIZ_AREAS.length;
  const rings = Array.from({ length: QUIZ_MAX_LEVEL }, (_, i) => (i + 1) / QUIZ_MAX_LEVEL);
  // A floor keeps a zero score visible as a dot at the centre, not nothing.
  const values = QUIZ_AREAS.map((a) => Math.max(scores[a] / QUIZ_MAX_LEVEL, 0.04));

  return (
    <View className="items-center">
      <Svg width={SIZE} height={SIZE}>
        {rings.map((f) => (
          <Polygon
            key={f}
            points={polygon(Array(n).fill(f))}
            fill="none"
            stroke={ink('--ink-600')}
            strokeWidth={1}
          />
        ))}
        {QUIZ_AREAS.map((a, i) => {
          const [x, y] = point(i, n, 1);
          return (
            <Line key={a} x1={SIZE / 2} y1={SIZE / 2} x2={x} y2={y} stroke={ink('--ink-600')} />
          );
        })}
        <Polygon
          points={polygon(values)}
          fill={brand}
          fillOpacity={0.25}
          stroke={brand}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </Svg>
      <View className="mt-4 w-full gap-2">
        {QUIZ_AREAS.map((a) => (
          <View key={a} className="flex-row items-baseline justify-between">
            <Text className="shrink text-sm font-sans-medium text-ink-100" numberOfLines={1}>
              {t(AREA_KEY[a])}
            </Text>
            <Text className="ml-3 font-mono text-xs text-ink-300">
              {t(LEVEL_KEY[scores[a]]!)} · {scores[a]}/{QUIZ_MAX_LEVEL}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
