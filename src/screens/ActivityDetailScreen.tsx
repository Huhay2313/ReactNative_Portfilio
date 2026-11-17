/**
 * ActivityDetailScreen: one activity, in full.
 *
 * UX & Animation principles applied:
 *   - Squash & stretch (#1) + Secondary action (#8): each checklist step checkbox
 *     compresses and rebounds on toggle while the progress bar glides smoothly.
 *   - Staging the focus (#3): scrolling past the title reveals a compact title
 *     and live percentage in the sticky top bar.
 *   - Exaggerated feedback (#10) & Frequency of use (#20): completing the final
 *     step triggers a celebratory seal & haptic burst ONLY on the transition to
 *     complete — never on repeat visits.
 *   - Postel's law (#18): removing evidence happens immediately with a 1-tap
 *     Undo toast instead of a blocking confirmation modal.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ProgressRule } from '@/components/ProgressRule';
import { Rule } from '@/components/Rule';
import { SectionHeader } from '@/components/SectionHeader';
import { StatusMark } from '@/components/StatusMark';
import { Text } from '@/components/Text';
import { useActivities } from '@/data/ActivityContext';
import type { ActivityStep, EvidenceItem } from '@/data/types';
import {
  describeDueDate,
  formatActivityNumber,
  formatDuration,
  formatLongDate,
  formatStepCount,
} from '@/lib/format';
import { useMotionConfig } from '@/lib/motion';
import { useToast } from '@/lib/ToastContext';
import { useTheme } from '@/theme/ThemeContext';
import { maxContentWidth } from '@/theme/tokens';
import { useLayout } from '@/lib/useLayout';

export interface ActivityDetailScreenProps {
  activityId: string;
  onBack: () => void;
}

const EVIDENCE_KINDS: { key: EvidenceItem['kind']; label: string }[] = [
  { key: 'note', label: 'Note' },
  { key: 'photo', label: 'Photo' },
  { key: 'file', label: 'File' },
];

export function ActivityDetailScreen({ activityId, onBack }: ActivityDetailScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const motion = useMotionConfig();
  const { showToast } = useToast();

  const {
    getActivity,
    getProgress,
    toggleStep,
    addEvidence,
    removeEvidence,
    restoreEvidence,
  } = useActivities();

  const activity = getActivity(activityId);
  const [evidenceLabel, setEvidenceLabel] = useState('');
  const [evidenceKind, setEvidenceKind] = useState<EvidenceItem['kind']>('note');
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const [showCompactHeader, setShowCompactHeader] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const progress = useMemo(
    () => (activity ? getProgress(activity) : null),
    [activity, getProgress],
  );

  const isComplete = progress?.status === 'complete';
  const showCompletionSeal = justCompleted && isComplete;

  const celebrateScale = useSharedValue(0.9);
  const celebrateOpacity = useSharedValue(0);

  useEffect(() => {
    if (showCompletionSeal) {
      if (motion.reduced) {
        celebrateScale.set(1);
        celebrateOpacity.set(withTiming(1, { duration: motion.timing.quick }));
      } else {
        celebrateScale.set(0.88);
        celebrateOpacity.set(0);
        celebrateScale.set(withSpring(1, motion.springs.celebrate));
        celebrateOpacity.set(withTiming(1, { duration: motion.timing.quick }));
      }
    }
  }, [
    showCompletionSeal,
    motion.reduced,
    motion.springs.celebrate,
    motion.timing.quick,
    celebrateScale,
    celebrateOpacity,
  ]);

  const celebrateStyle = useAnimatedStyle(() => ({
    opacity: celebrateOpacity.value,
    transform: [{ scale: celebrateScale.value }],
  }));

  if (!activity || !progress) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.canvas,
          paddingTop: insets.top,
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.space.md,
        }}
      >
        <Text variant="heading">This activity is no longer available</Text>
        <Button label="Go back" variant="secondary" onPress={onBack} />
      </View>
    );
  }

  const due = describeDueDate(activity.dueAt);
  const dueLabel = isComplete
    ? activity.completedAt
      ? `Completed ${formatLongDate(activity.completedAt)}`
      : 'Complete'
    : due.label;

  const handleToggle = (stepId: string) => {
    const nextAllDone =
      activity.steps.length > 0 &&
      activity.steps.every((s) => (s.id === stepId ? !s.done : s.done));
    if (nextAllDone && !isComplete) {
      setJustCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      if (!nextAllDone) setJustCompleted(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    toggleStep(activity.id, stepId);
  };

  const handleAddEvidence = () => {
    const label = evidenceLabel.trim();
    if (label.length === 0) return;
    addEvidence(activity.id, label, evidenceKind);
    setEvidenceLabel('');
    setIsAddingEvidence(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast({
      message: 'Evidence added to activity',
      tone: 'complete',
    });
  };

  const handleRemoveEvidence = (evidenceId: string) => {
    const removed = removeEvidence(activity.id, evidenceId);
    if (!removed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    showToast({
      message: `Removed “${removed.label}”`,
      tone: 'default',
      actionLabel: 'Undo',
      onAction: () => restoreEvidence(activity.id, removed),
    });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const shouldShow = y > 130;
    if (shouldShow !== showCompactHeader) {
      setShowCompactHeader(shouldShow);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.colors.canvas }}
    >
      {/* Sticky header with contextual live progress */}
      <View
        style={{
          paddingTop: insets.top + theme.space.sm,
          paddingBottom: theme.space.sm,
          paddingHorizontal: layout.gutter,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.rule,
          backgroundColor: theme.colors.canvas,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: maxContentWidth,
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.space.sm,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to the activity list"
            onPress={onBack}
            hitSlop={12}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              minHeight: 44,
              minWidth: 64,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
            <Text variant="bodySmall">Back</Text>
          </Pressable>

          {showCompactHeader ? (
            <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: theme.space.xs }}>
              <Text variant="bodySmall" numberOfLines={1}>
                {activity.title}
              </Text>
              <Text variant="micro" tone="accent">
                {Math.round(progress.ratio * 100)}% · {progress.done}/{progress.total} steps
              </Text>
            </View>
          ) : null}

          <Text variant="label" tone="faint">
            Activity {formatActivityNumber(activity.number)}
          </Text>
        </View>
      </View>

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={32}
        contentContainerStyle={{
          paddingHorizontal: layout.gutter,
          paddingBottom: insets.bottom + theme.space.xxl,
          width: '100%',
          maxWidth: maxContentWidth,
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ===== Title block ===== */}
        <View style={{ paddingTop: theme.space.lg, gap: theme.space.sm }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: theme.space.sm,
            }}
          >
            {activity.course ? (
              <Text variant="label" tone="accent">
                {activity.course}
              </Text>
            ) : (
              <View />
            )}
            <StatusMark status={progress.status} overdue={progress.overdue} />
          </View>

          <Text variant="display" accessibilityRole="header">
            {activity.title}
          </Text>

          {activity.summary ? (
            <Text variant="body" tone="soft">
              {activity.summary}
            </Text>
          ) : null}

          {/* Meta strip */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.space.md,
              marginTop: theme.space.sm,
            }}
          >
            <MetaItem
              icon={isComplete ? 'checkmark-circle-outline' : 'calendar-outline'}
              label={dueLabel}
              urgent={!isComplete && due.overdue}
            />
            <MetaItem icon="time-outline" label={formatDuration(activity.estimatedMinutes)} />
            <MetaItem icon="pricetag-outline" label={activity.category} />
          </View>

          <View style={{ marginTop: theme.space.md, gap: 6 }}>
            <ProgressRule
              value={progress.ratio}
              color={
                progress.status === 'complete'
                  ? theme.colors.complete
                  : progress.overdue
                    ? theme.colors.alert
                    : theme.colors.accent
              }
              height={5}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: theme.space.sm,
              }}
            >
              <Text variant="micro" tone="muted">
                {formatStepCount(progress.done, progress.total)}
              </Text>
              <Text variant="micro" tone="muted">
                {Math.round(progress.ratio * 100)}%
              </Text>
            </View>
          </View>

          {/* Celebratory seal shown ONLY when user completes the final step */}
          {showCompletionSeal ? (
            <Animated.View
              style={[
                {
                  marginTop: theme.space.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.space.sm,
                  padding: theme.space.md,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.completeWash,
                  borderWidth: 1,
                  borderColor: theme.colors.complete,
                },
                celebrateStyle,
              ]}
            >
              <Ionicons name="ribbon" size={20} color={theme.colors.complete} />
              <View style={{ flex: 1 }}>
                <Text variant="bodySmall" style={{ color: theme.colors.complete }}>
                  Activity complete
                </Text>
                <Text variant="micro" style={{ color: theme.colors.complete }}>
                  Recorded in your Portfolio timeline.
                </Text>
              </View>
            </Animated.View>
          ) : null}
        </View>

        {/* ===== Objectives ===== */}
        {activity.objectives.length > 0 ? (
          <>
            <SectionHeader title="Learning objectives" />
            <View style={{ gap: theme.space.sm }}>
              {activity.objectives.map((objective, index) => (
                <View
                  key={objective}
                  style={{ flexDirection: 'row', gap: theme.space.sm, alignItems: 'flex-start' }}
                >
                  <Text variant="micro" tone="faint" style={{ width: 18, paddingTop: 3 }}>
                    {index + 1}
                  </Text>
                  <Text variant="body" tone="soft" style={{ flex: 1 }}>
                    {objective}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* ===== Requirements ===== */}
        {activity.requirements.length > 0 ? (
          <>
            <SectionHeader title="Requirements" />
            <View style={{ gap: theme.space.xs }}>
              {activity.requirements.map((requirement) => (
                <View
                  key={requirement}
                  style={{ flexDirection: 'row', gap: theme.space.sm, alignItems: 'flex-start' }}
                >
                  <Ionicons
                    name="remove"
                    size={14}
                    color={theme.colors.textFaint}
                    style={{ marginTop: 3 }}
                  />
                  <Text variant="bodySmall" tone="soft" style={{ flex: 1 }}>
                    {requirement}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* ===== Instructions ===== */}
        {activity.instructions.length > 0 ? (
          <>
            <SectionHeader title="Procedure" />
            <View style={{ gap: theme.space.md }}>
              {activity.instructions.map((instruction, index) => (
                <View
                  key={instruction}
                  style={{ flexDirection: 'row', gap: theme.space.sm, alignItems: 'flex-start' }}
                >
                  <Text variant="label" tone="faint" style={{ width: 22, paddingTop: 2 }}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <Text variant="body" tone="soft" style={{ flex: 1 }}>
                    {instruction}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* ===== Interactive Animated Checklist ===== */}
        <SectionHeader
          title="Checklist"
          meta={formatStepCount(progress.done, progress.total)}
        />

        <View>
          {activity.steps.map((step, index) => (
            <View key={step.id}>
              {index > 0 ? <Rule /> : null}
              <ChecklistRow step={step} onToggle={() => handleToggle(step.id)} />
            </View>
          ))}
        </View>

        {/* ===== Evidence ===== */}
        <SectionHeader title="Evidence" meta={String(activity.evidence.length)} />

        {activity.evidence.length === 0 ? (
          <Text variant="bodySmall" tone="muted" style={{ paddingVertical: theme.space.sm }}>
            Nothing attached yet. Add a note, photo, or file reference to record what you produced.
          </Text>
        ) : (
          <View>
            {activity.evidence.map((item, index) => (
              <View key={item.id}>
                {index > 0 ? <Rule /> : null}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.space.md,
                    paddingVertical: theme.space.md,
                  }}
                >
                  <Ionicons
                    name={
                      item.kind === 'photo'
                        ? 'image-outline'
                        : item.kind === 'file'
                          ? 'document-outline'
                          : 'document-text-outline'
                    }
                    size={17}
                    color={theme.colors.accentText}
                  />
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text variant="bodySmall" numberOfLines={2}>
                      {item.label}
                    </Text>
                    <Text variant="micro" tone="faint">
                      {item.kind.toUpperCase()} · {formatLongDate(item.addedAt)}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.label}`}
                    onPress={() => handleRemoveEvidence(item.id)}
                    hitSlop={12}
                    style={({ pressed }) => ({
                      minWidth: 44,
                      minHeight: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: theme.radius.sm,
                      backgroundColor: pressed ? theme.colors.surfaceSunken : 'transparent',
                    })}
                  >
                    <Ionicons name="trash-outline" size={17} color={theme.colors.textMuted} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {isAddingEvidence ? (
          <View style={{ marginTop: theme.space.md, gap: theme.space.sm }}>
            <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
              {EVIDENCE_KINDS.map((kind) => (
                <Chip
                  key={kind.key}
                  label={kind.label}
                  selected={evidenceKind === kind.key}
                  onPress={() => setEvidenceKind(kind.key)}
                />
              ))}
            </View>
            <TextInput
              value={evidenceLabel}
              onChangeText={setEvidenceLabel}
              placeholder="What did you produce?"
              placeholderTextColor={theme.colors.textFaint}
              accessibilityLabel="Evidence description"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAddEvidence}
              style={{
                borderWidth: 1.5,
                borderColor: theme.colors.accent,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                fontFamily: theme.fontFamily.body,
                fontSize: 15,
                paddingHorizontal: theme.space.md,
                paddingVertical: theme.space.md,
                minHeight: 48,
              }}
            />
            <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
              <Button label="Add" onPress={handleAddEvidence} />
              <Button
                label="Cancel"
                variant="quiet"
                onPress={() => {
                  setIsAddingEvidence(false);
                  setEvidenceLabel('');
                }}
              />
            </View>
          </View>
        ) : (
          <View style={{ marginTop: theme.space.md }}>
            <Button
              label="Add evidence"
              icon="add"
              variant="secondary"
              onPress={() => setIsAddingEvidence(true)}
            />
          </View>
        )}

        {/* ===== Footer facts ===== */}
        <SectionHeader title="Record" />
        <View style={{ gap: theme.space.xs }}>
          <FactRow label="Assigned" value={formatLongDate(activity.assignedAt)} />
          <FactRow label="Due" value={formatLongDate(activity.dueAt)} />
          <FactRow
            label="Completed"
            value={activity.completedAt ? formatLongDate(activity.completedAt) : 'Not yet'}
          />
          <FactRow label="Period" value={activity.period} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Tactile checklist item with checkbox squash & stretch and checkmark reveal. */
function ChecklistRow({
  step,
  onToggle,
}: {
  step: ActivityStep;
  onToggle: () => void;
}) {
  const theme = useTheme();
  const motion = useMotionConfig();

  const boxScale = useSharedValue(1);
  const checkScale = useSharedValue(step.done ? 1 : 0.4);

  useEffect(() => {
    if (step.done) {
      if (motion.reduced) {
        boxScale.set(1);
        checkScale.set(1);
      } else {
        boxScale.set(
          withSequence(
            withTiming(0.84, { duration: 75 }),
            withSpring(1, motion.springs.tactile),
          ),
        );
        checkScale.set(withSpring(1, motion.springs.tactile));
      }
    } else {
      checkScale.set(0.4);
      if (!motion.reduced) {
        boxScale.set(
          withSequence(
            withTiming(0.9, { duration: 70 }),
            withSpring(1, motion.springs.snappy),
          ),
        );
      }
    }
  }, [step.done, motion.reduced, motion.springs.tactile, motion.springs.snappy, boxScale, checkScale]);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boxScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: step.done }}
      aria-checked={step.done}
      accessibilityLabel={step.text}
      onPress={onToggle}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space.md,
        paddingVertical: theme.space.md,
        paddingHorizontal: theme.space.xs,
        minHeight: 50,
        borderRadius: theme.radius.sm,
        backgroundColor: pressed ? theme.colors.surfaceSunken : 'transparent',
      })}
    >
      <Animated.View
        style={[
          {
            width: 24,
            height: 24,
            borderRadius: theme.radius.sm,
            borderWidth: 1.5,
            borderColor: step.done ? theme.colors.complete : theme.colors.ruleStrong,
            backgroundColor: step.done ? theme.colors.complete : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          },
          boxStyle,
        ]}
      >
        {step.done ? (
          <Animated.View style={checkStyle}>
            <Ionicons name="checkmark" size={15} color={theme.colors.canvas} />
          </Animated.View>
        ) : null}
      </Animated.View>

      <Text
        variant="body"
        tone={step.done ? 'muted' : 'default'}
        style={{
          flex: 1,
          textDecorationLine: step.done ? 'line-through' : 'none',
        }}
      >
        {step.text}
      </Text>
    </Pressable>
  );
}

function MetaItem({
  icon,
  label,
  urgent = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  urgent?: boolean;
}) {
  const theme = useTheme();
  const color = urgent ? theme.colors.alert : theme.colors.textMuted;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={13} color={color} />
      <Text variant="micro" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.space.md,
        paddingVertical: theme.space.xs,
      }}
    >
      <Text variant="micro" tone="muted">
        {label}
      </Text>
      <Text variant="micro" tone="soft" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}
