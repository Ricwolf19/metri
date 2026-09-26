import { describe, expect, it } from 'vitest';

import { isNewerVersion } from './version';

describe('isNewerVersion', () => {
  it('reports a newer patch/minor/major', () => {
    expect(isNewerVersion('1.11.0', '1.11.1')).toBe(true);
    expect(isNewerVersion('1.11.0', '1.12.0')).toBe(true);
    expect(isNewerVersion('1.11.0', '2.0.0')).toBe(true);
  });

  it('ignores older and equal versions', () => {
    expect(isNewerVersion('1.11.0', '1.10.9')).toBe(false);
    expect(isNewerVersion('1.11.0', '1.11.0')).toBe(false);
  });

  it('compares missing segments as zero', () => {
    expect(isNewerVersion('1.11', '1.11.0')).toBe(false);
    expect(isNewerVersion('1.11', '1.11.1')).toBe(true);
  });

  it('never reports on non-numeric or malformed input', () => {
    expect(isNewerVersion('1.11.0-beta', '1.12.0')).toBe(false);
    expect(isNewerVersion('1.11.0', 'latest')).toBe(false);
    expect(isNewerVersion('', '1.0.0')).toBe(false);
  });
});
