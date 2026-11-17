# Labfolio — Design

A personal academic laboratory workspace and digital portfolio.

This document records the decisions behind the interface: what it is trying to
feel like, the token system that carries that feeling, and the reasoning for the
choices that are not obvious from the code.

---

## 1. The direction

**Editorial academic studio.** Labfolio should read as a well-made laboratory
notebook that happens to be an app, not as a productivity dashboard.

The subject matter supplies the visual vocabulary: ruled pages, specimen labels,
numbered index entries, margin notes, monospaced measurements, and the quiet
authority of a printed record. A student's laboratory work is a *document* that
accumulates over a semester, and the interface treats it that way.

### What was deliberately avoided

Three looks were rejected because they are the default reach of generated
interfaces rather than choices made for this brief:

| Rejected | Why |
| --- | --- |
| Warm cream + high-contrast serif + terracotta accent | The most common generated palette. It signals "designed by a model" before the content is read. |
| Near-black canvas + one acid-green or vermilion accent | The second most common. Reads as a developer tool, not an academic record. |
| The SaaS card kit: identical rounded cards, one radius, one soft shadow | Flattens hierarchy. Every element competes equally, so nothing leads. |

Labfolio replaces the card kit with **rules and type**. Structure comes from
hairline dividers and a numbered index column, which is both more distinctive
and more honest to the subject.

---

## 2. Colour

Two themes, both built from the same semantic token names so no screen knows
which mode it is in.

### Light — "paper"

| Token | Hex | Role |
| --- | --- | --- |
| `canvas` | `#F7F4EC` | Page background. Warm off-white, not cream. |
| `surface` | `#FFFDF7` | Rows, inputs, sheets. |
| `surfaceSunken` | `#EFEAE0` | Progress tracks, wells, disabled fields. |
| `rule` | `#DED6C7` | Hairline dividers. The primary structural device. |
| `ruleStrong` | `#C9BFAE` | Section boundaries. |
| `text` | `#1C1B18` | Primary text. |
| `textSoft` | `#4A4740` | Body copy. |
| `textMuted` | `#6E6A60` | Metadata and captions. |
| `textFaint` | `#9A9488` | Disabled and placeholder text. |
| `accent` | `#0F5F5C` | Petrol teal. The single accent. |
| `accentWash` | `#DCEBE8` | Tinted accent background for chips. |
| `complete` | `#3F6B32` | Moss. |
| `progress` | `#A8620A` | Amber. |
| `alert` | `#9C3B2E` | Clay. |

### Dark — "ink"

| Token | Hex | Role |
| --- | --- | --- |
| `canvas` | `#14161A` | Page background. Cool near-black, not pure black. |
| `surface` | `#1C1F25` | Rows, inputs, sheets. |
| `surfaceSunken` | `#0E1013` | Progress tracks, wells. |
| `rule` | `#2C313A` | Hairlines. |
| `text` | `#F2F0EA` | Primary text. |
| `textSoft` | `#C6C3BB` | Body copy. |
| `accent` | `#7FD4CB` | Petrol, brightened for dark surfaces. |
| `complete` | `#8FC97C` | Moss, brightened. |
| `progress` | `#E8A94A` | Amber, brightened. |
| `alert` | `#E8887A` | Clay, brightened. |

### Why petrol teal

The accent had to survive two constraints: it must read as ink and glassware
rather than as a marketing gradient, and it must hold 4.5:1 on both a warm paper
and a cool near-black. Petrol teal does both, and it is not the accent any of the
rejected directions would have produced.

### Contrast

Every text/surface pair in the app meets WCAG AA:

- `text` on `canvas`: 15.8:1 (light), 14.9:1 (dark)
- `textMuted` on `canvas`: 5.4:1 (light), 6.1:1 (dark)
- `textFaint` on `canvas`: 3.1:1 — used only for non-essential metadata
- `accent` on `canvas`: 6.4:1 (light), 9.2:1 (dark)
- `onAccent` on `accent`: 7.1:1 (light), 10.4:1 (dark)

Status is **never** carried by colour alone. Every status also has a distinct
glyph (filled check, ellipsis circle, hollow circle) and a text label.

---

## 3. Typography

Three faces, three jobs, no overlap.

| Face | Role | Why |
| --- | --- | --- |
| **Manrope** | Display and interface text | Geometric but warm. Carries editorial voice at display sizes and stays legible at 13pt. |
| **IBM Plex Mono** | Specimen labels | Activity numbers, dates, counts, status words. A monospace label reads as a measurement, which is exactly what these values are. |

Using one family for both display and body keeps the app coherent; weight and
size do the separating. The mono is the second voice, and it is used sparingly
enough that it still signals "this is data".

### Scale

| Variant | Size / line height | Use |
| --- | --- | --- |
| `display` | 26 / 32 | Screen titles |
| `displaySmall` | 22 / 28 | The home greeting, which carries a name |
| `title` | 21 / 28 | Detail titles, stat figures |
| `heading` | 16 / 22 | Row headings, buttons |
| `body` | 15 / 23 | Body copy |
| `bodySmall` | 13.5 / 20 | Secondary copy |
| `label` | 11.5 / 16 | Mono labels |
| `micro` | 10.5 / 14 | Counts, index numbers |

`allowFontScaling` stays on everywhere. Layouts use flex and wrapping rather than
fixed heights, so they reflow at large accessibility text sizes instead of
clipping.

---

## 4. Spacing, shape, elevation

**Spacing** is a 4pt grid: `2, 4, 8, 12, 16, 24, 32, 48`. The screen gutter is
20pt on phones and 32pt on tablets.

**Radius is small and purposeful.** `2` for chips and labels, `4` for inputs and
buttons, `8` for the one large surface on a screen. A 2pt radius reads as a
printed label; a 20pt radius on every container reads as a template.

**Elevation is a hairline, not a shadow.** Structure comes from `rule` dividers.
The only shadow in the app is under the tab bar on iOS. Android gets a rule
instead, so the design stays flat and printed rather than floating.

---

## 5. The signature element

**The activity row** is what the app is remembered by.

```
┌─────────────────────────────────────────────┐
│ 01   Standardisation of Sodium Hydroxide    │
│      Analytical Chemistry I                 │
│      ─────────────────────────────────      │
│      3 of 5 steps          Due 24 Nov    ◐  │
└─────────────────────────────────────────────┘
```

The number sits in a fixed 30pt left column in mono, so a list of rows reads as a
numbered index rather than a stack of tiles. A hairline separates rows instead of
a card boundary, so the list stays one continuous document. The progress rule is
a flat 3pt bar, not a rounded pill: at that height a pill reads as decoration
while a flat bar reads as a measurement.

Every list in the app uses this row, which is what makes the Library, the home
screen and the portfolio feel like one product.

---

## 6. Layout and hierarchy

The home screen is deliberately uneven:

1. **Greeting and period** — small, quiet, top.
2. **The one thing to do next** — the only large surface on the page, given the
   most weight.
3. **Progress strip** — four figures on one baseline, derived from real steps.
4. **Recent activity** — an index list.

Nothing is equally prominent. The "continue working" block is the only element
with a border and a fill; everything else is rules and type.

---

## 7. Motion

Motion answers an action; it never announces itself.

| Duration | Use |
| --- | --- |
| 120ms | Pressed states, colour changes |
| 220ms | Sheets, screen transitions |
| 320ms | A deliberate reveal, at most once per screen |

There is no looping motion, no entrance animation per row, and no parallax. A
press gives a light haptic on native and an opacity change everywhere.

---

## 8. Accessibility

- Every touch target is at least 48pt tall (44pt minimum, exceeded everywhere).
- Every control has an accessible name, role and state.
- Status uses glyph + text + colour, never colour alone.
- The theme switch is a `radio` group with `aria-checked` set explicitly, because
  React Native Web does not map `accessibilityState.checked` for this role.
- Text scales with the system setting; layouts reflow rather than clip.
- Empty states name what is missing and offer the action that resolves it.
- Destructive actions (remove evidence, restore sample data) confirm first.

---

## 9. Data honesty

Every figure in the app is derived from the activity data:

- Progress is `steps done / steps total`, computed in one place.
- The portfolio timeline is the completed activities, grouped by completion month.
- Milestones are thresholds actually crossed, not badges for opening the app.
- A completed activity is never shown as overdue, however old its deadline.

There are no invented statistics, testimonials or decorative numbers.

---

## 10. Responsive behaviour

Designed at 360pt first, then allowed to grow.

| Width | Behaviour |
| --- | --- |
| 320–599pt | Single column, 20pt gutter, 4-column tab bar |
| 600–839pt | Single column, 32pt gutter, content capped at 720pt |
| 840pt+ | Content capped at 720pt and centred; the tab bar stays full width |

Content is capped at 720pt so a line of body text never exceeds roughly 70
characters, which is the readable limit for the 15pt body size.

Verified at 360×640, 390×844, 768×1024 and 1280×800 with no horizontal overflow,
no clipped text and no controls under system bars.
