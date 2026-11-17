/**
 * FactDeck: one fact at a time, in a stack.
 *
 * Only a single card shows at first. Tapping the deck brings the next card in
 * over it, and the deck loops back to the first after the last. The tap target
 * is the whole deck, so no separate button is needed.
 *
 * Motion: the incoming card rises into place with a short, critically damped
 * spring and a fade. This is an occasional action, so it stays quick. With
 * Reduce Motion on, the card swaps with a brief cross-fade instead of moving.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { FactCard } from '@/components/FactCard';
import { Text } from '@/components/Text';
import type { ReactNativeFact } from '@/data/reactNativeFacts';
import { useMotionConfig } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeContext';

const DECK_HEIGHT = 204;

export interface FactDeckProps {
  facts: ReactNativeFact[];
}

export function FactDeck({ facts }: FactDeckProps) {
  const theme = useTheme();
  const motion = useMotionConfig();

  // `previous` stays underneath while `current` animates in over it.
  const [current, setCurrent] = useState(0);
  const [previous, setPrevious] = useState(0);
  const progress = useSharedValue(1);

  const incomingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [26, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.96, 1]) },
    ],
  }));

  if (facts.length === 0) {
    return null;
  }

  const fact = facts[current];
  const underneath = facts[previous];

  const showNext = () => {
    Haptics.selectionAsync().catch(() => {});
    setPrevious(current);
    setCurrent((current + 1) % facts.length);
    progress.set(0);
    if (motion.reduced) {
      progress.set(withTiming(1, { duration: motion.timing.quick }));
    } else {
      progress.set(withSpring(1, motion.springs.snappy));
    }
  };

  return (
    <View style={{ gap: theme.space.sm }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${fact.title}. ${fact.body}. Fact ${current + 1} of ${facts.length}.`}
        accessibilityHint="Shows the next fact"
        onPress={showNext}
        style={{ height: DECK_HEIGHT }}
      >
        {/* The card underneath, so the incoming card lands on something. */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <FactCard
            icon={underneath.icon}
            title={underneath.title}
            body={underneath.body}
            height={DECK_HEIGHT}
          />
        </View>

        <Animated.View
          style={[
            { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
            incomingStyle,
          ]}
        >
          <FactCard icon={fact.icon} title={fact.title} body={fact.body} height={DECK_HEIGHT} />
        </Animated.View>
      </Pressable>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Ionicons name="hand-left-outline" size={13} color={theme.colors.textFaint} />
          <Text variant="micro" tone="faint">
            Tap the card for the next fact
          </Text>
        </View>
        <Text variant="micro" tone="muted">
          {current + 1} of {facts.length}
        </Text>
      </View>
    </View>
  );
}
