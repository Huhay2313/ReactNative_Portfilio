/**
 * Facts about React Native shown as informational cards on the Home dashboard.
 *
 * Static reference content, not user data. Each entry is a verifiable fact.
 */

import type { Ionicons } from '@expo/vector-icons';

export interface ReactNativeFact {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

export const REACT_NATIVE_FACTS: ReactNativeFact[] = [
  {
    id: 'native-views',
    icon: 'phone-portrait-outline',
    title: 'Real native views',
    body: 'React Native renders actual iOS and Android UI components, not a web page inside an app.',
  },
  {
    id: 'one-codebase',
    icon: 'git-compare-outline',
    title: 'One codebase, two platforms',
    body: 'The same JavaScript and TypeScript code builds the iOS and Android versions of an app.',
  },
  {
    id: 'origin',
    icon: 'logo-react',
    title: 'Made at Facebook',
    body: 'It was created at Facebook, now Meta, and released as open source in 2015.',
  },
  {
    id: 'fast-refresh',
    icon: 'flash-outline',
    title: 'Fast Refresh',
    body: 'Edits appear on the device within moments, and most of the time the screen keeps its state.',
  },
  {
    id: 'hermes',
    icon: 'speedometer-outline',
    title: 'Hermes engine',
    body: 'Hermes is the default JavaScript engine, built to start apps quickly and use less memory.',
  },
  {
    id: 'new-architecture',
    icon: 'construct-outline',
    title: 'New Architecture',
    body: 'Since version 0.76 the New Architecture is on by default, replacing the old asynchronous bridge.',
  },
];
