import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

type Props = {
  /** The glyph, sized by the caller (16–18 px fits). */
  icon: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  /** `neutral` = raised gray disc (the default); `brand` = lime disc for the one confirming action. */
  tone?: 'neutral' | 'brand';
  disabled?: boolean;
};

/**
 * A round 36-px icon button — the control that sits in a `TopBar` `right` slot
 * or on a card's title row (share, finish, abandon). Looks like a small gray
 * (or lime) disc with a single glyph; nothing else goes inside it.
 */
export const IconButton = ({
  icon,
  onPress,
  accessibilityLabel,
  tone = 'neutral',
  disabled = false,
}: Props) => (
  <Pressable
    hitSlop={8}
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    className={[
      'h-9 w-9 items-center justify-center rounded-full',
      tone === 'brand' ? 'bg-brand' : 'bg-ink-800 active:bg-ink-700',
      disabled ? 'opacity-40' : '',
    ].join(' ')}
  >
    {icon}
  </Pressable>
);
