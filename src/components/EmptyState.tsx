/**
 * EmptyState: what a screen says when it has nothing to show.
 *
 * An empty screen is an invitation to act, not an apology. Each state names
 * what is missing and offers the one action that resolves it.
 */

import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeContext';

export interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  /** The action that resolves the empty state. */
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: theme.space.xxl,
        paddingHorizontal: theme.space.lg,
        gap: theme.space.sm,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceSunken,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.space.xs,
        }}
      >
        <Ionicons name={icon} size={22} color={theme.colors.textMuted} />
      </View>

      <Text variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </Text>

      <Text
        variant="bodySmall"
        tone="muted"
        style={{ textAlign: 'center', maxWidth: 300 }}
      >
        {description}
      </Text>

      {actionLabel && onAction ? (
        <View style={{ marginTop: theme.space.md }}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}
