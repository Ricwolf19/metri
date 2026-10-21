import { useRouter, type Href } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, Text, View, type TextInput } from 'react-native';

import { SearchIcon } from '@/components/icons';
import { Input, ScrollArea, Sheet } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { CALC_META, calcShortTitle } from '@/features/calculators/registry';
import { getDocs } from '@/features/docs';
import { exercisesQuery } from '@/features/training/exercises.repo';
import { exerciseDisplayName } from '@/features/training/labels';
import { useI18n, useT, type TranslationKey } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import {
  spotlightSearch,
  type SpotlightGroupKey,
  type SpotlightHit,
  type SpotlightSources,
} from './search';

type Spotlight = { open: () => void };

const SpotlightContext = createContext<Spotlight | null>(null);

/** Null outside the tab shell: a screen then simply has no spotlight gesture. */
export const useSpotlight = () => useContext(SpotlightContext);

/** Every screen a search can land on; the title keys already exist for each. */
const SCREENS: { id: string; key: TranslationKey; href: Href }[] = [
  { id: 'train', key: 'tab.train', href: '/training' },
  { id: 'metrics', key: 'tab.metrics', href: '/metrics' },
  { id: 'nutrition', key: 'tab.nutrition', href: '/nutrition' },
  { id: 'explore', key: 'tab.explore', href: '/explore' },
  { id: 'library', key: 'exercise.library', href: '/training/exercises' },
  { id: 'warmups', key: 'warmup.title', href: '/training/warmups' },
  { id: 'history', key: 'training.sessions', href: '/training/history' },
  { id: 'photos', key: 'photos.title', href: '/progress' },
  { id: 'checkin', key: 'body.checkin', href: '/body/checkin' },
  { id: 'goal', key: 'goal.title', href: '/body/goal' },
  { id: 'plan', key: 'plan.title', href: '/plan' },
  { id: 'profile', key: 'profile.title', href: '/profile' },
  { id: 'faq', key: 'faq.title', href: '/faq' },
];

const GROUP_KEY: Record<SpotlightGroupKey, TranslationKey> = {
  screens: 'spotlight.screens',
  exercises: 'spotlight.exercises',
  guides: 'spotlight.guides',
  calculators: 'spotlight.calculators',
};

/**
 * The spotlight: one sheet that searches everything the app can open, raised
 * by pulling past the top of a tab screen and holding (`Screen` `onPullHold`).
 * Sources are read once per open — small tables and static lists — so typing
 * never touches SQLite.
 */
export const SpotlightProvider = ({ children }: { children: ReactNode }) => {
  const t = useT();
  const { locale } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const { muted } = useTheme();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [sources, setSources] = useState<SpotlightSources | null>(null);
  // `autoFocus` fires at mount, which inside a Modal is before Android has shown
  // it; focusing a beat after the sheet opens is what raises the keyboard.
  const inputRef = useRef<TextInput>(null);
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, [visible]);

  const open = useCallback(() => {
    const exercises = user ? exercisesQuery(user.id).all() : [];
    setSources({
      screens: SCREENS.map((s) => ({ id: s.id, title: t(s.key), href: s.href })),
      exercises: exercises.map((e) => ({
        id: e.id,
        title: exerciseDisplayName(e, locale),
        alt: e.name,
        href: { pathname: '/training/exercise/[id]', params: { id: e.id } },
      })),
      docs: getDocs(locale),
      calculators: CALC_META.map((m) => ({
        id: m.id,
        title: calcShortTitle(m.id, locale),
        href: { pathname: '/calculators/[id]', params: { id: m.id } },
      })),
    });
    setQuery('');
    setVisible(true);
  }, [user, locale, t]);

  const close = () => setVisible(false);
  const go = (hit: SpotlightHit) => {
    close();
    router.push(hit.href);
  };

  const groups = useMemo(() => (sources ? spotlightSearch(query, sources) : []), [query, sources]);
  // Nothing typed yet: the screens are the quick way in, before any search.
  const quick = sources?.screens ?? [];
  const value = useMemo(() => ({ open }), [open]);

  return (
    <SpotlightContext.Provider value={value}>
      {children}
      {/* A fixed stop: the sheet must not resize as results come and go under the finger. */}
      <Sheet visible={visible} onClose={close} snapPoints={['60%']}>
        <View className="mb-3 flex-row items-center gap-2 px-5">
          <SearchIcon color={muted} size={18} />
          <View className="flex-1">
            <Input
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder={t('spotlight.placeholder')}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
        </View>
        <ScrollArea inSheet keyboardShouldPersistTaps="handled">
          {query.trim() === '' ? (
            <View>
              <Text className="mb-1.5 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
                {t('spotlight.quick')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {quick.map((hit) => (
                  <Pressable
                    key={hit.id}
                    onPress={() => go(hit)}
                    accessibilityRole="button"
                    className="rounded-full border border-ink-700 bg-ink-800 px-3.5 py-2"
                  >
                    <Text className="text-sm font-sans-semibold text-ink-200">{hit.title}</Text>
                  </Pressable>
                ))}
              </View>
              <Text className="mt-5 text-center text-xs leading-5 text-ink-500">
                {t('spotlight.hint')}
              </Text>
            </View>
          ) : groups.length === 0 ? (
            <Text className="py-6 text-center text-sm text-ink-400">{t('spotlight.empty')}</Text>
          ) : (
            groups.map((group) => (
              <View key={group.key} className="mb-4">
                <Text className="mb-1.5 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
                  {t(GROUP_KEY[group.key])}
                </Text>
                {group.hits.map((hit) => (
                  <Pressable
                    key={hit.id}
                    onPress={() => go(hit)}
                    accessibilityRole="button"
                    className="rounded-field px-2 py-2.5 active:bg-ink-800"
                  >
                    <Text className="text-sm font-sans-medium text-ink-100" numberOfLines={1}>
                      {hit.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))
          )}
          <View className="h-6" />
        </ScrollArea>
      </Sheet>
    </SpotlightContext.Provider>
  );
};
