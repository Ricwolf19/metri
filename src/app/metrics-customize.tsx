import { useState } from 'react';
import ReorderableList, { reorderItems } from 'react-native-reorderable-list';

import { TopBar } from '@/components/TopBar';
import { ReorderRow, Screen, ScreenTitle, Switch } from '@/components/ui';
import type { MetricsSectionId } from '@/features/metrics/layout';
import { orderedSections, type MetricsSection } from '@/features/metrics/sections';
import { metricsLayout } from '@/features/metrics/useMetricsLayout';
import { useT } from '@/i18n';

/**
 * Arrange the Metrics tab: drag to reorder, switch off what you never read.
 * Every change persists immediately — there is nothing to save and nothing to
 * lose by backing out.
 */
const MetricsCustomize = () => {
  const t = useT();
  // Non-reactive read, seeded once: this screen OWNS the order while it is open,
  // so re-rendering from its own writes would fight the drag.
  const saved = metricsLayout.get();
  const [items, setItems] = useState<MetricsSection[]>(() => orderedSections(saved));
  const [hidden, setHidden] = useState<MetricsSectionId[]>(() => saved?.hidden ?? []);

  const persist = (order: MetricsSection[], hiddenIds: MetricsSectionId[]) =>
    metricsLayout.set({ order: order.map((s) => s.id), hidden: hiddenIds });

  const toggle = (id: MetricsSectionId) => {
    const next = hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id];
    setHidden(next);
    persist(items, next);
  };

  return (
    <Screen edges={['top']} contentClassName="px-5" header={<TopBar showBack showAvatar={false} />}>
      <ScreenTitle title={t('metrics.customizeTitle')} subtitle={t('metrics.customizeSub')} />
      <ReorderableList
        data={items}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <ReorderRow
            dragOnly
            title={t(item.labelKey)}
            dragLabel={t('editor.dragHandle')}
            right={
              <Switch
                value={!hidden.includes(item.id)}
                onValueChange={() => toggle(item.id)}
                accessibilityLabel={t(item.labelKey)}
              />
            }
          />
        )}
        onReorder={({ from, to }) => {
          const next = reorderItems(items, from, to);
          setItems(next);
          persist(next, hidden);
        }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
};

export default MetricsCustomize;
