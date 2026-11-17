/**
 * Starting state for a fresh install.
 *
 * The app ships with no activities and no invented profile details. Laboratory
 * activities are added later by the user, so every screen is designed to look
 * right when this list is empty and to fill in as real entries arrive.
 */

import type { Activity, Profile } from './types';

export const DEFAULT_PROFILE: Profile = {
  displayName: 'Student',
  programme: '',
  period: '',
};

export const DEFAULT_ACTIVITIES: Activity[] = [];
