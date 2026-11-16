import { useLiveQuery } from '@/db/useLiveQuery';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ControlledInput, useSaveForm } from '@/components/form';
import { EditIcon, TrashIcon } from '@/components/icons';
import { Button, HoldButton, TextLink, useToast } from '@/components/ui';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { exerciseNoteQuery, saveExerciseNote } from '../exercise-notes.repo';

/**
 * The lifter's own note on an exercise ("left shoulder nags below parallel").
 * Global to the exercise, so it follows it into every future session; edited
 * in place, deleted by hold. `compact` is the live-session variant: one line
 * of chrome, no call to action until there is something to say — the session
 * card opens the editor from its own pencil (`editing` / `onEditingChange`).
 */
export const ExerciseNote = ({
  userId,
  exerciseId,
  compact = false,
  className = '',
  editing: controlled,
  onEditingChange,
}: {
  userId: string;
  exerciseId: string;
  compact?: boolean;
  /** Spacing for the root — applied only when something renders. */
  className?: string;
  /** Controlled editor state, for a caller that opens it from elsewhere. */
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
}) => {
  const t = useT();
  const { muted } = useTheme();
  const { data } = useLiveQuery(exerciseNoteQuery(userId, exerciseId), [userId, exerciseId]);
  const note = data[0]?.note ?? null;
  const [own, setOwn] = useState(false);
  const editing = controlled ?? own;
  const setEditing = (next: boolean) => {
    setOwn(next);
    onEditingChange?.(next);
  };

  // The editor mounts per opening, so it starts from the saved note each time.
  if (editing) {
    return (
      <NoteEditor
        userId={userId}
        exerciseId={exerciseId}
        note={note}
        className={className}
        onDone={() => setEditing(false)}
      />
    );
  }

  const startEdit = () => setEditing(true);

  if (!note) {
    return compact ? null : (
      <TextLink label={t('exNote.add')} onPress={startEdit} className={className} />
    );
  }

  return (
    <Pressable
      onPress={startEdit}
      accessibilityRole="button"
      accessibilityLabel={t('exNote.edit')}
      className={`flex-row items-start gap-2 rounded-field bg-ink-850 px-3 py-2 ${className}`}
    >
      <Text className="flex-1 text-xs leading-5 text-ink-300">{note}</Text>
      <EditIcon color={muted} size={14} />
    </Pressable>
  );
};

const NoteEditor = ({
  userId,
  exerciseId,
  note,
  className,
  onDone,
}: {
  userId: string;
  exerciseId: string;
  note: string | null;
  className: string;
  onDone: () => void;
}) => {
  const t = useT();
  const toast = useToast();
  const { danger } = useTheme();
  // Save only a real change: the note is stored trimmed, so spaces alone are none.
  const form = useSaveForm<{ note: string }>({
    defaultValues: { note: note ?? '' },
    normalize: (v) => ({ note: v.note.trim() }),
    onSave: (v) => {
      saveExerciseNote(userId, exerciseId, v.note);
      onDone();
      toast.success(t('exNote.saved'));
    },
  });
  const remove = () => {
    saveExerciseNote(userId, exerciseId, '');
    onDone();
    toast.info(t('exNote.deleted'));
  };

  return (
    <View className={`gap-2 ${className}`}>
      <ControlledInput
        control={form.control}
        name="note"
        placeholder={t('exNote.placeholder')}
        multiline
        autoFocus
        maxLength={500}
      />
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <Button label={t('common.cancel')} size="sm" onPress={onDone} />
        </View>
        <View className="flex-1">
          <Button
            label={t('editor.save')}
            size="sm"
            variant="brand"
            disabled={!form.canSave}
            onPress={() => form.submit()}
          />
        </View>
        {note ? (
          <HoldButton
            icon={<TrashIcon color={danger} size={16} />}
            accessibilityLabel={t('exNote.delete')}
            onComplete={remove}
          />
        ) : null}
      </View>
    </View>
  );
};
