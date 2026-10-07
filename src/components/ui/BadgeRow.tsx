import { Pressable, Text, View } from 'react-native';

import { ScrollRow } from './ScrollRow';

type Tone = 'muted' | 'brand' | 'info';

type Badge = {
  /** Stable key and, unless `label` says otherwise, the text shown. */
  value: string;
  label?: string;
  onPress?: () => void;
  /** Overrides the row's tone / face for this badge, so a fact about the
   * exercise (per side, `info`, sans) can share the line with technique cues
   * (brand, mono) instead of stacking under them. */
  tone?: Tone;
  mono?: boolean;
};

type Props = {
  items: Badge[];
  /** `brand` marks prescriptions the lifter must honour; `muted` is context;
   * `info` is a fact about the exercise (per side) — never a selection. */
  tone?: Tone;
  /** Renders the text in the monospaced face, for cues like `Bench 30°` — case as typed. */
  mono?: boolean;
};

const PILL: Record<Tone, string> = {
  muted: 'bg-ink-800',
  brand: 'border border-brand/25 bg-brand/10',
  info: 'border border-info/25 bg-info/10',
};
const LABEL: Record<Tone, string> = {
  muted: 'text-ink-300',
  brand: 'text-brand',
  info: 'text-info',
};

/**
 * A strip of small pills on one sideways-scrolling line — muscles a session
 * trains, cues on a set, tags on a document. Tappable badges pass `onPress`;
 * everything else renders as plain text so it never looks pressable.
 */
export const BadgeRow = ({ items, tone = 'muted', mono = false }: Props) => {
  if (!items.length) return null;

  return (
    <ScrollRow className="gap-1.5">
      {items.map((item) => {
        const itemTone = item.tone ?? tone;
        const itemMono = item.mono ?? mono;
        const text = (
          <Text
            numberOfLines={1}
            className={[
              itemMono
                ? 'font-mono-medium text-[10px] tracking-wide'
                : 'text-[11px] font-sans-medium',
              LABEL[itemTone],
            ].join(' ')}
          >
            {item.label ?? item.value}
          </Text>
        );
        const className = ['shrink-0 rounded-full px-2.5 py-1', PILL[itemTone]].join(' ');

        return item.onPress ? (
          <Pressable
            key={item.value}
            onPress={item.onPress}
            accessibilityRole="button"
            className={className}
          >
            {text}
          </Pressable>
        ) : (
          <View key={item.value} className={className}>
            {text}
          </View>
        );
      })}
    </ScrollRow>
  );
};
