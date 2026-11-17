/**
 * ActivityRow: the signature component of LABFOLIO.
 *
 * UX & Animation principles applied:
 *   - Frequency of use (#20): list rows are scrolled and tapped constantly, so
 *     there is NO per-row entrance stagger that slows down repeat visits.
 *   - Squash & stretch (#1) + Follow through (#5): subtle tactile compression
 *     on touch-down paired with a small forward nudge on the chevron.
 *   - Bigger hit areas (#14): generous vertical padding & full-row target.
 */

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ProgressRule } from '@/components/ProgressRule';
import { StatusMark } from '@/components/StatusMark';
import { Text } from '@/components/Text';
import type { Activity, ActivityProgress } from '@/data/types';
import {
  describeDueDate,
  formatActivityNumber,
  formatShortDate,
  formatStepCount,
} from '@/lib/format';
import { useMotionConfig } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ActivityRowProps {
  activity: Activity;
  progress: ActivityProgress;
  onPress: () => void;
  /** Hides the course line on dense lists. */
  compact?: boolean;
}

export function ActivityRow({ activity, progress, onPress, compact = false }: ActivityRowProps) {
  const theme = useTheme();
  const motion = useMotionConfig();
  const due = describeDueDate(activity.dueAt);

  const scale = useSharedValue(1);
  const chevronX = useSharedValue(0);
  const [isPressed, setIsPressed] = useState(false);

  // A finished activity is never overdue, however long ago its deadline passed.
  const isComplete = progress.status === 'complete';
  const dueLabel = isComplete
    ? activity.completedAt
      ? `Completed ${formatShortDate(activity.completedAt)}`
      : 'Complete'
    : due.label;
  const dueTone = isComplete
    ? 'complete'
    : due.overdue
      ? 'alert'
      : due.urgent
        ? 'progress'
        : 'muted';

  const rowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const chevronAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: chevronX.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`Activity ${formatActivityNumber(activity.number)}, ${activity.title}. ${formatStepCount(progress.done, progress.total)} complete.`}
      onPressIn={() => {
        setIsPressed(true);
        if (!motion.reduced) {
          scale.set(withTiming(0.985, { duration: motion.timing.instant }));
          chevronX.set(withTiming(4, { duration: motion.timing.instant }));
        }
      }}
      onPressOut={() => {
        setIsPressed(false);
        if (!motion.reduced) {
          scale.set(withSpring(1, motion.springs.snappy));
          chevronX.set(withSpring(0, motion.springs.tactile));
        }
      }}
      onPress={onPress}
      style={[
        {
          flexDirection: 'row',
          paddingVertical: theme.space.md,
          paddingHorizontal: theme.space.xs,
          gap: theme.space.md,
          backgroundColor: isPressed ? theme.colors.surfaceSunken : 'transparent',
          borderRadius: theme.radius.sm,
        },
        rowAnimatedStyle,
      ]}
    >
      {/* The index column. Fixed width so every row aligns. */}
      <View style={{ width: 30, paddingTop: 2 }}>
        <Text variant="label" tone="faint">
          {formatActivityNumber(activity.number)}
        </Text>
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="heading" numberOfLines={2}>
          {activity.title}
        </Text>

        {!compact && activity.course ? (
          <Text variant="bodySmall" tone="muted" numberOfLines={1}>
            {activity.course}
          </Text>
        ) : null}

        <View style={{ marginTop: theme.space.xs }}>
          <ProgressRule
            value={progress.ratio}
            color={
              progress.status === 'complete'
                ? theme.colors.complete
                : progress.overdue
                  ? theme.colors.alert
                  : theme.colors.accent
            }
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.space.sm,
            marginTop: 2,
          }}
        >
          <Text variant="micro" tone="muted">
            {formatStepCount(progress.done, progress.total)}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
            <Text variant="micro" tone={dueTone}>
              {dueLabel}
            </Text>
            <StatusMark
              status={progress.status}
              overdue={progress.overdue}
              showLabel={false}
            />
          </View>
        </View>
      </View>

      <Animated.View style={[{ justifyContent: 'center' }, chevronAnimatedStyle]}>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
      </Animated.View>
    </AnimatedPressable>
  );
}
