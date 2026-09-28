import { useState } from 'react';

import { FadeInUp } from '@/components/ui';
import { settings } from '@/lib/storage';

import { useAppUpdate } from '../useAppUpdate';
import { UpdateCard } from './UpdateCard';

/** The update card at the top of Home — hidden per version once dismissed (the next one shows). */
export const HomeUpdateCard = () => {
  const update = useAppUpdate();
  const [dismissed, setDismissed] = useState(() => settings.getReleaseDismissed());

  if (!update || dismissed === update.release.version) return null;

  const dismiss = () => {
    settings.setReleaseDismissed(update.release.version);
    setDismissed(update.release.version);
  };

  return (
    <FadeInUp>
      <UpdateCard update={update} onDismiss={dismiss} className="mb-4" />
    </FadeInUp>
  );
};
