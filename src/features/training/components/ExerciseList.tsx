import { useLiveQuery } from '@/db/useLiveQuery';
import { FlashList } from '@shopify/flash-list';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import {
  Card,
  ChipRow,
  EmptyState,
  Input,
  PressableScale,
  SCREEN_GUTTER,
  useSheetBleed,
  SHEET_END,
} from '@/components/ui';
import type { Exercise } from '@/db/schema';
import { ExerciseDocButton } from '@/features/training/components/ExerciseDocButton';
import { exercisesQuery } from '@/features/training/exercises.repo';
import { exerciseDisplayName } from '@/features/training/labels';
import {
  MUSCLE_HEADS,
  exerciseHeads,
  muscleHeadKey,
  type MuscleHead,
} from '@/features/training/muscles';
import { useI18n, useT } from '@/i18n';

/** Sentinel for the unfiltered chip — `undefined` cannot be a chip value. */
const ALL = '__all__';

type Props = {
  userId: string;
  onPick: (exercise: Exercise) => void;
  /** Rendered between the filters and the list (e.g. the picker's "New exercise" button). */
  above?: React.ReactNode;
  /** Trailing slot per row (e.g. a delete chip for custom exercises). */
  trailing?: (exercise: Exercise) => React.ReactNode;
  /** Icon at the row's right edge. */
  rowIcon?: React.ReactNode;
  /** Shows the standard book affordance per row (technique guide / history). */
  showDoc?: boolean;
  /** Ids left out of the list (a live session's own exercises). */
  exclude?: ReadonlySet<string>;
  /**
   * Inside a `<Sheet fill>`, as its last child: it fills the sheet and runs
   * through the sheet's bottom safe area to the physical edge, the last row
   * padded clear of the navigation bar (`sheet-bottom.tsx`).
   */
  inSheet?: boolean;
};

const Gap = () => <View className="h-2" />;

/**
 * Searchable list of catalog + own custom exercises (picker and library),
 * filtered by the muscle it trains — the same vocabulary the body map and the
 * split badges use, so "quads" means the same thing everywhere.
 *
 * It IS its own scroller: the search and the muscle chips stay put above a
 * virtualized `FlashList` (the library is ~100 rows and growing; mounted
 * whole inside a ScrollView it built every card on open). So it must sit in a
 * bounded parent — a non-scroll `Screen`, or a `<Sheet fill>` with `inSheet`:
 * a content-sized sheet has no height to give it, and it collapsed to nothing.
 */
export const ExerciseList = ({
  userId,
  onPick,
  above,
  trailing,
  rowIcon,
  showDoc,
  exclude,
  inSheet = false,
}: Props) => {
  const t = useT();
  const { locale } = useI18n();
  const [search, setSearch] = useState('');
  const [head, setHead] = useState<MuscleHead | undefined>();
  const { data: exercises } = useLiveQuery(exercisesQuery(userId), [userId]);
  const { inset: bleed } = useSheetBleed(inSheet);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter(
      (e) =>
        !exclude?.has(e.id) &&
        (!head || exerciseHeads(e).includes(head)) &&
        (!q || exerciseDisplayName(e, locale).toLowerCase().includes(q)),
    );
  }, [exercises, search, head, locale, exclude]);

  return (
    <View style={bleed ? { flex: 1, marginBottom: -bleed } : { flex: 1 }}>
      <Input
        value={search}
        onChangeText={setSearch}
        search={t('editor.searchExercises')}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View className="mt-3">
        {/* Every host pads it px-5: a non-scroll screen's content, the add sheet's body. */}
        <ChipRow
          items={[
            { value: ALL, label: t('common.all') },
            ...MUSCLE_HEADS.map((h) => ({ value: h, label: t(muscleHeadKey(h)) })),
          ]}
          value={head ?? ALL}
          onChange={(v) => setHead(v === ALL ? undefined : (v as MuscleHead))}
          bleed={SCREEN_GUTTER}
        />
      </View>

      <FlashList
        data={filtered}
        keyExtractor={(e) => e.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        // Android 12+'s stretch overscroll catches the next touch while it
        // relaxes: a tap on a row right after the list hit its end went to the
        // list. The same as the screens and sheets around it (`Screen`, `ScrollArea`).
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: (inSheet ? SHEET_END : 40) + bleed }}
        ListHeaderComponent={
          <>
            {above}
            <View className="h-4" />
          </>
        }
        ListEmptyComponent={<EmptyState hint={t('editor.noMatches')} />}
        ItemSeparatorComponent={Gap}
        renderItem={({ item: e }) => (
          <PressableScale onPress={() => onPick(e)}>
            <Card className="flex-row items-center py-3">
              <View className="min-w-0 flex-1">
                <Text className="text-base font-sans-semibold text-ink-50" numberOfLines={2}>
                  {exerciseDisplayName(e, locale)}
                </Text>
                <Text className="mt-0.5 text-xs text-ink-400" numberOfLines={1}>
                  {exerciseHeads(e)
                    .slice(0, 3)
                    .map((h) => t(muscleHeadKey(h)))
                    .join(' · ')}
                  {e.isCustom ? ` · ${t('editor.custom')}` : ''}
                </Text>
              </View>
              {showDoc ? <ExerciseDocButton exerciseId={e.id} /> : null}
              {trailing?.(e)}
              {rowIcon}
            </Card>
          </PressableScale>
        )}
      />
    </View>
  );
};
