import { useEffect, useRef, useState } from 'react';
import {
  useForm,
  useFormState,
  useWatch,
  type FieldValues,
  type UseFormProps,
} from 'react-hook-form';

import { captureError } from '@/lib/telemetry';

/**
 * What a save answers: `false` refuses (the form keeps what was typed),
 * values replace what the form holds from now on, nothing keeps what was
 * submitted.
 */
type SaveResult<T> = T | false | void;
type SaveHandler<T> = (values: T) => SaveResult<T> | Promise<SaveResult<T>>;

type Options<T extends FieldValues> = Omit<UseFormProps<T>, 'mode'> & {
  onSave: SaveHandler<T>;
  /**
   * `edit` (default): Save needs a real change, and what was saved becomes the
   * new baseline. `create`: valid values are enough, and one success closes the
   * form for good — the screen or sheet is on its way out, so a second tap
   * writes nothing.
   */
  kind?: 'edit' | 'create';
  /**
   * The values as they are stored (trimmed text). A change that disappears
   * here (a trailing space) is no change, and `onSave` receives these.
   */
  normalize?: (values: T) => T;
  /** A save met invalid values (the button is disabled; the leave guard and the keyboard still ask). */
  onInvalid?: () => void;
};

/** Form values are plain data (text, numbers, null, arrays of those). */
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

const isPromise = <R>(value: R | Promise<R>): value is Promise<R> =>
  typeof (value as Promise<R> | null)?.then === 'function';

/**
 * Every form's one wiring: react-hook-form underneath, plus the rules the
 * app's saves keep. Save only when something really changed (`isDirty`
 * compares the values with what was loaded, so typing a change back undoes
 * it); one write per press (shut from the press until the render after the
 * save, so a double tap — or the keyboard's "go" beside the button — never
 * writes twice); after a save, the saved values are the fresh baseline.
 *
 * Edit screens pass the loaded row as `defaultValues`, read once when the form
 * is created; to start over on other data, `reset(next)` from the event that
 * loads it. `saveNow` is the synchronous path `useUnsavedGuard`'s Save & leave
 * needs.
 */
export const useSaveForm = <T extends FieldValues>({
  onSave,
  kind = 'edit',
  normalize,
  onInvalid,
  ...props
}: Options<T>) => {
  const form = useForm<T>({ ...props, mode: 'onChange' });
  // Read through the hooks, not `form.formState`: they hand back a new object
  // per change, so the React Compiler never memoizes a stale flag.
  const {
    isDirty: rawDirty,
    isValid,
    isSubmitting,
    defaultValues,
  } = useFormState({ control: form.control });
  // Only a normalizing form needs every keystroke here.
  const values = useWatch({ control: form.control, disabled: !normalize }) as T;
  const isDirty =
    rawDirty && (!normalize || !same(normalize(values), normalize(defaultValues as T)));
  const [saves, setSaves] = useState(0);
  const busy = useRef(false);
  // A save re-renders the form clean (or closed); only then may a press count again.
  useEffect(() => {
    busy.current = false;
  }, [saves]);

  const canSave = (kind === 'create' ? saves === 0 : isDirty) && isValid && !isSubmitting;

  const settle = (sent: T, result: SaveResult<T>): boolean => {
    if (result === false) {
      busy.current = false;
      return false;
    }
    // Never keep a typed value over the saved one (a form following `values`
    // keeps dirty fields on its own resets).
    form.reset(result ?? sent, { keepDirtyValues: false });
    setSaves((n) => n + 1);
    return true;
  };

  const fail = (error: unknown) => {
    busy.current = false;
    captureError(error);
  };

  const prepare = (raw: T): T => (normalize ? normalize(raw) : raw);

  /** The Save button and the keyboard's submit. `handler` runs a second action through the same gate (onboarding's Skip). */
  const submit = (handler: SaveHandler<T> = onSave) => {
    if (busy.current) return;
    if (!canSave) {
      if (!isValid) onInvalid?.();
      return;
    }
    busy.current = true;
    void form
      .handleSubmit(
        async (raw) => {
          const sent = prepare(raw);
          settle(sent, await handler(sent));
        },
        () => {
          busy.current = false;
          onInvalid?.();
        },
      )()
      .catch(fail);
  };

  const saveNow = (): boolean => {
    if (busy.current) return false;
    if (!isValid) {
      onInvalid?.();
      return false;
    }
    if (kind === 'edit' ? !isDirty : saves > 0) return true;
    busy.current = true;
    const sent = prepare(form.getValues());
    try {
      const result = onSave(sent);
      if (!isPromise(result)) return settle(sent, result);
      void result.then((r) => settle(sent, r), fail);
      return true;
    } catch (e) {
      fail(e);
      return false;
    }
  };

  return {
    ...form,
    /** Valid, and changed (edit) or not sent yet (create), with no save under way. */
    canSave,
    /** Something differs from the baseline (after `normalize`) — what the leave guard asks about. */
    isDirty,
    /** A save is running — for an async save's spinner; a synchronous one never shows it. */
    saving: isSubmitting,
    /** At least one save went through since the form was created. */
    saved: saves > 0,
    submit,
    saveNow,
  };
};
