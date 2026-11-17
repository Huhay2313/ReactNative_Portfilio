/**
 * StatBlock: a figure with its label.
 *
 * Used on the home and portfolio screens. The figure is set in the display face
 * and the label in mono, so a row of stats reads as a data strip rather than as
 * a set of cards. Figures are always derived from real activity data.
 */

import { View } from 'react-native';

import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeContext';

export interface StatBlockProps {
  value: string;
  label: string;
  /** Colours the figure. Defaults to primary text. */
  tone?: 'default' | 'accent' | 'complete' | 'progress' | 'alert';
}

export function StatBlock({ value, label, tone = 'default' }: StatBlockProps) {
  const theme = useTheme();

  const color = {
    default: theme.colors.text,
    accent: theme.colors.accentText,
    complete: theme.colors.complete,
    progress: theme.colors.progress,
    alert: theme.colors.alert,
  }[tone];

  return (
    <View style={{ flex: 1, gap: 1 }}>
      {/* The figure is the content; the label explains it. */}
      <Text
        variant="title"
        style={{ color, fontSize: 24, lineHeight: 30 }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        accessibilityLabel={`${label}: ${value}`}
      >
        {value}
      </Text>
      {/* Two lines are reserved so a wrapping label cannot push its figure out
          of alignment with the others in the row. */}
      <Text variant="micro" tone="muted" numberOfLines={2} style={{ minHeight: 28 }}>
        {label}
      </Text>
    </View>
  );
}
