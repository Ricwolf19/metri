import { useState } from 'react';

/**
 * Local order for a drag-and-drop list backed by a live query. A drop sets the
 * new order immediately (no snap-back while SQLite's change listener catches
 * up); the next live result wins as soon as its array identity changes.
 */
export const useReorderedList = <T>(source: T[]): [T[], (next: T[]) => void] => {
  const [state, setState] = useState({ source, items: source });
  const items = state.source === source ? state.items : source;
  const set = (next: T[]) => setState({ source, items: next });
  return [items, set];
};
