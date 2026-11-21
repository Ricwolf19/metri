import { beforeEach, describe, expect, it } from '@jest/globals';
import { screen } from '@testing-library/react-native';

import { settings } from '@/lib/storage';
import { renderWithProviders } from '@/test/render';

import { Input } from './Input';

describe('Input naming', () => {
  beforeEach(() => settings.setLocale('en'));

  it('is named by its visible label and shows its hint as text, not as a placeholder', async () => {
    await renderWithProviders(<Input label="Program name" hint="e.g. My Push/Pull/Legs" />);
    const field = screen.getByLabelText('Program name');
    expect(field.props.placeholder).toBeUndefined();
    expect(screen.getByText('e.g. My Push/Pull/Legs')).toBeTruthy();
  });

  it('takes its spoken name from the caller when there is no visible label', async () => {
    await renderWithProviders(<Input accessibilityLabel="Weight (kg)" />);
    expect(screen.getByLabelText('Weight (kg)').props.placeholder).toBeUndefined();
  });

  it('gives a search field its short placeholder, as its name too', async () => {
    await renderWithProviders(<Input search="Search exercises" />);
    const field = screen.getByPlaceholderText('Search exercises');
    expect(field.props.accessibilityLabel).toBe('Search exercises');
    expect(field.props.returnKeyType).toBe('search');
  });
});
