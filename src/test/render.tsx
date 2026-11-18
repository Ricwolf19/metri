import { render, type RenderOptions } from '@testing-library/react-native';

import { I18nProvider } from '@/i18n';
import { ThemeProvider } from '@/theme/theme-context';

const Providers = ({ children }: { children: React.ReactNode }) => (
  <I18nProvider>
    <ThemeProvider>{children}</ThemeProvider>
  </I18nProvider>
);

/** Render a component inside the providers every screen has (i18n, theme). */
export const renderWithProviders = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: Providers, ...options });
