import { View } from 'react-native';

/**
 * Rule-of-thirds lines over the camera frame, plus a centre line: the same
 * framing every week (head on the top line, feet near the bottom, the body on
 * the centre) is what makes two photos comparable. Decorative.
 */
export const CaptureGrid = () => (
  <View pointerEvents="none" className="absolute inset-0">
    <View className="absolute bottom-0 top-0 w-px bg-ink-50/25" style={{ left: '33.333%' }} />
    <View className="absolute bottom-0 top-0 w-px bg-ink-50/40" style={{ left: '50%' }} />
    <View className="absolute bottom-0 top-0 w-px bg-ink-50/25" style={{ left: '66.666%' }} />
    <View className="absolute left-0 right-0 h-px bg-ink-50/25" style={{ top: '33.333%' }} />
    <View className="absolute left-0 right-0 h-px bg-ink-50/25" style={{ top: '66.666%' }} />
  </View>
);
