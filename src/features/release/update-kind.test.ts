import { describe, expect, it } from 'vitest';

import { updateKind, type UpdateKind } from './update-kind';

describe('updateKind', () => {
  const cases: {
    name: string;
    installedVersion: string;
    installedRuntime: string | null;
    latest: { version: string; runtimeVersion: string };
    expected: UpdateKind;
  }[] = [
    {
      name: 'same version → none',
      installedVersion: '1.14.0',
      installedRuntime: 'r1',
      latest: { version: '1.14.0', runtimeVersion: 'r1' },
      expected: 'none',
    },
    {
      name: 'older latest → none',
      installedVersion: '1.14.0',
      installedRuntime: 'r1',
      latest: { version: '1.13.2', runtimeVersion: 'r2' },
      expected: 'none',
    },
    {
      name: 'newer, same runtime → ota',
      installedVersion: '1.14.0',
      installedRuntime: 'r1',
      latest: { version: '1.14.1', runtimeVersion: 'r1' },
      expected: 'ota',
    },
    {
      name: 'newer, different runtime → apk',
      installedVersion: '1.14.0',
      installedRuntime: 'r1',
      latest: { version: '1.15.0', runtimeVersion: 'r2' },
      expected: 'apk',
    },
    {
      name: 'newer, unknown installed runtime (dev build) → apk',
      installedVersion: '1.14.0',
      installedRuntime: null,
      latest: { version: '1.15.0', runtimeVersion: 'r1' },
      expected: 'apk',
    },
    {
      name: 'newer, empty installed runtime → apk',
      installedVersion: '1.14.0',
      installedRuntime: '',
      latest: { version: '1.15.0', runtimeVersion: '' },
      expected: 'apk',
    },
    {
      name: 'newer, empty latest runtime → apk',
      installedVersion: '1.14.0',
      installedRuntime: 'r1',
      latest: { version: '1.15.0', runtimeVersion: '' },
      expected: 'apk',
    },
    {
      name: 'pre-release latest → none',
      installedVersion: '1.14.0',
      installedRuntime: 'r1',
      latest: { version: '1.15.0-beta.1', runtimeVersion: 'r1' },
      expected: 'none',
    },
    {
      name: 'garbage latest → none',
      installedVersion: '1.14.0',
      installedRuntime: 'r1',
      latest: { version: 'latest', runtimeVersion: 'r1' },
      expected: 'none',
    },
  ];

  it.each(cases)('$name', ({ installedVersion, installedRuntime, latest, expected }) => {
    expect(updateKind({ installedVersion, installedRuntime, latest })).toBe(expected);
  });
});
