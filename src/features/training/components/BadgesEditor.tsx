import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { XIcon } from '@/components/icons';
import { Button, Input } from '@/components/ui';
import { MAX_BADGES, MAX_BADGE_LEN } from '@/features/training/authoring.repo';
import { useI18n, useT } from '@/i18n';

import { badgeLabel } from '../programs/badge-copy';

/** Chip list + add field for short technique badges ("CON PAUSA"), capped at
 * MAX_BADGES; used by the slot editor and the per-exercise defaults. */
export const BadgesEditor = ({
  value,
  onChange,
}: {
  value: string[];
  onChange: (badges: string[]) => void;
}) => {
  const t = useT();
  const { locale } = useI18n();
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim().slice(0, MAX_BADGE_LEN);
    if (!v || value.length >= MAX_BADGES) return;
    onChange([...value, v]);
    setInput('');
  };

  return (
    <View>
      {value.length ? (
        <View className="mb-3 flex-row flex-wrap gap-2">
          {value.map((b, i) => (
            <View
              key={`${b}-${i}`}
              className="flex-row items-center gap-1.5 rounded-full bg-ink-800 px-3 py-1.5"
            >
              <Text className="font-mono-medium text-[11px] tracking-wide text-ink-200">
                {badgeLabel(b, locale)}
              </Text>
              <Pressable onPress={() => onChange(value.filter((_, j) => j !== i))} hitSlop={6}>
                <XIcon color="#71717a" size={13} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      {value.length < MAX_BADGES ? (
        <View className="flex-row items-end gap-2">
          <View className="flex-1">
            <Input
              value={input}
              onChangeText={setInput}
              placeholder={t('editor.badgePh')}
              maxLength={MAX_BADGE_LEN}
              autoCapitalize="characters"
              onSubmitEditing={add}
              returnKeyType="done"
            />
          </View>
          <Button label={t('editor.addBadge')} fullWidth={false} onPress={add} />
        </View>
      ) : null}
    </View>
  );
};
