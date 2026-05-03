# Lakshya — Import Screen Design Specification

**Issue:** [LLM-128](/LLM/issues/LLM-128)
**Parent:** [LLM-126](/LLM/issues/LLM-126)
**Created:** 2026-04-24
**Status:** Ready for Engineering Handoff

---

## Overview

The Import Screen allows users to upload their study schedule as a JSON file. It provides clear affordances for file selection, drag-and-drop, schema documentation, and error feedback.

**Key user flows:**
1. First-time setup → Download schema → Download sample → Fill in → Upload
2. Returning user → Replace existing schedule → Upload new file
3. Error recovery → View specific errors → Fix and re-upload

---

## Design Tokens (extends existing system)

All tokens extend the base design system. Only new tokens defined here.

### Upload Zone Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `upload-border-idle` | `#E5E7EB` | `#3A3C3F` | Dashed border, idle state |
| `upload-border-drag` | `#2AABFF` | `#2AABFF` | Dashed border, dragging over |
| `upload-bg-idle` | `#F7F8FA` | `#2C2E31` | Drop zone background |
| `upload-bg-drag` | `#EBF5FF` | `#1A2F3D` | Drop zone background, dragging |
| `upload-border-error` | `#FF3B30` | `#FF453A` | Validation error state |
| `upload-border-success` | `#34C759` | `#30D158` | Upload success state |

### Typography Additions

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-xs` | 12px | 400 | Helper text, file size labels |
| `text-sm` | 14px | 500 | Button labels, link text |
| `text-lg` | 18px | 600 | Section headings |

---

## Screen Layout

### Page Structure

```
┌─────────────────────────────────────┐
│  ← Back                    Settings │
├─────────────────────────────────────┤
│                                     │
│  Import Your Study Schedule         │
│  Upload a JSON file to set up       │
│  your personalized study plan.      │
│                                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │    📄                        │   │
│  │    Drop your JSON file here  │   │
│  │    or tap to browse          │   │
│  │                             │   │
│  │    Max size: 5MB            │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  📋 Download Schema    →            │
│  📝 Download Sample    →            │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │   Import Schedule           │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Responsive Strategy

| Breakpoint | Layout |
|------------|--------|
| `< 640px` (mobile) | Single column, full-width drop zone |
| `≥ 640px` (tablet/desktop) | Centered container max-width 480px |

---

## Component Specifications

### 1. Drop Zone

**Dimensions:**
- Width: 100% of container
- Height: 200px (desktop), 180px (mobile)
- Border: 2px dashed
- Border-radius: `radius-lg` (16px)
- Padding: `space-6` (24px)

**States:**

#### Idle State
```
┌─────────────────────────────────────┐
│                                     │
│              📄                     │
│                                     │
│   Drop your JSON file here          │
│   or tap to browse                  │
│                                     │
│   Max size: 5MB · JSON only         │
└─────────────────────────────────────┘
```

- Border: 2px dashed `upload-border-idle`
- Background: `upload-bg-idle`
- Icon: File outline, 48px, `text-muted`
- Title: `text-base`, `text-primary`, centered
- Subtitle: `text-sm`, `text-muted`, centered
- Footer: `text-xs`, `text-muted`, centered

#### Drag Over State
```
┌─────────────────────────────────────┐
│                                     │
│              📥                     │
│                                     │
│     Release to upload file         │
│                                     │
│   Drop your JSON file here          │
└─────────────────────────────────────┘
```

- Border: 2px dashed `upload-border-drag`
- Background: `upload-bg-drag`
- Icon: Download arrow, 48px, `accent-primary`
- Title: `text-base`, `accent-primary`, centered

#### File Selected State
```
┌─────────────────────────────────────┐
│ ✓                                   │
│  my_schedule.json                   │
│  24.5 KB · 2 hours ago             │
│                                     │
│  [ ✕ Remove ]                       │
└─────────────────────────────────────┘
```

- Border: 2px solid `upload-border-success`
- Background: `upload-bg-idle`
- Checkmark icon: `accent-success`, 24px
- Filename: `text-base`, `text-primary`, font-medium
- File info: `text-sm`, `text-muted`
- Remove button: `text-sm`, `accent-danger`, right-aligned

#### Error State
```
┌─────────────────────────────────────┐
│ ✕                                   │
│  Invalid file type                  │
│                                     │
│  Please upload a .json file         │
└─────────────────────────────────────┘
```

- Border: 2px solid `upload-border-error`
- Background: light pink tint (`#FFF5F5` light / `#3D1F1F` dark)
- Icon: Warning triangle, 48px, `accent-danger`
- Title: `text-base`, `accent-danger`, centered
- Subtitle: `text-sm`, `text-secondary`, centered

**Accessibility:**
- Role: `button` when idle, `aria-disabled` when disabled
- Keyboard: Enter/Space to open file picker
- Screen reader: Announces file type requirements, drag/drop instructions
- Focus: 2px `accent-primary` outline on focus

---

### 2. Download Buttons

Two text buttons aligned vertically, full-width on mobile.

```
┌─────────────────────────────────────┐
│  📋  Download Schema           →   │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  📝  Download Sample           →   │
└─────────────────────────────────────┘
```

**Specifications:**
- Height: 48px
- Padding: `space-4` horizontal, `space-3` vertical
- Border: 1px solid `border`
- Border-radius: `radius-md` (12px)
- Background: `bg-secondary`
- Icon: 20px, left-aligned
- Text: `text-sm`, `text-primary`
- Arrow: 20px chevron right, `text-muted`
- Touch target: Full button area ≥ 44px height

**States:**
- Hover: Background `bg-tertiary`
- Active: `box-shadow: inset 0 1px 2px rgba(0,0,0,0.1)`
- Focus: 2px `accent-primary` outline
- Disabled: 50% opacity, `cursor: not-allowed`

**Accessibility:**
- `aria-label`: "Download schema JSON template" / "Download sample schedule"
- Keyboard: Full tab navigation

---

### 3. Import Button

Primary action button at bottom.

```
┌─────────────────────────────────────┐
│         Import Schedule              │
└─────────────────────────────────────┘
```

**Specifications:**
- Height: 48px
- Border-radius: `radius-md` (12px)
- Background: `accent-primary`
- Text: `text-base`, `font-semibold`, white
- Full width on mobile

**States:**

| State | Appearance |
|-------|------------|
| Default | Blue background |
| Hover | Darker blue (10% darker) |
| Active | Even darker + pressed shadow |
| Disabled | 50% opacity |
| Loading | Spinner + "Importing..." |

**Accessibility:**
- `aria-label`: "Import schedule"
- Loading: `aria-busy="true"`, "Importing schedule, please wait"
- Disabled: Cannot submit without valid file

---

### 4. Validation Error List

Displayed inline below drop zone when JSON validation fails.

```
┌─────────────────────────────────────┐
│ ⚠  2 errors found                  │
│                                     │
│ • Line 5: Missing required field    │
│   "subject" in task object         │
│                                     │
│ • Line 12: Invalid date format      │
│   Expected YYYY-MM-DD              │
│                                     │
│        [ Download corrected file ]  │
└─────────────────────────────────────┘
```

**Specifications:**
- Background: light yellow tint (`#FFFBEB` light / `#3D2F1A` dark)
- Border: 1px solid `accent-warning`
- Border-radius: `radius-md` (12px)
- Padding: `space-4`
- Error title: `text-sm`, `font-semibold`, `accent-warning`
- Error list: `text-sm`, `text-primary`
- Error line reference: `text-xs`, `text-muted`, code style
- Action button: Secondary style, full width

---

### 5. Success State

Displayed after successful import.

```
┌─────────────────────────────────────┐
│ ✓                                   │
│                                     │
│  Schedule imported successfully!    │
│                                     │
│  47 tasks loaded from              │
│  my_schedule.json                   │
│                                     │
│  [ View Dashboard ]                 │
│  [ Import Another ]                 │
└─────────────────────────────────────┘
```

**Specifications:**
- Background: light green tint (`#F0FDF4` light / `#1A3D1F` dark)
- Border: 1px solid `accent-success`
- Border-radius: `radius-lg` (16px)
- Checkmark: 48px, `accent-success`
- Title: `text-lg`, `text-primary`, font-semibold
- Summary: `text-sm`, `text-secondary`
- Buttons: Stacked, primary + secondary

---

## Page States

### Empty State (no file selected)
- Drop zone in idle state
- Import button disabled
- Both download buttons visible

### File Ready State
- Drop zone shows file info
- Import button enabled
- Both download buttons visible

### Uploading State
- Drop zone shows loading indicator
- Import button shows spinner
- Download buttons disabled

### Error State
- Drop zone shows specific error
- Error list appears below if JSON validation errors
- Import button disabled
- Shows "Download corrected file" action

### Success State
- Full-page success card
- Two action buttons: dashboard + import another

---

## Interaction Flows

### Upload Flow

1. User taps drop zone or drags file
2. File validation (type + size) runs client-side
3. If invalid: show error state with specific message
4. If valid: show file info in drop zone
5. User taps "Import Schedule"
6. Show loading state
7. API call to validate + import
8. If server error: show error with details
9. If success: show success state with summary

### Schema Download Flow

1. User taps "Download Schema"
2. Browser downloads `schedule-schema.json`
3. File contains:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["schedule", "metadata"],
  "properties": {
    "schedule": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "subject", "topic", "targetDate", "priority"],
        "properties": {
          "id": { "type": "string" },
          "subject": { "type": "string" },
          "topic": { "type": "string" },
          "targetDate": { "type": "string", "format": "date" },
          "priority": { "type": "string", "enum": ["high", "medium", "low"] },
          "estimatedHours": { "type": "number" },
          "completed": { "type": "boolean" }
        }
      }
    },
    "metadata": {
      "type": "object",
      "required": ["examName", "examDate", "createdAt"],
      "properties": {
        "examName": { "type": "string" },
        "examDate": { "type": "string", "format": "date" },
        "createdAt": { "type": "string", "format": "date-time" },
        "version": { "type": "string" }
      }
    }
  }
}
```

### Sample Download Flow

1. User taps "Download Sample"
2. Browser downloads `sample-schedule.json`
3. Contains realistic example with 5-10 tasks

---

## Navigation

**Entry point:** Settings screen → "Study schedule" section → "Import Schedule" button

**Exit points:**
- Back arrow → Settings
- Success → Dashboard
- Success → Import Another (resets to empty state)

---

## Accessibility Checklist

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | All text meets WCAG AA (4.5:1) |
| Touch targets | All buttons ≥ 44x44px |
| Keyboard nav | Full tab order, Enter/Space activation |
| Focus indicators | 2px `accent-primary` outline |
| Screen reader | ARIA labels, live regions for state changes |
| Error announcements | `aria-live="polite"` for error messages |
| Reduced motion | Respect `prefers-reduced-motion` |

---

## Implementation Notes

### File Validation Rules

1. **Extension**: Must be `.json`
2. **Size**: Max 5MB
3. **Content**: Valid JSON parseable
4. **Structure**: Must match schema (server-side)

### Error Message Mapping

| Client Error | Message |
|--------------|---------|
| No file | "Please select a file to upload" |
| Wrong extension | "Invalid file type. Please upload a .json file" |
| File too large | "File too large. Maximum size is 5MB" |
| Invalid JSON | "File is not valid JSON. Please check the syntax" |

| Server Error | Display |
|--------------|---------|
| Missing fields | Line-specific validation errors |
| Invalid dates | Format expected + example |
| Schema mismatch | List of missing/extra fields |

---

## File Locations

- Design spec: `design/import-screen.md`
- Tokens: `design/tokens.json` (to be updated)
- Components: `components/import/` directory
- Page: `app/import/page.tsx`

---

**Designer sign-off:** Ready for engineering handoff
**Date:** 2026-04-24

---

## Implementation Status (2026-04-24)

### ✅ Completed
- Import page: `app/import/page.tsx` — fully designed, implements all states
- FileUpload component: `components/FileUpload.tsx` — drag-drop zone with validation
- Schema endpoint: `app/api/schedules/schema/route.ts`
- Sample endpoint: `app/api/schedules/sample/route.ts`
- Design tokens: Upload zone styles added to `globals.css`

### ⚠️ Engineering Needed
- **Import API route missing**: `app/api/schedules/import/route.ts` — must create POST endpoint that:
  - Accepts JSON body matching `ImportScheduleSchema` from `lib/api/schedules/schemas.ts`
  - Validates with Zod
  - Calls `importSchedule()` from `lib/api/schedules/ingest.ts`
  - Returns `{ success, taskCount, message }` or `{ success: false, error, details }`

### Schema Reference
The import uses the timetable model with these fields:
```json
{
  "title": "NEET PG 2026 Study Plan",
  "description": "6-month comprehensive preparation",
  "targetDate": "2026-10-26T00:00:00.000Z",
  "cycleLengthDays": 7,
  "timetable": [
    {
      "dayNumber": 1,
      "dayName": "Monday",
      "slots": [
        { "subject": "Anatomy", "startTime": "09:00", "endTime": "11:00", "topic": "Upper Limb" }
      ]
    }
  ]
}
```