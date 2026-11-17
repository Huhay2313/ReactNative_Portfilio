/**
 * TabBar: the app's bottom navigation.
 *
 * UX & Animation principles applied:
 *   - Fitts's law (#13) & Bigger hit areas (#14): bottom thumb-zone placement,
 *     equal full-flex targets >= 52pt tall.
 *   - Staging & Pose-to-pose (#3, #4): sliding top accent bar tracks the active
 *     tab smoothly across the rail.
 *   - Frequency of use (#20): tab switches happen dozens of times per session, so
 *     transitions are crisp, non-blocking, and settle in ~150ms.
 *   - Jakob's law (#19): 4 familiar tabs + clear overdue count indicator.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { useMotionConfig } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeContext';

export interface TabItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

export const TAB_ITEMS: TabItem[] = [
  { key: 'index', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { key: 'library', label: 'Library', icon: 'albums-outline', iconActive: 'albums' },
  { key: 'portfolio', label: 'Portfolio', icon: 'briefcase-outline', iconActive: 'briefcase' },
  { key: 'settings', label: 'Settings', icon: 'options-outline', iconActive: 'options' },
];

export interface TabBarProps {
  /** The key of the active tab. */
  activeKey: string;
  onSelect: (key: string) => void;
  /** Optional count of overdue activities to surface subtly on Library. */
  overdueCount?: number;
}

const INDICATOR_WIDTH = 28;

export function TabBar({ activeKey, onSelect, overdueCount = 0 }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const motion = useMotionConfig();

  const [railWidth, setRailWidth] = useState(0);
  const activeIndex = Math.max(
    0,
    TAB_ITEMS.findIndex((item) => item.key === activeKey),
  );

  const indicatorX = useSharedValue(0);

  useEffect(() => {
    if (railWidth <= 0) return;
    const tabWidth = railWidth / TAB_ITEMS.length;
    const targetX = activeIndex * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2;

    if (motion.reduced) {
      indicatorX.set(targetX);
    } else {
      indicatorX.set(withSpring(targetX, motion.springs.snappy));
    }
  }, [activeIndex, railWidth, motion.reduced, motion.springs.snappy, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    setRailWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.rule,
        paddingBottom: Math.max(insets.bottom, theme.space.sm),
        paddingTop: theme.space.xs,
      }}
    >
      <View
        onLayout={handleLayout}
        style={{
          position: 'relative',
          flexDirection: 'row',
          alignItems: 'stretch',
          maxWidth: 720,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {/* Sliding accent rule above the active tab */}
        {railWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                width: INDICATOR_WIDTH,
                height: 2.5,
                borderRadius: 2,
                backgroundColor: theme.colors.accent,
              },
              indicatorStyle,
            ]}
          />
        ) : null}

        {TAB_ITEMS.map((item) => {
          const active = item.key === activeKey;
          const showOverdueDot = item.key === 'library' && overdueCount > 0;

          return (
            <TabButton
              key={item.key}
              item={item}
              active={active}
              showOverdueDot={showOverdueDot}
              overdueCount={overdueCount}
              onPress={() => {
                if (active) return;
                Haptics.selectionAsync().catch(() => {});
                onSelect(item.key);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabButton({
  item,
  active,
  showOverdueDot,
  overdueCount,
  onPress,
}: {
  item: TabItem;
  active: boolean;
  showOverdueDot: boolean;
  overdueCount: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const motion = useMotionConfig();
  const iconScale = useSharedValue(1);

  useEffect(() => {
    if (active && !motion.reduced) {
      iconScale.set(0.86);
      iconScale.set(withSpring(1, motion.springs.tactile));
    }
  }, [active, motion.reduced, motion.springs.tactile, iconScale]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={
        showOverdueDot ? `${item.label}, ${overdueCount} overdue` : item.label
      }
      onPressIn={() => {
        if (!motion.reduced && !active) {
          iconScale.set(withTiming(0.88, { duration: motion.timing.instant }));
        }
      }}
      onPressOut={() => {
        if (!motion.reduced && !active) {
          iconScale.set(withSpring(1, motion.springs.snappy));
        }
      }}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 50,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingTop: theme.space.sm,
        paddingBottom: theme.space.xs,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Animated.View style={[{ position: 'relative' }, iconAnimatedStyle]}>
        <Ionicons
          name={active ? item.iconActive : item.icon}
          size={20}
          color={active ? theme.colors.accentText : theme.colors.textMuted}
        />
        {showOverdueDot ? (
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -5,
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: theme.colors.alert,
              borderWidth: 1.5,
              borderColor: theme.colors.surface,
            }}
          />
        ) : null}
      </Animated.View>
      <Text
        variant="micro"
        style={{
          color: active ? theme.colors.accentText : theme.colors.textMuted,
        }}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}
