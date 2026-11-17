/**
 * AddActivitySheet: gesture-dismissible bottom sheet for adding a new lab activity.
 *
 * UX & Animation principles applied:
 *   - Staging the focus (#3) & Solid drawing in 3D (#11): scrim dims the workspace
 *     while the sheet rises from the bottom edge.
 *   - Slow in & slow out (#6) & Snappy timing (#9): enters with SPRINGS.snappy.
 *   - Hick's law (#15): quick due-date presets & category chips reduce cognitive load.
 *   - Postel's law (#18) & Jakob's law (#19): swipe down on handle to dismiss,
 *     backdrop tap to dismiss, visible close button, and forgiving trimmed input.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Text } from '@/components/Text';
import { useActivities } from '@/data/ActivityContext';
import type { ActivityCategory } from '@/data/types';
import { useMotionConfig } from '@/lib/motion';
import { useToast } from '@/lib/ToastContext';
import { useTheme } from '@/theme/ThemeContext';
import { maxContentWidth } from '@/theme/tokens';

const CATEGORIES: ActivityCategory[] = [
  'Experiment',
  'Analysis',
  'Microscopy',
  'Field Work',
  'Report',
];

const DUE_PRESETS: { label: string; days: number | null }[] = [
  { label: 'In 3 days', days: 3 },
  { label: 'Next week', days: 7 },
  { label: 'In 2 weeks', days: 14 },
  { label: 'No deadline', days: null },
];

export interface AddActivitySheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated?: (activityId: string) => void;
}

export function AddActivitySheet({
  visible,
  onClose,
  onCreated,
}: AddActivitySheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const motion = useMotionConfig();
  const { addActivity } = useActivities();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('Experiment');
  const [summary, setSummary] = useState('');
  const [duePresetIndex, setDuePresetIndex] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<'title' | 'course' | 'summary' | null>(null);

  const translateY = useSharedValue(480);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      if (motion.reduced) {
        translateY.set(0);
        backdropOpacity.set(withTiming(1, { duration: motion.timing.quick }));
      } else {
        translateY.set(420);
        backdropOpacity.set(0);
        translateY.set(withSpring(0, motion.springs.snappy));
        backdropOpacity.set(
          withTiming(1, {
            duration: motion.timing.transition,
            easing: motion.easing.enter,
          }),
        );
      }
    }
  }, [
    visible,
    motion.reduced,
    motion.springs.snappy,
    motion.timing.quick,
    motion.timing.transition,
    motion.easing.enter,
    translateY,
    backdropOpacity,
  ]);

  const dismiss = () => {
    setErrorMsg(null);
    onClose();
  };

  const panDismiss = Gesture.Pan()
    .activeOffsetY(8)
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.set(event.translationY);
        backdropOpacity.set(Math.max(0.15, 1 - event.translationY / 320));
      }
    })
    .onEnd((event) => {
      if (event.translationY > 110 || event.velocityY > 750) {
        scheduleOnRN(dismiss);
      } else {
        translateY.set(withSpring(0, motion.springs.snappy));
        backdropOpacity.set(withTiming(1, { duration: motion.timing.quick }));
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleCreate = () => {
    const cleanTitle = title.trim();
    const cleanCourse = course.trim();
    if (cleanTitle.length === 0) {
      setErrorMsg('Give this activity a short title so you can find it later.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    const preset = DUE_PRESETS[duePresetIndex];
    const dueAt =
      preset.days === null
        ? null
        : new Date(Date.now() + preset.days * 86_400_000).toISOString();

    const createdId = addActivity({
      title: cleanTitle,
      course: cleanCourse,
      category,
      summary: summary.trim(),
      dueAt,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTitle('');
    setCourse('');
    setSummary('');
    setCategory('Experiment');
    setDuePresetIndex(1);
    setErrorMsg(null);
    onClose();

    showToast({
      message: `Added “${cleanTitle}”`,
      tone: 'complete',
      actionLabel: onCreated ? 'Open' : undefined,
      onAction: onCreated ? () => onCreated(createdId) : undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        {/* Dimmed backdrop */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme.colors.scrim,
            },
            scrimStyle,
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close new activity sheet"
            style={{ flex: 1 }}
            onPress={dismiss}
          />
        </Animated.View>

        <Animated.View
          style={[
            {
              width: '100%',
              maxWidth: maxContentWidth,
              alignSelf: 'center',
              maxHeight: '88%',
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderTopWidth: 1,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: theme.colors.ruleStrong,
              paddingBottom: Math.max(insets.bottom, theme.space.lg),
            },
            sheetStyle,
          ]}
        >
          {/* Drag handle + header */}
          <GestureDetector gesture={panDismiss}>
            <View
              style={{
                paddingTop: theme.space.sm,
                paddingHorizontal: theme.space.lg,
                paddingBottom: theme.space.sm,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.rule,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.colors.ruleStrong,
                  alignSelf: 'center',
                  marginBottom: theme.space.sm,
                }}
              />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View>
                  <Text variant="title">New laboratory activity</Text>
                  <Text variant="micro" tone="muted">
                    Added to your library and period totals
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss"
                  onPress={dismiss}
                  hitSlop={10}
                  style={({ pressed }) => ({
                    width: 44,
                    height: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: theme.radius.sm,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Ionicons name="close" size={22} color={theme.colors.textMuted} />
                </Pressable>
              </View>
            </View>
          </GestureDetector>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              padding: theme.space.lg,
              gap: theme.space.md,
            }}
          >
            {/* Title */}
            <View style={{ gap: 4 }}>
              <Text variant="micro" tone="muted">
                Title
              </Text>
              <TextInput
                value={title}
                onChangeText={(value) => {
                  setTitle(value);
                  if (errorMsg) setErrorMsg(null);
                }}
                onFocus={() => setFocusedField('title')}
                onBlur={() => setFocusedField(null)}
                placeholder="Title of the activity"
                placeholderTextColor={theme.colors.textFaint}
                accessibilityLabel="Activity title"
                returnKeyType="next"
                style={{
                  borderWidth: 1.5,
                  borderColor: errorMsg
                    ? theme.colors.alert
                    : focusedField === 'title'
                      ? theme.colors.accent
                      : theme.colors.rule,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.canvas,
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.body,
                  fontSize: 15,
                  paddingHorizontal: theme.space.md,
                  minHeight: 48,
                }}
              />
              {errorMsg ? (
                <Text variant="micro" tone="alert">
                  {errorMsg}
                </Text>
              ) : null}
            </View>

            {/* Course */}
            <View style={{ gap: 4 }}>
              <Text variant="micro" tone="muted">
                Course
              </Text>
              <TextInput
                value={course}
                onChangeText={setCourse}
                onFocus={() => setFocusedField('course')}
                onBlur={() => setFocusedField(null)}
                placeholder="Course or subject (optional)"
                placeholderTextColor={theme.colors.textFaint}
                accessibilityLabel="Course name"
                returnKeyType="next"
                style={{
                  borderWidth: 1.5,
                  borderColor:
                    focusedField === 'course' ? theme.colors.accent : theme.colors.rule,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.canvas,
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.body,
                  fontSize: 15,
                  paddingHorizontal: theme.space.md,
                  minHeight: 48,
                }}
              />
            </View>

            {/* Category */}
            <View style={{ gap: 6 }}>
              <Text variant="micro" tone="muted">
                Category
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
                {CATEGORIES.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    selected={category === item}
                    onPress={() => setCategory(item)}
                  />
                ))}
              </View>
            </View>

            {/* Due preset */}
            <View style={{ gap: 6 }}>
              <Text variant="micro" tone="muted">
                Deadline
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
                {DUE_PRESETS.map((preset, idx) => (
                  <Chip
                    key={preset.label}
                    label={preset.label}
                    selected={duePresetIndex === idx}
                    onPress={() => setDuePresetIndex(idx)}
                  />
                ))}
              </View>
            </View>

            {/* Summary */}
            <View style={{ gap: 4 }}>
              <Text variant="micro" tone="muted">
                Brief note (optional)
              </Text>
              <TextInput
                value={summary}
                onChangeText={setSummary}
                onFocus={() => setFocusedField('summary')}
                onBlur={() => setFocusedField(null)}
                placeholder="Notes about this activity"
                placeholderTextColor={theme.colors.textFaint}
                accessibilityLabel="Activity summary"
                multiline
                numberOfLines={2}
                style={{
                  borderWidth: 1.5,
                  borderColor:
                    focusedField === 'summary' ? theme.colors.accent : theme.colors.rule,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.canvas,
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.body,
                  fontSize: 15,
                  paddingHorizontal: theme.space.md,
                  paddingVertical: theme.space.sm,
                  minHeight: 72,
                  textAlignVertical: 'top',
                }}
              />
            </View>

            <View style={{ paddingTop: theme.space.xs, gap: theme.space.sm }}>
              <Button
                label="Add activity"
                icon="add"
                fullWidth
                onPress={handleCreate}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
