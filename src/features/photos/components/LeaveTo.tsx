import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Draws nothing and leaves for `href` once the screen has focus: for a screen
 * whose subject is gone (its check-in deleted with the last photo, from the
 * viewer above it). `<Redirect>` is a REPLACE, which put a second timeline on
 * the stack over the one already there, so Back showed the timeline again.
 * `dismissTo` goes back down to the one in the stack, or replaces when there
 * is none (a deep link straight to the screen).
 */
export const LeaveTo = ({ href }: { href: Href }) => {
  const router = useRouter();
  const left = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (left.current) return;
      left.current = true;
      router.dismissTo(href);
    }, [href, router]),
  );
  return null;
};
