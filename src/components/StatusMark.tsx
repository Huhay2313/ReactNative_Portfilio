/**
 * StatusMark: how an activity's state is shown.
 *
 * Status is never carried by colour alone. Every state has a distinct glyph and
 * a text label, so it survives colour blindness, greyscale, and a screen reader.
 */

import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeContext';
import type { ActivityStatus } from '@/data/types';

export interface StatusMarkProps {
  status: ActivityStatus;
  /** Overdue replaces the in-progress label with a more urgent one. */
  overdue?: boolean;
  /** Show the text label next to the glyph. Off for dense rows. */
  showLabel?: boolean;
}

export function StatusMark({ status, overdue = false, showLabel = true }: StatusMarkProps) {
  const theme = useTheme();

  const config: Record<
    ActivityStatus,
    { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; wash: string }
  > = {
    complete: {
      icon: 'checkmark-circle',
      label: 'Complete',
      color: theme.colors.complete,
      wash: theme.colors.completeWash,
    },
    in_progress: {
      icon: 'ellipsis-horizontal-circle',
      label: overdue ? 'Overdue' : 'In progress',
      color: overdue ? theme.colors.alert : theme.colors.progress,
      wash: overdue ? theme.colors.alertWash : theme.colors.progressWash,
    },
    not_started: {
      icon: 'ellipse-outline',
      label: overdue ? 'Overdue' : 'Not started',
      color: overdue ? theme.colors.alert : theme.colors.textMuted,
      wash: overdue ? theme.colors.alertWash : theme.colors.surfaceSunken,
    },
  };

  const state = config[status];

  if (!showLabel) {
    return (
      <Ionicons
        name={state.icon}
        size={18}
        color={state.color}
        accessibilityLabel={state.label}
      />
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: theme.radius.sm,
        backgroundColor: state.wash,
      }}
    >
      <Ionicons name={state.icon} size={13} color={state.color} />
      <Text variant="micro" tracked style={{ color: state.color }}>
        {state.label}
      </Text>
    </View>
  );
}
