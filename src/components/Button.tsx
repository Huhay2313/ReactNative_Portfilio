/**
 * Button: the app's tactile action surface.
 *
 * UX & Animation principles applied:
 *   - Squash & stretch (#1): slight horizontal stretch + vertical compression on press-in.
 *   - Solid drawing in 3D (#11): subtle downward press shift (translateY).
 *   - Follow through (#5) & Secondary action (#8): leading icon gently nudges on press.
 *   - Doherty threshold (#17): immediate feedback within the first frame on touch-down.
 *   - Bigger hit areas (#14): >=48pt height + generous horizontal padding & hitSlop.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, type PressableProps } from 'react-native';
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

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  /** An optional leading icon. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Stretches to the container width. */
  fullWidth?: boolean;
  /** Fires a light haptic on press. On by default for primary actions. */
  haptic?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  icon,
  fullWidth = false,
  haptic,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const motion = useMotionConfig();

  const shouldHaptic = haptic ?? variant === 'primary';

  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const translateY = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const pressOpacity = useSharedValue(1);

  const palette = {
    primary: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
      borderWidth: 1,
      textColor: theme.colors.onAccent,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.ruleStrong,
      borderWidth: 1,
      textColor: theme.colors.text,
    },
    quiet: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 1,
      textColor: theme.colors.accentText,
    },
  }[variant];

  const containerStyle = useAnimatedStyle(() => ({
    opacity: disabled ? 0.45 : pressOpacity.value,
    transform: [
      { translateY: translateY.value },
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
    ],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const handlePressIn: PressableProps['onPressIn'] = (event) => {
    if (!disabled) {
      if (motion.reduced) {
        pressOpacity.set(withTiming(0.7, { duration: motion.timing.instant }));
      } else {
        // Immediate tactile squash & stretch on touch-down (Doherty threshold).
        scaleX.set(withTiming(1.014, { duration: motion.timing.instant }));
        scaleY.set(withTiming(0.96, { duration: motion.timing.instant }));
        translateY.set(withTiming(1.5, { duration: motion.timing.instant }));
        pressOpacity.set(withTiming(0.9, { duration: motion.timing.instant }));
        iconScale.set(withTiming(0.88, { duration: motion.timing.instant }));
      }
    }
    onPressIn?.(event);
  };

  const handlePressOut: PressableProps['onPressOut'] = (event) => {
    if (motion.reduced) {
      pressOpacity.set(withTiming(1, { duration: motion.timing.instant }));
    } else {
      scaleX.set(withSpring(1, motion.springs.tactile));
      scaleY.set(withSpring(1, motion.springs.tactile));
      translateY.set(withSpring(0, motion.springs.tactile));
      pressOpacity.set(withTiming(1, { duration: motion.timing.quick }));
      // Slight follow-through rebound on the icon.
      iconScale.set(withSpring(1, motion.springs.tactile));
    }
    onPressOut?.(event);
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={4}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={(event) => {
        if (shouldHaptic) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress?.(event);
      }}
      style={[
        {
          minHeight: 48,
          paddingHorizontal: variant === 'quiet' ? theme.space.md : theme.space.lg,
          borderRadius: theme.radius.md,
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          borderWidth: palette.borderWidth,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.space.sm,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        containerStyle,
      ]}
      {...rest}
    >
      {icon ? (
        <Animated.View style={iconStyle}>
          <Ionicons name={icon} size={17} color={palette.textColor} />
        </Animated.View>
      ) : null}
      <Text
        variant="heading"
        style={{ color: palette.textColor, fontSize: 15 }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}
