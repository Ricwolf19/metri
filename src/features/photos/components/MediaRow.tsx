import { Pressable } from 'react-native';

import { ScrollRow } from '@/components/ui';
import type { ProgressPhoto } from '@/db/schema';
import { useT } from '@/i18n';

import { mediaLabel } from '../format';
import { MediaThumb } from './MediaThumb';

/** A sideways strip of photos or clips (never wraps, AGENTS "A strip … scrolls"); a tap opens one. */
export const MediaRow = ({
  items,
  onOpen,
}: {
  items: readonly ProgressPhoto[];
  onOpen: (mediaId: string) => void;
}) => {
  const t = useT();
  return (
    <ScrollRow className="gap-3">
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
