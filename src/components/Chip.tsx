/**
 * Chip: a tactile filter or category selector.
 *
 * UX & Animation principles applied:
 *   - Bigger hit areas (#14): 40pt visible height + 4pt hitSlop = 48pt touch target.
 *   - Squash & stretch (#1) + Snappy timing (#9): crisp press compression.
 *   - Secondary action (#8): checkmark scales in smoothly on selection.
 *   - Accessibility: selected state carried by border, wash, AND checkmark glyph.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/Text';
import { useMotionConfig } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ChipProps {
  label: string;
  selected?: boolean;
  /** A count shown after the label, e.g. the number of activities. */
  count?: number;
  onPress?: () => void;
}

export function Chip({ label, selected = false, count, onPress }: ChipProps) {
  const theme = useTheme();
  const motion = useMotionConfig();

  const scale = useSharedValue(1);
  const checkScale = useSharedValue(selected ? 1 : 0.6);
  const checkOpacity = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    if (selected) {
      if (motion.reduced) {
        checkScale.set(1);
        checkOpacity.set(1);
      } else {
        checkScale.set(withSpring(1, motion.springs.tactile));
        checkOpacity.set(withTiming(1, { duration: motion.timing.quick }));
      }
    } else {
      checkScale.set(0.6);
      checkOpacity.set(0);
    }
  }, [selected, motion.reduced, motion.springs.tactile, motion.timing.quick, checkScale, checkOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={
        count !== undefined
          ? `${label}, ${count} ${count === 1 ? 'activity' : 'activities'}`
          : label
      }
      hitSlop={4}
      onPressIn={() => {
        if (!motion.reduced) {
          scale.set(withTiming(0.94, { duration: motion.timing.instant }));
        }
      }}
      onPressOut={() => {
        if (!motion.reduced) {
          scale.set(withSpring(1, motion.springs.tactile));
        }
      }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      style={[
        {
          minHeight: 40,
          paddingHorizontal: theme.space.md,
          borderRadius: theme.radius.sm,
          borderWidth: 1,
          borderColor: selected ? theme.colors.accent : theme.colors.rule,
          backgroundColor: selected ? theme.colors.accentWash : 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
        },
        animatedStyle,
      ]}
    >
      {selected ? (
        <Animated.View style={checkStyle}>
          <Ionicons name="checkmark" size={13} color={theme.colors.accentText} />
        </Animated.View>
      ) : null}
      <Text
        variant="label"
        style={{ color: selected ? theme.colors.accentText : theme.colors.textSoft }}
      >
        {label}
      </Text>
      {count !== undefined ? (
        <Text
          variant="micro"
          style={{ color: selected ? theme.colors.accentText : theme.colors.textFaint }}
        >
          {count}
        </Text>
      ) : null}
    </AnimatedPressable>
  );
}
