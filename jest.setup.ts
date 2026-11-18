// Shared setup for the component tests (jest-expo). jest-expo mocks the Expo
// modules; what is left has no native side under Jest:
// - MMKV switches to its own in-memory mock in a test run, but imports Nitro
//   at module scope first, and Nitro's TurboModule is not registered here.
// - the worklet runtime and reanimated run on their shipped mocks.
import { jest } from '@jest/globals';

jest.mock('react-native-nitro-modules', () => ({ NitroModules: {} }));
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('react-native-keyboard-controller', () =>
  jest.requireActual('react-native-keyboard-controller/jest'),
);

// Charts draw nothing here: Skia's own mock needs the CanvasKit wasm runtime,
// and component tests assert on text and presses, never on pixels (the chart
// maths is pure and tested on vitest — `components/ui/chart-math.ts`). Every
// named export resolves to a component/function that renders and returns null —
// except `then`, or anything awaiting the module would treat it as a promise
// that never settles.
const drawsNothing = () =>
  new Proxy({ __esModule: true } as Record<string | symbol, unknown>, {
    get: (target, key) => (key in target ? target[key] : key === 'then' ? undefined : () => null),
  });
jest.mock('@shopify/react-native-skia', () => drawsNothing());
jest.mock('victory-native', () => drawsNothing());
