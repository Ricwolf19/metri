import { Pressable, Text, View } from 'react-native';

import { LOCALES, useI18n } from './index';

/** Compact EN / ES pill — switches the app language. */
export const LocaleToggle = () => {
  const { locale, setLocale } = useI18n();

  return (
    <View className="flex-row rounded-full border border-ink-600 bg-ink-800 p-0.5">
      {LOCALES.map((l) => {
        const active = l.value === locale;
        return (
          <Pressable
            key={l.value}
            onPress={() => setLocale(l.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={['rounded-full px-3 py-1', active ? 'bg-accentFill' : ''].join(' ')}
          >
            <Text
              className={[
                'text-xs font-bold uppercase',
                active ? 'text-ink-950' : 'text-ink-300',
              ].join(' ')}
            >
              {l.value}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
