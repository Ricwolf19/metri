import { Pressable } from 'react-native';

import { SCREEN_GUTTER, ScrollRow } from '@/components/ui';
import type { ProgressPhoto } from '@/db/schema';
import { useT } from '@/i18n';

import { mediaLabel } from '../format';
import { MediaThumb } from './MediaThumb';

/**
 * A sideways strip of photos or clips (never wraps, AGENTS "A strip … scrolls");
 * a tap opens one. It sits straight on the check-in screen's px-5 content.
 */
export const MediaRow = ({
  items,
  onOpen,
}: {
  items: readonly ProgressPhoto[];
  onOpen: (mediaId: string) => void;
}) => {
  const t = useT();
  return (
    <ScrollRow className="gap-3" bleed={SCREEN_GUTTER}>
      {items.map((m) => (
        <Pressable
          key={m.id}
          onPress={() => onOpen(m.id)}
          accessibilityRole="button"
          accessibilityLabel={mediaLabel(t, m)}
          className="w-24"
        >
          <MediaThumb media={m} />
        </Pressable>
      ))}
    </ScrollRow>
  );
};
