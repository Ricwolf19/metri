import { useState } from 'react';

/**
 * A key that changes on every opening of a sheet. The form inside, keyed by
 * it, starts from its defaults each time — even when the sheet reopens while
 * its close is still playing and the old form never unmounted — and keeps its
 * values while the close plays. Derived during render, like `Sheet`'s own
 * open boundary.
 */
export const useOpenKey = (visible: boolean): number => {
  const [opens, setOpens] = useState(0);
  const [seen, setSeen] = useState(visible);
  if (visible !== seen) {
    setSeen(visible);
    if (visible) setOpens((n) => n + 1);
  }
  return opens;
};
