import { useLiveQuery } from '@/db/useLiveQuery';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { EditIcon, TrashIcon } from '@/components/icons';
import { Button, HoldButton, Input, TextLink, useToast } from '@/components/ui';
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
  const toast = useToast();
  const { muted, danger } = useTheme();
  const { data } = useLiveQuery(exerciseNoteQuery(userId, exerciseId), [userId, exerciseId]);
  const note = data[0]?.note ?? null;
  const [own, setOwn] = useState(false);
  const editing = controlled ?? own;
  const setEditing = (next: boolean) => {
    setOwn(next);
    onEditingChange?.(next);
  };
  const [draft, setDraft] = useState('');
  // Opened from outside: start from the saved note, once per opening.
  const [seeded, setSeeded] = useState(false);
  if (editing && !seeded) {
    setSeeded(true);
    setDraft(note ?? '');
  } else if (!editing && seeded) {
    setSeeded(false);
  }

  const startEdit = () => setEditing(true);
  const save = () => {
    saveExerciseNote(userId, exerciseId, draft);
    setEditing(false);
    toast.success(t('exNote.saved'));
  };
  const remove = () => {
    saveExerciseNote(userId, exerciseId, '');
    setEditing(false);
    toast.info(t('exNote.deleted'));
  };

  if (editing) {
    return (
      <View className={`gap-2 ${className}`}>
        <Input
          value={draft}
          onChangeText={setDraft}
          placeholder={t('exNote.placeholder')}
          multiline
          autoFocus
          maxLength={500}
        />
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <Button label={t('common.cancel')} size="sm" onPress={() => setEditing(false)} />
          </View>
          <View className="flex-1">
            <Button label={t('editor.save')} size="sm" variant="brand" onPress={save} />
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
  }

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
