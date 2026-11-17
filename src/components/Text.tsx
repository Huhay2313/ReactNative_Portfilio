/**
 * Text: the single typographic entry point.
 *
 * Every piece of text in the app goes through this component so the type scale
 * and the theme colours can never be bypassed. A screen that needs a new size
 * adds a variant here rather than passing a raw fontSize.
 */

import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';

export type TextVariant =
  | 'display'
  | 'displaySmall'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'micro';

export type TextTone = 'default' | 'soft' | 'muted' | 'faint' | 'accent' | 'complete' | 'progress' | 'alert' | 'onAccent';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  /** Uppercase with tracking. Used for specimen-style labels only. */
  tracked?: boolean;
}

export function Text({
  variant = 'body',
  tone = 'default',
  tracked = false,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const scale = theme.typeScale[variant];

  const toneColor: Record<TextTone, string> = {
    default: theme.colors.text,
    soft: theme.colors.textSoft,
    muted: theme.colors.textMuted,
    faint: theme.colors.textFaint,
    accent: theme.colors.accentText,
    complete: theme.colors.complete,
    progress: theme.colors.progress,
    alert: theme.colors.alert,
    onAccent: theme.colors.onAccent,
  };

  return (
    <RNText
      style={[
        {
          fontFamily: scale.family,
          fontSize: scale.size,
          lineHeight: scale.lineHeight,
          color: toneColor[tone],
        },
        tracked && { letterSpacing: 1.2, textTransform: 'uppercase' as const },
        style,
      ]}
      {...rest}
    />
  );
}
