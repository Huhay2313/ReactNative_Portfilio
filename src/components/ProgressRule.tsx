/**
 * ProgressRule: a thin, animated measurement gauge.
 *
 * UX & Animation principles applied:
 *   - Slow in & slow out (#6): cubic ease-out fill glide when progress changes.
 *   - Secondary action (#8): responds smoothly when a checklist step is toggled.
 *   - Reduce Motion: snaps immediately to the target percentage.
 */

import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useMotionConfig } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeContext';

export interface ProgressRuleProps {
  /** 0–1. Values outside the range are clamped. */
  value: number;
  /** Overrides the fill colour. Defaults to the accent. */
  color?: string;
  /** Track height. Defaults to 3. */
  height?: number;
}

export function ProgressRule({ value, color, height = 3 }: ProgressRuleProps) {
  const theme = useTheme();
  const motion = useMotionConfig();
  const clamped = Math.max(0, Math.min(1, value));
  const progress = useSharedValue(clamped);

  useEffect(() => {
    if (motion.reduced) {
      progress.set(clamped);
    } else {
      progress.set(
        withTiming(clamped, {
          duration: motion.timing.transition,
          easing: motion.easing.inOut,
        }),
      );
    }
  }, [clamped, motion.reduced, motion.timing.transition, motion.easing.inOut, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{
        height,
        backgroundColor: theme.colors.surfaceSunken,
        borderRadius: theme.radius.sm,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            backgroundColor: color ?? theme.colors.accent,
            borderRadius: theme.radius.sm,
          },
          fillStyle,
        ]}
      />
    </View>
  );
}
