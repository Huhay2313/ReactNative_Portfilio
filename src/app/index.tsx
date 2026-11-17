/**
 * The root route.
 *
 * All navigation happens inside AppShell, so this file exists only to give the
 * router a route to match at "/".
 */

import { AppShell } from '@/screens/AppShell';

export default function Index() {
  return <AppShell />;
}
