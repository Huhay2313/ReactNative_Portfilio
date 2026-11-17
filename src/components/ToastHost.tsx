/**
 * ToastHost: renders the active floating feedback banner.
 *
 * Principles applied:
 *   - Staging & Focus: floats cleanly above the bottom tab bar with crisp contrast.
 *   - Slow in & slow out / Snappy timing: enters with SPRINGS.snappy, exits fast.
 *   - Jakob's law & Postel's law: swipe down to dismiss, or tap Undo immediately.
 *   - Bigger hit areas: Undo action meets >=44pt touch target.
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Text } from '@/components/Text';
import { useMotionConfig } from '@/lib/motion';
import { useToast } from '@/lib/ToastContext';
import { useTheme } from '@/theme/ThemeContext';
import { maxContentWidth } from '@/theme/tokens';

export interface ToastHostProps {
  /** Extra offset when the bottom TabBar is visible. */
  aboveTabBar?: boolean;
}

export function ToastHost({ aboveTabBar = true }: ToastHostProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const motion = useMotionConfig();
  const { toast, dismissToast } = useToast();

  const translateY = useSharedValue(28);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (toast) {
      if (motion.reduced) {
        translateY.set(0);
        opacity.set(withTiming(1, { duration: motion.timing.quick }));
      } else {
        translateY.set(24);
        opacity.set(0);
        translateY.set(withSpring(0, motion.springs.snappy));
        opacity.set(
          withTiming(1, {
            duration: motion.timing.quick,
            easing: motion.easing.enter,
          }),
        );
      }
    } else {
      opacity.set(withTiming(0, { duration: motion.timing.instant }));
    }
  }, [toast, motion.reduced, motion.springs.snappy, motion.timing.quick, motion.timing.instant, motion.easing.enter, translateY, opacity]);

  const swipeDismiss = Gesture.Pan()
    .activeOffsetY(8)
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.set(event.translationY);
        opacity.set(Math.max(0.2, 1 - event.translationY / 80));
      }
    })
    .onEnd((event) => {
      if (event.translationY > 28 || event.velocityY > 400) {
        scheduleOnRN(dismissToast);
      } else {
        translateY.set(withSpring(0, motion.springs.snappy));
        opacity.set(withTiming(1, { duration: motion.timing.instant }));
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!toast) {
    return null;
  }

  const iconName: keyof typeof Ionicons.glyphMap =
    toast.tone === 'complete'
      ? 'checkmark-circle'
      : toast.tone === 'alert'
        ? 'alert-circle'
        : toast.tone === 'accent'
          ? 'sparkles-outline'
          : 'information-circle-outline';

  const iconColor =
    toast.tone === 'complete'
      ? theme.colors.complete
      : toast.tone === 'alert'
        ? theme.colors.alert
        : theme.colors.accentText;

  const bottomOffset = aboveTabBar
    ? Math.max(insets.bottom, theme.space.sm) + 68
    : Math.max(insets.bottom, theme.space.md) + 12;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: bottomOffset,
        paddingHorizontal: theme.space.lg,
        alignItems: 'center',
        zIndex: 50,
      }}
    >
      <GestureDetector gesture={swipeDismiss}>
        <Animated.View
          accessibilityLiveRegion="polite"
          style={[
            {
              width: '100%',
              maxWidth: Math.min(maxContentWidth, 480),
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space.sm,
              backgroundColor: theme.colors.surfaceRaised,
              borderWidth: 1,
              borderColor: theme.colors.ruleStrong,
              borderRadius: theme.radius.md,
              paddingLeft: theme.space.md,
              paddingRight: toast.actionLabel ? theme.space.xs : theme.space.md,
              minHeight: 48,
              shadowColor: '#000',
              shadowOpacity: theme.mode === 'light' ? 0.08 : 0.28,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            },
            animatedStyle,
          ]}
        >
          <Ionicons name={iconName} size={18} color={iconColor} />
          <Text variant="bodySmall" style={{ flex: 1 }} numberOfLines={2}>
            {toast.message}
          </Text>
          {toast.actionLabel && toast.onAction ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={toast.actionLabel}
              onPress={() => {
                toast.onAction?.();
                dismissToast();
              }}
              hitSlop={6}
              style={({ pressed }) => ({
                minHeight: 40,
                minWidth: 48,
                paddingHorizontal: theme.space.md,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: theme.radius.sm,
                backgroundColor: pressed ? theme.colors.accentWash : 'transparent',
              })}
            >
              <Text variant="label" tone="accent">
                {toast.actionLabel}
              </Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
