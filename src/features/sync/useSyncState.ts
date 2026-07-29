import { useSyncExternalStore } from 'react';

import { getSyncState, subscribeSyncState } from './status';

/** Subscribe a component to the live sync state. */
export const useSyncState = () =>
  useSyncExternalStore(subscribeSyncState, getSyncState, getSyncState);
