export type DialogAction = {
  label: string;
  /** `confirm` = brand (main action); `destructive` = red hold button (no accidental tap);
   * `cancel` = ghost; default = secondary surface. */
  style?: 'default' | 'confirm' | 'destructive' | 'cancel';
  onPress?: () => void;
};

/**
 * The way out is always the LAST button — the platform convention everywhere
 * else, and the order a thumb expects on a bottom-anchored stack. Enforced in
 * the component rather than trusted to each caller, so a new dialog cannot
 * reintroduce the inversion.
 *
 * A stable partition, not a sort: everything that is not the way out keeps the
 * order the caller chose (save-and-leave still precedes discard).
 */
export const cancelLast = (actions: DialogAction[]): DialogAction[] => [
  ...actions.filter((a) => a.style !== 'cancel'),
  ...actions.filter((a) => a.style === 'cancel'),
];
