import { useState } from 'react';
import { Text, View, type NativeSyntheticEvent, type TextLayoutEventData } from 'react-native';

import { useT } from '@/i18n';

import { TextLink } from './TextLink';

type Props = {
  children: string;
  /** Visible lines while clamped. */
  lines: number;
  className?: string;
  /** When given, "Read more" navigates instead of expanding in place. */
  onReadMore?: () => void;
};

/**
 * Body copy that may not fit: clamps to `lines` and shows a "Read more" link only
 * when the text actually overflows (measured, not guessed). Expands in place, or
 * hands off to `onReadMore` (e.g. open the detail screen).
 */
export const ClampedText = ({ children, lines, className, onReadMore }: Props) => {
  const t = useT();
  const [overflows, setOverflows] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Measured once unclamped; the clamped render never fires a longer layout.
  const onLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (e.nativeEvent.lines.length > lines) setOverflows(true);
  };

  const clamped = overflows && !expanded;
  return (
    <View>
      <Text
        key={children}
        className={className}
        numberOfLines={clamped ? lines : undefined}
        onTextLayout={overflows ? undefined : onLayout}
      >
        {children}
      </Text>
      {overflows ? (
        <TextLink
          className="mt-1"
          label={expanded ? t('common.readLess') : t('common.readMore')}
          onPress={onReadMore ?? (() => setExpanded((v) => !v))}
        />
      ) : null}
    </View>
  );
};
