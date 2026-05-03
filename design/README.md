# Lakshya Dashboard v1 — Design System

## Overview

Mobile-first design system for Lakshya, a NEET PG study tracker built as a Telegram WebApp Mini App. Optimized for touch, quick glances, and exam-prep focus.

---

## Design Principles

1. **Clarity at a glance** — Primary info visible without scrolling
2. **Touch-first** — All targets ≥ 44px, generous spacing
3. **Calm focus** — Minimal visual noise, no decorative clutter
4. **Consistent rhythm** — 4px base unit, 8px spacing scale

---

## Color Palette

### Light Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#FFFFFF` | Main background |
| `bg-secondary` | `#F7F8FA` | Card backgrounds |
| `bg-tertiary` | `#EBEDF0` | Subtle dividers |
| `text-primary` | `#1C1E21` | Headings, primary text |
| `text-secondary` | `#5C636E` | Secondary labels |
| `text-muted` | `#8B929A` | Timestamps, hints |
| `accent-primary` | `#2AABFF` | CTAs, links (Telegram blue) |
| `accent-success` | `#34C759` | Completed, on-track |
| `accent-warning` | `#FF9500` | Behind schedule |
| `accent-danger` | `#FF3B30` | Overdue, errors |
| `border` | `#E5E7EB` | Subtle borders |

### Dark Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#1C1E21` | Main background |
| `bg-secondary` | `#2C2E31` | Card backgrounds |
| `bg-tertiary` | `#3A3C3F` | Subtle dividers |
| `text-primary` | `#FFFFFF` | Headings, primary text |
| `text-secondary` | `#A1A1A6` | Secondary labels |
| `text-muted` | `#636366` | Timestamps, hints |
| `accent-primary` | `#2AABFF` | CTAs, links |
| `accent-success` | `#30D158` | Completed, on-track |
| `accent-warning` | `#FF9F0A` | Behind schedule |
| `accent-danger` | `#FF453A` | Overdue, errors |
| `border` | `#3A3C3F` | Subtle borders |

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Scale (Tailwind classes)

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-xs` | 12px | 400 | 16px | Timestamps, hints |
| `text-sm` | 14px | 400 | 20px | Secondary labels, metadata |
| `text-base` | 16px | 400 | 24px | Body text |
| `text-lg` | 18px | 600 | 26px | Section headings |
| `text-xl` | 20px | 700 | 28px | Page titles |
| `text-2xl` | 24px | 700 | 32px | Hero numbers (days left) |
| `text-4xl` | 36px | 700 | 40px | Large stats (exam countdown) |

---

## Spacing Scale (4px base)

| Token | Value | Common Uses |
|-------|-------|-------------|
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Icon padding |
| `space-3` | 12px | Input padding |
| `space-4` | 16px | Card padding, section gaps |
| `space-5` | 20px | Large card padding |
| `space-6` | 24px | Page margins |
| `space-8` | 32px | Section separators |
| `space-10` | 40px | Major section breaks |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 8px | Chips, small buttons |
| `radius-md` | 12px | Cards, inputs |
| `radius-lg` | 16px | Modals, large cards |
| `radius-full` | 9999px | Pills, circular buttons |

---

## Shadows

```css
/* Card shadow — light mode */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

/* Elevated shadow — modals, dropdowns */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);

/* Pressed state */
box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
```

---

## Components

### 1. Navigation Bar (Bottom)

Fixed bottom nav, 56px height, Telegram WebApp safe area padding.

```
┌─────────────────────────────────────┐
│  🏠 Home  │  ✅ Tasks  │  📝 Notes  │  ⚙️ Settings │
└─────────────────────────────────────┘
```

- Active state: accent-primary icon + text
- Inactive: text-muted icon + text
- Touch target: 44px min per tab

### 2. Progress Card

Shows daily study progress.

```
┌─────────────────────────────────────┐
│ Today's Progress                    │
│ ━━━━━━━━━━━━━━━━░░░░░░░  75%       │
│ 6/8 topics completed               │
│                                     │
│ [Mark Complete ✓]                   │
└─────────────────────────────────────┘
```

### 3. Exam Countdown Card

Hero element at top of dashboard.

```
┌─────────────────────────────────────┐
│         NEET PG 2026                 │
│                                     │
│            182                      │
│         DAYS LEFT                   │
│                                     │
│     Target: Oct 26, 2026            │
└─────────────────────────────────────┘
```

### 4. Task Item

Checklist item with completion state.

```
┌─────────────────────────────────────┐
│ ○  Anatomy - Upper Limb             │
│    Due: Today                       │
│                                     │
│ ○  Anatomy - Lower Limb             │
│    Due: Tomorrow                    │
└─────────────────────────────────────┘
```

### 5. Note Card

Simple text preview card.

```
┌─────────────────────────────────────┐
│ My notes on cardiac cycles          │
│ Last edited: 2 hours ago           │
└─────────────────────────────────────┘
```

### 6. Action Button

Primary CTA button, full-width on mobile.

```
┌─────────────────────────────────────┐
│         Add Today's Task             │
└─────────────────────────────────────┘
```

- Height: 48px
- Border-radius: 12px
- Font: text-base, font-semibold

### 7. Input Field

Text input with label.

```
┌─────────────────────────────────────┐
│ Subject                             │
│ ┌─────────────────────────────────┐ │
│ │ Enter subject name...           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

- Height: 48px
- Border: 1px solid border color
- Focus: 2px accent-primary outline

### 8. Toggle Switch

For settings (dark mode, notifications).

```
Label text                    [===●]
```

---

## Screen Inventory

### Dashboard (Home) — `app/page.tsx`

1. Exam countdown hero card
2. Today's progress card
3. Today's tasks list (top 3)
4. Quick-add task FAB
5. Bottom navigation

### Tasks View — `app/tasks/page.tsx`

1. Filter tabs: All | Today | Upcoming | Overdue
2. Task list grouped by date
3. Swipe to complete
4. Add task button
5. Bottom navigation

### Notes View — `app/notes/page.tsx`

1. Search bar
2. Notes list (title + preview)
3. Sort options (recent, alphabetical)
4. Bottom navigation

### Reminders View — `app/reminders/page.tsx`

1. Upcoming reminders list
2. Add reminder FAB
3. Toggle reminders on/off per topic
4. Bottom navigation

### Settings — `app/settings/page.tsx`

1. Profile section (exam name, target date)
2. Appearance (dark mode toggle)
3. Notifications toggle
4. Study schedule JSON upload
5. Data export
6. About / Help

---

## States

### Empty States

| Screen | Message |
|--------|---------|
| No tasks | "No tasks yet. Add your first study topic to get started." |
| No notes | "Your notes will appear here. Start writing to see them." |
| No reminders | "Set reminders to stay on track. Tap + to create one." |

### Loading States

- Skeleton loaders matching card dimensions
- Subtle pulse animation (0.5s ease-in-out infinite)

### Error States

- Inline error: red text below field
- Toast notifications for async errors
- Retry button where applicable

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | All text meets WCAG AA (4.5:1 minimum) |
| Touch targets | All interactive elements ≥ 44x44px |
| Focus states | Visible 2px outline on keyboard nav |
| Screen readers | Semantic HTML, ARIA labels on icons |
| Reduced motion | Respect `prefers-reduced-motion` |

---

## Telegram WebApp Integration

```tsx
// Theme adaptation
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Colors from Telegram
const theme = {
  bg_color: tg.themeParams.bg_color,
  text_color: tg.themeParams.text_color,
  button_color: tg.themeParams.button_color,
};
```

---

## File Structure

```
design/
├── README.md              # This file
├── tokens.json            # Design tokens (exportable)
├── mockups/
│   ├── dashboard.png
│   ├── tasks.png
│   ├── notes.png
│   ├── reminders.png
│   └── settings.png
└── figma/                 # Figma source (if used)
    └── Lakshya_v1.fig
```

---

## Implementation Notes for Engineer

1. Use Tailwind CSS with these custom tokens in `tailwind.config.ts`
2. Wrap with `TelegramProvider` for WebApp theme integration
3. Implement CSS variables for theme switching
4. All spacing uses 4px multiples
5. Mobile-first breakpoints: base (default), sm:640px, md:768px

---

*Last updated: 2026-04-24*