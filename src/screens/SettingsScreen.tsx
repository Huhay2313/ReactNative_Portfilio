/**
 * SettingsScreen: global profile & appearance controls.
 *
 * UX & Animation principles applied:
 *   - Pose to pose (#4) & Snappy timing (#9): radio selection indicator springs
 *     into place cleanly when switching Light (Paper), Dark (Ink), or System.
 *   - Doherty threshold (#17) & Exaggerated feedback (#10): changes propagate
 *     instantly across Home & Portfolio with a crisp non-blocking toast.
 *   - Postel's law (#18): editable Display Name, Programme, and Academic Period
 *     with safe trimming & instant cancel/revert.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Rule } from '@/components/Rule';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { useActivities } from '@/data/ActivityContext';
import { useMotionConfig } from '@/lib/motion';
import { useToast } from '@/lib/ToastContext';
import { useTheme, useThemeControl, type ThemePreference } from '@/theme/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SettingsScreen() {
  const theme = useTheme();
  const motion = useMotionConfig();
  const { showToast } = useToast();
  const { preference, setPreference } = useThemeControl();
  const { profile, updateProfile, resetAll, stats } = useActivities();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.displayName);
  const [programmeDraft, setProgrammeDraft] = useState(profile.programme);
  const [periodDraft, setPeriodDraft] = useState(profile.period);

  const startEditingProfile = () => {
    setNameDraft(profile.displayName);
    setProgrammeDraft(profile.programme);
    setPeriodDraft(profile.period);
    setIsEditingProfile(true);
  };

  const saveProfile = () => {
    const trimmedName = nameDraft.trim();
    if (trimmedName.length === 0) {
      setIsEditingProfile(false);
      setNameDraft(profile.displayName);
      return;
    }
    updateProfile({
      displayName: trimmedName,
      programme: programmeDraft.trim(),
      period: periodDraft.trim(),
    });
    setIsEditingProfile(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast({
      message: 'Profile updated across your dashboard',
      tone: 'complete',
    });
  };

  const confirmReset = () => {
    Alert.alert(
      'Clear all data?',
      'This removes every activity and resets your profile. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            resetAll();
            setIsEditingProfile(false);
            showToast({
              message: 'All data cleared',
              tone: 'accent',
            });
          },
        },
      ],
    );
  };

  const appearanceOptions: {
    key: ThemePreference;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    detail: string;
  }[] = [
    { key: 'light', label: 'Light', icon: 'sunny-outline', detail: 'Paper' },
    { key: 'dark', label: 'Dark', icon: 'moon-outline', detail: 'Ink' },
    { key: 'system', label: 'System', icon: 'phone-portrait-outline', detail: 'Follow device' },
  ];

  return (
    <Screen title="Settings" subtitle="Profile, appearance and app information">
      {/* ===== Profile ===== */}
      <SectionHeader
        title="Profile"
        action={
          !isEditingProfile ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              onPress={startEditingProfile}
              hitSlop={10}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                minHeight: 36,
                paddingHorizontal: 4,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Ionicons name="pencil" size={13} color={theme.colors.accentText} />
              <Text variant="label" tone="accent">
                Edit
              </Text>
            </Pressable>
          ) : null
        }
      />

      {isEditingProfile ? (
        <View style={{ gap: theme.space.md }}>
          <View style={{ gap: 4 }}>
            <Text variant="micro" tone="muted">
              Display name
            </Text>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              autoFocus
              accessibilityLabel="Display name"
              returnKeyType="next"
              style={{
                borderWidth: 1.5,
                borderColor: theme.colors.accent,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                fontFamily: theme.fontFamily.body,
                fontSize: 15,
                paddingHorizontal: theme.space.md,
                minHeight: 48,
              }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text variant="micro" tone="muted">
              Programme
            </Text>
            <TextInput
              value={programmeDraft}
              onChangeText={setProgrammeDraft}
              accessibilityLabel="Programme"
              returnKeyType="next"
              style={{
                borderWidth: 1,
                borderColor: theme.colors.ruleStrong,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                fontFamily: theme.fontFamily.body,
                fontSize: 15,
                paddingHorizontal: theme.space.md,
                minHeight: 48,
              }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text variant="micro" tone="muted">
              Academic period
            </Text>
            <TextInput
              value={periodDraft}
              onChangeText={setPeriodDraft}
              accessibilityLabel="Academic period"
              returnKeyType="done"
              onSubmitEditing={saveProfile}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.ruleStrong,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                fontFamily: theme.fontFamily.body,
                fontSize: 15,
                paddingHorizontal: theme.space.md,
                minHeight: 48,
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
            <Button label="Save changes" onPress={saveProfile} />
            <Button
              label="Cancel"
              variant="quiet"
              onPress={() => {
                setNameDraft(profile.displayName);
                setProgrammeDraft(profile.programme);
                setPeriodDraft(profile.period);
                setIsEditingProfile(false);
              }}
            />
          </View>
        </View>
      ) : (
        <View style={{ gap: theme.space.md }}>
          <View style={{ gap: 4 }}>
            <Text variant="micro" tone="muted">
              Display name
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Display name: ${profile.displayName}. Tap to edit.`}
              onPress={startEditingProfile}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: theme.space.md,
                borderWidth: 1,
                borderColor: theme.colors.rule,
                borderRadius: theme.radius.md,
                backgroundColor: pressed ? theme.colors.surfaceSunken : theme.colors.surface,
                paddingHorizontal: theme.space.md,
                minHeight: 48,
              })}
            >
              <Text variant="body">{profile.displayName}</Text>
              <Ionicons name="pencil" size={15} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          <View style={{ gap: 4 }}>
            <Text variant="micro" tone="muted">
              Programme
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Programme: ${profile.programme}. Tap to edit.`}
              onPress={startEditingProfile}
              style={({ pressed }) => ({
                borderWidth: 1,
                borderColor: theme.colors.rule,
                borderRadius: theme.radius.md,
                backgroundColor: pressed ? theme.colors.surfaceSunken : theme.colors.surface,
                paddingHorizontal: theme.space.md,
                minHeight: 48,
                justifyContent: 'center',
              })}
            >
              <Text variant="body" tone="soft">
                {profile.programme || 'Not set'}
              </Text>
            </Pressable>
          </View>

          <View style={{ gap: 4 }}>
            <Text variant="micro" tone="muted">
              Academic period
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Academic period: ${profile.period}. Tap to edit.`}
              onPress={startEditingProfile}
              style={({ pressed }) => ({
                borderWidth: 1,
                borderColor: theme.colors.rule,
                borderRadius: theme.radius.md,
                backgroundColor: pressed ? theme.colors.surfaceSunken : theme.colors.surface,
                paddingHorizontal: theme.space.md,
                minHeight: 48,
                justifyContent: 'center',
              })}
            >
              <Text variant="body" tone="soft">
                {profile.period || 'Not set'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ===== Appearance ===== */}
      <SectionHeader title="Appearance" />

      <View style={{ gap: theme.space.sm }}>
        {appearanceOptions.map((option) => (
          <AppearanceOptionCard
            key={option.key}
            option={option}
            selected={preference === option.key}
            reducedMotion={motion.reduced}
            onSelect={() => {
              if (preference === option.key) return;
              Haptics.selectionAsync().catch(() => {});
              setPreference(option.key);
              showToast({
                message: `Theme: ${option.label} (${option.detail})`,
                tone: 'accent',
              });
            }}
          />
        ))}
      </View>

      <Text variant="micro" tone="faint" style={{ marginTop: theme.space.sm }}>
        Your choice is saved on this device and updates every screen immediately.
      </Text>

      {/* ===== Data ===== */}
      <SectionHeader title="Data" />

      <View style={{ gap: theme.space.sm }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: theme.space.sm,
          }}
        >
          <Text variant="bodySmall" tone="muted">
            Activities stored
          </Text>
          <Text variant="bodySmall">{stats.total}</Text>
        </View>
        <Rule />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: theme.space.sm,
          }}
        >
          <Text variant="bodySmall" tone="muted">
            Evidence items
          </Text>
          <Text variant="bodySmall">{stats.evidenceCount}</Text>
        </View>
        <Rule />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: theme.space.sm,
          }}
        >
          <Text variant="bodySmall" tone="muted">
            Storage
          </Text>
          <Text variant="bodySmall">On this device</Text>
        </View>
      </View>

      <View style={{ marginTop: theme.space.md }}>
        <Button
          label="Clear all data"
          variant="secondary"
          icon="refresh-outline"
          onPress={confirmReset}
        />
      </View>

      {/* ===== About ===== */}
      <SectionHeader title="About" />

      <View style={{ gap: theme.space.xs }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: theme.space.xs,
          }}
        >
          <Text variant="micro" tone="muted">
            Application
          </Text>
          <Text variant="micro" tone="soft">
            Labfolio
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: theme.space.xs,
          }}
        >
          <Text variant="micro" tone="muted">
            Version
          </Text>
          <Text variant="micro" tone="soft">
            1.0.0
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: theme.space.xs,
          }}
        >
          <Text variant="micro" tone="muted">
            Purpose
          </Text>
          <Text variant="micro" tone="soft" style={{ flexShrink: 1, textAlign: 'right' }}>
            Academic laboratory workspace
          </Text>
        </View>
      </View>

      <Text variant="micro" tone="faint" style={{ marginTop: theme.space.lg }}>
        Labfolio keeps your laboratory record, progress and evidence in one place. All data
        is stored locally on this device.
      </Text>
    </Screen>
  );
}

function AppearanceOptionCard({
  option,
  selected,
  reducedMotion,
  onSelect,
}: {
  option: {
    key: ThemePreference;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    detail: string;
  };
  selected: boolean;
  reducedMotion: boolean;
  onSelect: () => void;
}) {
  const theme = useTheme();
  const motion = useMotionConfig();

  const cardScale = useSharedValue(1);
  const checkScale = useSharedValue(selected ? 1 : 0.4);

  useEffect(() => {
    if (selected) {
      checkScale.set(reducedMotion ? 1 : withSpring(1, motion.springs.tactile));
    } else {
      checkScale.set(0.4);
    }
  }, [selected, reducedMotion, motion.springs.tactile, checkScale]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      accessibilityLabel={`${option.label} appearance`}
      onPressIn={() => {
        if (!reducedMotion) {
          cardScale.set(withTiming(0.985, { duration: motion.timing.instant }));
        }
      }}
      onPressOut={() => {
        if (!reducedMotion) {
          cardScale.set(withSpring(1, motion.springs.snappy));
        }
      }}
      onPress={onSelect}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.md,
          borderWidth: 1,
          borderColor: selected ? theme.colors.accent : theme.colors.rule,
          borderRadius: theme.radius.md,
          backgroundColor: selected ? theme.colors.accentWash : theme.colors.surface,
          paddingHorizontal: theme.space.md,
          minHeight: 54,
        },
        cardStyle,
      ]}
    >
      <Ionicons
        name={option.icon}
        size={18}
        color={selected ? theme.colors.accentText : theme.colors.textMuted}
      />
      <View style={{ flex: 1 }}>
        <Text
          variant="bodySmall"
          style={{ color: selected ? theme.colors.accentText : theme.colors.text }}
        >
          {option.label}
        </Text>
        <Text
          variant="micro"
          style={{ color: selected ? theme.colors.accentText : theme.colors.textFaint }}
        >
          {option.detail}
        </Text>
      </View>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 1.5,
          borderColor: selected ? theme.colors.accent : theme.colors.ruleStrong,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? (
          <Animated.View style={checkStyle}>
            <Ionicons name="checkmark" size={13} color={theme.colors.accentText} />
          </Animated.View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}
