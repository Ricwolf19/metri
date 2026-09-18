import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CheckIcon, ChevronDownIcon } from '@/components/icons';
import { useTheme } from '@/theme/theme-context';

import { Button } from './Button';
import { ScrollArea } from './ScrollArea';
import { Sheet } from './Sheet';

type TagItem = { value: string; label: string };
export type TagSection = { title: string; items: TagItem[] };

type Props = {
  label?: string;
  sections: TagSection[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  doneLabel: string;
};

/** Multi-select of preset tags: chips in the field, sectioned check list in a sheet; commits on Done, backdrop tap discards. */
export const TagPicker = ({ label, sections, value, onChange, placeholder, doneLabel }: Props) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);
  const { brand } = useTheme();

  const labelOf = new Map(sections.flatMap((s) => s.items.map((i) => [i.value, i.label])));
  const selected = value.filter((v) => labelOf.has(v));

  const show = () => {
    setDraft(value);
    setOpen(true);
  };
  const toggle = (v: string) =>
    setDraft((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  const done = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <View className="w-full">
      {label ? (
        <Text className="mb-1.5 font-mono-medium text-xs uppercase tracking-wider text-ink-300">
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={show}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="min-h-11 w-full flex-row items-center justify-between rounded-field border border-ink-600 bg-ink-900 px-3 py-2"
      >
        {selected.length ? (
          <View className="flex-1 flex-row flex-wrap gap-1.5">
            {selected.map((v) => (
              <View key={v} className="rounded-full bg-brand/15 px-2.5 py-1">
                <Text className="text-xs font-sans-medium text-brand">{labelOf.get(v)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="flex-1 text-base text-ink-400">{placeholder ?? ''}</Text>
        )}
        <ChevronDownIcon color="#71717a" size={18} />
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)}>
        <ScrollArea maxHeight={420}>
          {sections.map((section) => (
            <View key={section.title} className="mb-2">
              <Text className="mb-1 mt-2 px-2 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
                {section.title}
              </Text>
              {section.items.map((item) => {
                const active = draft.includes(item.value);
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => toggle(item.value)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: active }}
                    className="flex-row items-center justify-between rounded-field px-3 py-3 active:bg-ink-700"
                  >
                    <Text
                      className={[
                        'text-base',
                        active ? 'font-sans-semibold text-ink-50' : 'text-ink-200',
                      ].join(' ')}
                    >
                      {item.label}
                    </Text>
                    {active ? <CheckIcon color={brand} size={18} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollArea>
        <View className="mt-3">
          <Button variant="brand" label={doneLabel} onPress={done} />
        </View>
      </Sheet>
    </View>
  );
};
