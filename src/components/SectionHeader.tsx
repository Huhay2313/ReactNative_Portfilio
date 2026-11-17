/**
 * SectionHeader: a ruled section title.
 *
 * The rule is the hierarchy. A heading with a hairline running to the right edge
 * separates sections without adding a container, which keeps the page reading
 * as one document.
 */

import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeContext';

export interface SectionHeaderProps {
  title: string;
  /** A count or short meta shown after the title. */
  meta?: string;
  /** A trailing action, e.g. "See all". */
  action?: ReactNode;
}

export function SectionHeader({ title, meta, action }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space.sm,
        marginTop: theme.space.xl,
        marginBottom: theme.space.sm,
      }}
    >
      <Text variant="label" tone="muted" tracked>
        {title}
      </Text>
      {meta ? (
        <Text variant="micro" tone="faint">
          {meta}
        </Text>
      ) : null}
      <View
        style={{
          flex: 1,
          height: 1,
          backgroundColor: theme.colors.rule,
        }}
      />
      {action}
    </View>
  );
}
