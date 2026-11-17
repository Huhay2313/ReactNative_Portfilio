/**
 * Screen: the shared page scaffold.
 *
 * Every screen uses this so safe areas, gutters, the background colour, and the
 * maximum reading width are handled once. It also gives each screen the same
 * large-title treatment, which is what makes the app feel like one product.
 */

import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { useLayout } from '@/lib/useLayout';
import { maxContentWidth } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

export interface ScreenProps {
  /** The large title at the top of the screen. */
  title?: string;
  /** A short line under the title. */
  subtitle?: string;
  /** Content pinned above the scroll area, e.g. a search field. */
  header?: ReactNode;
  /** Rendered at the top-right of the title block. */
  action?: ReactNode;
  children: ReactNode;
  /** Disables scrolling, for screens that manage their own list. */
  scroll?: boolean;
  /** Extra bottom padding, for screens behind the tab bar. */
  bottomInset?: number;
}

export function Screen({
  title,
  subtitle,
  header,
  action,
  children,
  scroll = true,
  bottomInset = 0,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const layout = useLayout();

  const content = (
    <View
      style={{
        width: '100%',
        maxWidth: maxContentWidth,
        alignSelf: 'center',
        paddingHorizontal: layout.gutter,
      }}
    >
      {title ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: theme.space.md,
            paddingTop: theme.space.lg,
            paddingBottom: subtitle ? theme.space.xs : theme.space.md,
          }}
        >
          <View style={{ flex: 1 }}>
            {/* The title uses the smaller display size: a greeting with a name
                is longer than a screen name, and at 26pt it holds one line on a
                360pt screen instead of wrapping to three. */}
            <Text variant="displaySmall" accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? (
              <Text variant="bodySmall" tone="muted" style={{ marginTop: 2 }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {action}
        </View>
      ) : null}

      {header}

      {children}
    </View>
  );

  if (!scroll) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.canvas,
          paddingTop: insets.top,
          paddingBottom: bottomInset,
        }}
      >
        {content}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.canvas }}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + bottomInset + theme.space.xxl,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );
}
