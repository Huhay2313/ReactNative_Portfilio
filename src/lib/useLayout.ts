/**
 * Responsive helpers.
 *
 * The app is designed at 360pt first and allowed to grow. These helpers give
 * every screen the same answers to the same questions, so breakpoints cannot
 * disagree between screens.
 */

import { useWindowDimensions } from 'react-native';

import { breakpoints, gutter } from '@/theme/tokens';

export interface Layout {
  width: number;
  height: number;
  /** True below the medium breakpoint: a single column, tighter gutter. */
  isCompact: boolean;
  /** True at or above the expanded breakpoint: room for two columns. */
  isExpanded: boolean;
  /** The horizontal padding a screen should use. */
  gutter: number;
  /** How many columns a card grid should use. */
  columns: number;
}

export function useLayout(): Layout {
  const { width, height } = useWindowDimensions();

  const isCompact = width < breakpoints.medium;
  const isExpanded = width >= breakpoints.expanded;

  return {
    width,
    height,
    isCompact,
    isExpanded,
    // A tablet gets a wider gutter so the content does not run to the edge.
    gutter: isCompact ? gutter : gutter + 12,
    columns: isExpanded ? 2 : 1,
  };
}
