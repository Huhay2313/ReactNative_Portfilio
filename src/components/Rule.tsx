/**
 * Rule: the app's primary structural device.
 *
 * Rather than separating every block with a shadowed card, LABFOLIO separates
 * content with ruled lines, the way a laboratory notebook does. A rule is
 * cheap, quiet, and carries more hierarchy than a shadow at small sizes.
 */

import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';

export interface RuleProps extends ViewProps {
  /** A stronger rule for a section boundary. */
  strong?: boolean;
  /** Inset from the left, to align under a label rather than the container. */
  inset?: number;
}

export function Rule({ strong = false, inset = 0, style, ...rest }: RuleProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          height: 1,
          backgroundColor: strong ? theme.colors.ruleStrong : theme.colors.rule,
          marginLeft: inset,
        },
        style,
      ]}
      {...rest}
    />
  );
}
