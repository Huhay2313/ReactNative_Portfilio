# Labfolio

A personal academic laboratory workspace and digital portfolio, built with
React Native and Expo.

Labfolio keeps a semester of laboratory work in one place: the activities
themselves, the steps inside them, the evidence produced, and a portfolio view of
what has actually been finished. It is designed as an editorial laboratory
notebook rather than a productivity dashboard.

---

## Running it

```bash
npm install
npx expo start
```

Then press `w` for web, `a` for Android, or `i` for iOS. The app also runs in
Expo Go.

To run on a specific platform directly:

```bash
npx expo start --web
npx expo start --android
npx expo start --ios
```

### Checks

```bash
npx tsc --noEmit     # typecheck
npx expo lint        # lint
```

---

## What is in it

Five screens, four tabs plus a drill-down.

| Screen | What it does |
| --- | --- |
| **Home** | Greeting, academic period, the one activity to continue, a progress strip derived from real step counts, and recent activity. |
| **Library** | All activities with live search, category filters with counts, and an empty state that offers a way out. |
| **Activity detail** | Objectives, requirements, procedure, an interactive checklist, evidence attachment, and the activity record. |
| **Portfolio** | Completed work grouped by month on a timeline, milestone thresholds actually crossed, and figures derived from the same step data. |
| **Settings** | Display name editing, light/dark/system appearance, storage figures, restore-sample-data, and app information. |

### Interactions that actually work

- Tapping a checklist step updates progress everywhere: home, library, portfolio.
- Completing the last step stamps the completion date and moves the activity into
  the portfolio timeline.
- Un-checking a step after completion clears the date again.
- Search filters as you type across title, course, category and summary.
- Category chips filter with live counts.
- Adding evidence writes to storage and appears immediately.
- Removing evidence confirms first.
- Switching theme repaints every screen, the tab bar and the status bar, and
  persists across a restart.
- Restoring sample data confirms first.

---

## Architecture

```
src/
├── app/
│   ├── _layout.tsx        Providers, font loading, status bar
│   └── index.tsx          The root route
├── screens/
│   ├── AppShell.tsx       Tab state and detail routing
│   ├── HomeScreen.tsx
│   ├── LibraryScreen.tsx
│   ├── ActivityDetailScreen.tsx
│   ├── PortfolioScreen.tsx
│   └── SettingsScreen.tsx
├── components/
│   ├── Text.tsx           The single typographic entry point
│   ├── Screen.tsx         Safe areas, gutters, max width, title block
│   ├── Rule.tsx           Hairline divider
│   ├── ActivityRow.tsx    The signature index row
│   ├── Button.tsx         Three variants, 48pt minimum
│   ├── Chip.tsx           Filter chips
│   ├── ProgressRule.tsx   Flat progress bar
│   ├── StatusMark.tsx     Glyph + label + colour
│   ├── SectionHeader.tsx  Ruled section title
│   ├── StatBlock.tsx      Figure with label
│   ├── EmptyState.tsx     Empty, with a way out
│   └── TabBar.tsx         Custom ruled tab bar
├── data/
│   ├── types.ts           Domain model
│   ├── sampleActivities.ts  Twelve realistic activities
│   └── ActivityContext.tsx  State, persistence, derived progress
├── theme/
│   ├── tokens.ts          Colour, type, spacing, radius, motion
│   └── ThemeContext.tsx   Appearance, persisted
└── lib/
    ├── format.ts          Dates, durations, percentages
    └── useLayout.ts       Breakpoints
```

### Decisions worth knowing

**Progress is derived, never stored.** `deriveProgress` computes status, step
counts and overdue state from the steps themselves. Storing a percentage would
let it drift out of sync with the work it describes.

**Two contexts, not one.** `ThemeContext` owns appearance; `ActivityContext` owns
data. A theme switch does not re-render the activity list, and a checklist tap
does not touch the theme.

**Screens never read raw colours.** Everything goes through `useTheme()` and the
semantic tokens, so switching modes repaints the app without a screen knowing it
happened.

**The tab bar is custom.** The default Expo tab bar is one of the fastest ways
for an app to look like a template. This one is drawn as a ruled strip with mono
labels and an accent rule above the active tab.

**Sample dates are relative.** The sample set anchors to the day it is opened, so
the demo never rots into "68 days overdue" a few weeks after it was written.

---

## Persistence

Two keys in AsyncStorage:

| Key | Contents |
| --- | --- |
| `labfolio.activities.v1` | The activity list, including steps and evidence |
| `labfolio.profile.v1` | Display name, programme, period |
| `labfolio.theme.mode` | `light`, `dark` or `system` |

A failed read falls back to the sample data, which is a working app rather than a
crash. A failed write only means the change is not remembered next launch.

---

## Sample data

Twelve activities across six courses, deliberately uneven:

- 3 complete
- 5 in progress
- 4 not started
- 1 overdue

That spread is what makes the progress figures, the portfolio timeline and the
overdue state meaningful instead of decorative. The activities are written the way
a laboratory manual writes them: real objectives, real procedures, real
requirements.

---

## Demonstration checklist

A five-minute walkthrough that touches every requirement.

1. **Home** — note the greeting, the period, and that the "continue working"
   block is the only large surface. Read the progress strip: the figures are
   counts of real steps.
2. **Open the continue block** — the detail screen shows objectives, requirements
   and procedure.
3. **Tap a checklist step** — the progress bar moves immediately.
4. **Tap the last remaining step** — the activity completes, the status changes to
   Complete, and the completion date is stamped.
5. **Go back** — the home progress strip has already updated.
6. **Library tab** — search for "titration". Note the filtered count and the
   clear-filters action.
7. **Filter by "Report"** — one activity, and the empty state appears if you
   search for something that does not exist.
8. **Open an activity and add evidence** — type a label, tap Add, watch it appear.
9. **Remove it** — note the confirmation.
10. **Portfolio tab** — the completed activity is on the timeline under its month.
    The milestone count reflects what has actually been earned.
11. **Settings tab** — change the display name, and see it on Home.
12. **Switch to Dark** — every screen, the tab bar and the status bar repaint
    immediately.
13. **Reload the app** — the theme and the name are still set.
14. **Resize to 360pt** — no horizontal overflow, no clipped text, the tab bar
    intact.

---

## Known limits

- Data is local to the device. There is no account system or sync.
- Evidence is recorded as a labelled note; it does not yet attach a photo or file
  from the device. The data model already carries `photo` and `file` kinds, so
  adding a picker is a UI change rather than a schema change.
- The activity detail is reached from a list, not by deep link. Routes are ready
  for it (`src/app/`), but the shell currently holds the detail in state.
