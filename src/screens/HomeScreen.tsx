/**
 * HomeScreen: the identity and focus screen.
 *
 * UX & Animation principles applied:
 *   - Staging the focus (#3) & Hick's law (#15): "Continue working" takes clear
 *     visual lead; stats and recent items stay quiet beneath.
 *   - Squash & stretch (#1) + Follow through (#5): the hero card compresses on
 *     touch-down while the "Open →" arrow slides subtly forward.
 *   - Fitts's law (#13) & Bigger hit areas (#14): stat blocks act as large,
 *     reachable filter shortcuts directly into the Library.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ActivityRow } from '@/components/ActivityRow';
import { FactDeck } from '@/components/FactDeck';
import { ProgressRule } from '@/components/ProgressRule';
import { Rule } from '@/components/Rule';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { StatBlock } from '@/components/StatBlock';
import { StatusMark } from '@/components/StatusMark';
import { Text } from '@/components/Text';
import { useActivities } from '@/data/ActivityContext';
import { REACT_NATIVE_FACTS } from '@/data/reactNativeFacts';
import {
  describeDueDate,
  firstNameOf,
  formatDuration,
  formatPercent,
  formatStepCount,
  greetingForHour,
} from '@/lib/format';
import { useMotionConfig } from '@/lib/motion';
import type { LibraryStatusFilter } from '@/screens/LibraryScreen';
import { useTheme } from '@/theme/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface HomeScreenProps {
  onOpenActivity: (id: string) => void;
  onOpenLibrary: (status?: LibraryStatusFilter) => void;
}

export function HomeScreen({ onOpenActivity, onOpenLibrary }: HomeScreenProps) {
  const theme = useTheme();
  const motion = useMotionConfig();
  const { activities, profile, stats, getProgress } = useActivities();

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const firstName = firstNameOf(profile.displayName);
  const subtitle = [profile.programme, profile.period].filter(Boolean).join(' · ') || undefined;

  const heroScale = useSharedValue(1);
  const heroArrowX = useSharedValue(0);
  const [heroPressed, setHeroPressed] = useState(false);

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
  }));

  const heroArrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: heroArrowX.value }],
  }));

  // The "continue" activity is the most recently assigned in-progress one. If
  // nothing is in progress, fall back to the nearest deadline that is not done.
  const focusActivity = useMemo(() => {
    if (stats.activeActivities.length > 0) {
      return stats.activeActivities[0];
    }
    const upcoming = activities
      .filter((activity) => getProgress(activity).status !== 'complete')
      .sort((a, b) => {
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      });
    return upcoming[0] ?? null;
  }, [activities, getProgress, stats.activeActivities]);

  const focusProgress = focusActivity ? getProgress(focusActivity) : null;
  const focusDue = focusActivity ? describeDueDate(focusActivity.dueAt) : null;

  const ordered = useMemo(
    () =>
      [...activities].sort(
        (a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime(),
      ),
    [activities],
  );

  const jumpToFilter = (status: LibraryStatusFilter) => {
    Haptics.selectionAsync().catch(() => {});
    onOpenLibrary(status);
  };

  return (
    <Screen
      title={`${greeting}, ${firstName}`}
      subtitle={subtitle}
    >
      {/* ===== React Native facts: one card, tap for the next ===== */}
      <SectionHeader title="React Native facts" />
      <FactDeck facts={REACT_NATIVE_FACTS} />

      {/* ===== The focus block ===== */}
      {focusActivity && focusProgress && focusDue ? (
        <>
          <SectionHeader title="Continue working" meta={focusActivity.course} />

          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={`Continue ${focusActivity.title}`}
            onPressIn={() => {
              setHeroPressed(true);
              if (!motion.reduced) {
                heroScale.set(withTiming(0.982, { duration: motion.timing.instant }));
                heroArrowX.set(withTiming(5, { duration: motion.timing.instant }));
              }
            }}
            onPressOut={() => {
              setHeroPressed(false);
              if (!motion.reduced) {
                heroScale.set(withSpring(1, motion.springs.tactile));
                heroArrowX.set(withSpring(0, motion.springs.tactile));
              }
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onOpenActivity(focusActivity.id);
            }}
            style={[
              {
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: heroPressed ? theme.colors.accent : theme.colors.rule,
                borderRadius: theme.radius.md,
                padding: theme.space.lg,
                gap: theme.space.sm,
                shadowColor: '#000',
                shadowOpacity: theme.mode === 'light' ? 0.04 : 0.2,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 1,
              },
              heroAnimatedStyle,
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: theme.space.sm,
              }}
            >
              <Text variant="micro" tone="faint">
                Activity {focusActivity.number.toString().padStart(2, '0')}
              </Text>
              <StatusMark status={focusProgress.status} overdue={focusProgress.overdue} />
            </View>

            <Text variant="title" numberOfLines={2}>
              {focusActivity.title}
            </Text>

            {focusActivity.summary ? (
              <Text variant="bodySmall" tone="muted" numberOfLines={2}>
                {focusActivity.summary}
              </Text>
            ) : null}

            <View style={{ marginTop: theme.space.xs, gap: 6 }}>
              <ProgressRule
                value={focusProgress.ratio}
                color={
                  focusProgress.overdue ? theme.colors.alert : theme.colors.accent
                }
                height={4}
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: theme.space.sm,
                }}
              >
                <Text variant="micro" tone="muted">
                  {formatStepCount(focusProgress.done, focusProgress.total)}
                </Text>
                <Text
                  variant="micro"
                  tone={focusDue.overdue ? 'alert' : focusDue.urgent ? 'progress' : 'muted'}
                >
                  {focusDue.label}
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: theme.space.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons name="time-outline" size={13} color={theme.colors.textFaint} />
                <Text variant="micro" tone="faint">
                  about {formatDuration(focusActivity.estimatedMinutes)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text variant="label" tone="accent">
                  Open
                </Text>
                <Animated.View style={heroArrowStyle}>
                  <Ionicons name="arrow-forward" size={13} color={theme.colors.accentText} />
                </Animated.View>
              </View>
            </View>
          </AnimatedPressable>
        </>
      ) : null}

      {stats.total > 0 ? (
        <>
      {/* ===== Progress strip (interactive shortcuts to Library) ===== */}
      <SectionHeader title="Progress" meta={profile.period || undefined} />

      <View
        style={{
          flexDirection: 'row',
          gap: theme.space.sm,
          paddingVertical: theme.space.xs,
        }}
      >
        <StatFilterTile onPress={() => jumpToFilter('all')} label="All activities">
          <StatBlock
            value={formatPercent(stats.overallRatio)}
            label="Steps done"
            tone="accent"
          />
        </StatFilterTile>
        <StatFilterTile onPress={() => jumpToFilter('complete')} label="Filter finished activities">
          <StatBlock value={String(stats.complete)} label="Finished" tone="complete" />
        </StatFilterTile>
        <StatFilterTile onPress={() => jumpToFilter('in_progress')} label="Filter in-progress activities">
          <StatBlock value={String(stats.inProgress)} label="In progress" tone="progress" />
        </StatFilterTile>
        <StatFilterTile onPress={() => jumpToFilter('overdue')} label="Filter overdue activities">
          <StatBlock
            value={String(stats.overdue)}
            label="Overdue"
            tone={stats.overdue > 0 ? 'alert' : 'default'}
          />
        </StatFilterTile>
      </View>

      <View style={{ marginTop: theme.space.sm, gap: 6 }}>
        <ProgressRule value={stats.overallRatio} height={4} />
        <Text variant="micro" tone="faint">
          {stats.stepsDone} of {stats.stepsTotal} steps across {stats.total} activities
        </Text>
      </View>

        </>
      ) : null}

      {/* ===== Activities: new ones land here, newest first, and the screen scrolls ===== */}
      <SectionHeader
        title="Activities"
        meta={stats.total > 0 ? String(stats.total) : undefined}
        action={
          stats.total === 0 ? undefined : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open the activity library"
            onPress={() => onOpenLibrary('all')}
            hitSlop={10}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              minHeight: 36,
              paddingHorizontal: 4,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Text variant="label" tone="accent">
              Library
            </Text>
            <Ionicons name="arrow-forward" size={12} color={theme.colors.accentText} />
          </Pressable>
          )
        }
      />

      {stats.total === 0 ? (
        <Text
          variant="bodySmall"
          tone="muted"
          style={{ paddingVertical: theme.space.lg, textAlign: 'center' }}
        >
          No activities yet
        </Text>
      ) : (
        <View>
          {ordered.map((activity, index) => (
            <View key={activity.id}>
              {index > 0 ? <Rule /> : null}
              <ActivityRow
                activity={activity}
                progress={getProgress(activity)}
                onPress={() => onOpenActivity(activity.id)}
              />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

function StatFilterTile({
  children,
  onPress,
  label,
}: {
  children: React.ReactNode;
  onPress: () => void;
  label: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        flex: 1,
        paddingVertical: theme.space.xs,
        paddingHorizontal: theme.space.xs,
        borderRadius: theme.radius.sm,
        backgroundColor: pressed ? theme.colors.surfaceSunken : 'transparent',
      })}
    >
      {children}
    </Pressable>
  );
}
