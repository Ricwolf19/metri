import { useEffect, useRef } from 'react';
import { Pressable, Text, type ScrollView } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { useTheme } from '@/theme/theme-context';

import { ScrollArea } from './ScrollArea';
import { revealOffset } from './reveal-offset';
import { PICKER_STOPS, Sheet } from './Sheet';
import type { SelectItem } from './Select';

type Props<T extends string> = {
  visible: boolean;
  onClose: () => void;
  label?: string;
  items: readonly SelectItem<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
};

/**
 * The option list of a `Select`, on its own: a bottom sheet of rows with the
 * chosen one checked, for pickers that open from an icon or a long-press
 * rather than from a field (the variant swap on a session card). `Select`
 * renders the field and this sheet; use this directly when there is no field.
 */
export const OptionSheet = <T extends string>({
  visible,
  onClose,
  label,
  items,
  value,
  onChange,
}: Props<T>) => {
  const { brand } = useTheme();
  const listRef = useRef<ScrollView>(null);
  // Scroll to the checked option once per open: the row's onLayout also fires
  // on later relayouts (font scale, rotation) and would yank the list back.
  const revealed = useRef(false);
  useEffect(() => {
    if (!visible) revealed.current = false;
  }, [visible]);

  return (
    <Sheet visible={visible} onClose={onClose} snapPoints={PICKER_STOPS}>
      <ScrollArea inSheet ref={listRef}>
        {label ? (
          <Text className="mb-1 px-2 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
            {label}
          </Text>
        ) : null}
        {items.map((item) => {
          const active = item.value === value;
          return (
            <Pressable
              key={item.value}
              // Long lists open on the checked option, not on the first one.
              onLayout={
                active
                  ? (e) => {
                      if (revealed.current) return;
                      revealed.current = true;
                      listRef.current?.scrollTo({
                        y: revealOffset(e.nativeEvent.layout.y),
                        animated: false,
                      });
                    }
                  : undefined
              }
              onPress={() => {
                onChange(item.value);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className="flex-row items-center justify-between rounded-field px-3 py-3.5 active:bg-ink-700"
            >
              <Text
                className={[
                  'flex-1 pr-3 text-base',
                  active ? 'font-sans-semibold text-ink-50' : 'text-ink-200',
                ].join(' ')}
              >
                {item.label}
              </Text>
              {active ? <CheckIcon color={brand} size={18} /> : null}
            </Pressable>
          );
        })}
      </ScrollArea>
    </Sheet>
  );
};
