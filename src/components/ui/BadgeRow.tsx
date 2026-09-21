import { Pressable, Text, View } from 'react-native';

import { ScrollRow } from './ScrollRow';

type Badge = {
  /** Stable key and, unless `label` says otherwise, the text shown. */
  value: string;
  label?: string;
  onPress?: () => void;
};

type Tone = 'muted' | 'brand';

type Props = {
  items: Badge[];
  /** `brand` marks prescriptions the lifter must honour; `muted` is context. */
  tone?: Tone;
  /** Renders the text in the monospaced face, for cues like `BENCH 30°`. */
  mono?: boolean;
};

const PILL: Record<Tone, string> = {
  muted: 'bg-ink-800',
  brand: 'border border-brand/25 bg-brand/10',
};
const LABEL: Record<Tone, string> = { muted: 'text-ink-300', brand: 'text-brand' };

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
        const text = (
          <Text
            numberOfLines={1}
            className={[
              mono
                ? 'font-mono-medium text-[10px] uppercase tracking-wide'
                : 'text-[11px] font-sans-medium',
              LABEL[tone],
            ].join(' ')}
          >
            {item.label ?? item.value}
          </Text>
        );
        const className = ['shrink-0 rounded-full px-2.5 py-1', PILL[tone]].join(' ');

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
