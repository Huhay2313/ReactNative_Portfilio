/**
 * FactCard: a small informational card with an icon, a title and one fact.
 *
 * Purely presentational. It sizes to its container so a deck can stack several
 * of them in the same place.
 */

import { Ionicons } from '@expo/vector-icons';
import { View, type DimensionValue } from 'react-native';

import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeContext';

export interface FactCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  width?: DimensionValue;
  height?: DimensionValue;
}

export function FactCard({ icon, title, body, width = '100%', height }: FactCardProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        width,
        height,
        gap: theme.space.sm,
        padding: theme.space.lg,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.rule,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.accentWash,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={18} color={theme.colors.accentText} />
      </View>
      <Text variant="heading">{title}</Text>
      <Text variant="bodySmall" tone="soft">
        {body}
      </Text>
    </View>
  );
}
