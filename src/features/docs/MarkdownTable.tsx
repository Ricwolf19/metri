import { useEffect, useState } from 'react';
import { Animated, ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { RenderRules } from 'react-native-markdown-display';

import { ChevronRightIcon } from '@/components/icons';

const ScrollHint = () => {
  const [x] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: 5, duration: 650, useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [x]);

  return (
    <View className="mt-1 flex-row items-center justify-end">
      <Text className="mr-1 text-[10px] uppercase tracking-wider text-ink-400">scroll</Text>
      <Animated.View style={{ transform: [{ translateX: x }] }}>
        <ChevronRightIcon color="#566077" size={14} />
      </Animated.View>
    </View>
  );
};

/**
 * Wraps a markdown table in a horizontal scroller (wide tables don't wrap
 * mid-word) and shows an animated "scroll" hint only when it actually overflows.
 */
const ScrollableTable = ({
  style,
  children,
}: {
  style: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) => {
  const [containerW, setContainerW] = useState(0);
  const [contentW, setContentW] = useState(0);
  const overflowing = contentW > containerW + 2;

  return (
    <View className="mb-3" onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={(w) => setContentW(w)}
      >
        <View style={style}>{children}</View>
      </ScrollView>
      {overflowing ? <ScrollHint /> : null}
    </View>
  );
};

/** Markdown render override: make tables horizontally scrollable on small screens. */
export const markdownRules: RenderRules = {
  table: (node, children, _parent, styles) => (
    <ScrollableTable key={node.key} style={styles._VIEW_SAFE_table}>
      {children}
    </ScrollableTable>
  ),
};
