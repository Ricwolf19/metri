import type { ComponentType, ReactNode } from 'react';

import type { TranslationKey } from '@/i18n/en';

import { AnalyticsSection } from './components/AnalyticsSection';
import { BodySection } from './components/BodySection';
import { ConsistencySection } from './components/ConsistencySection';
import { ExerciseHistorySection } from './components/ExerciseHistorySection';
import { PhotosSection } from './components/PhotosSection';
import { SummarySection } from './components/SummarySection';
import { orderedIds, visibleIds, type MetricsLayout, type MetricsSectionId } from './layout';

/** The first rendered section hosts the screen's Customize control on its own title line. */
export type MetricsSectionProps = { headerRight?: ReactNode };

export type MetricsSection = {
  id: MetricsSectionId;
  labelKey: TranslationKey;
  Component: ComponentType<MetricsSectionProps>;
};

/** Id → what renders it. Order lives in `layout.ts`; this map only says "what". */
const SECTIONS: Record<MetricsSectionId, Omit<MetricsSection, 'id'>> = {
  consistency: { labelKey: 'metrics.sectionConsistency', Component: ConsistencySection },
  summary: { labelKey: 'metrics.sectionSummary', Component: SummarySection },
  body: { labelKey: 'metrics.sectionBody', Component: BodySection },
  analytics: { labelKey: 'metrics.sectionAnalytics', Component: AnalyticsSection },
  exercises: { labelKey: 'metrics.sectionExercises', Component: ExerciseHistorySection },
  photos: { labelKey: 'metrics.sectionPhotos', Component: PhotosSection },
};

const resolve = (ids: MetricsSectionId[]): MetricsSection[] =>
  ids.map((id) => ({ id, ...SECTIONS[id] }));

/** Every section in the user's order, hidden included — the customize screen's list. */
export const orderedSections = (layout: MetricsLayout | null): MetricsSection[] =>
  resolve(orderedIds(layout));

/** What the tab renders. */
export const visibleSections = (layout: MetricsLayout | null): MetricsSection[] =>
  resolve(visibleIds(layout));
