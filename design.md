# MAA Enterprise — Design System

## Product Design Direction

MAA Enterprise is a premium business management dashboard for loan management, employee management, accounts, office expenses, and route calculation. The interface must feel like a carefully designed product used by a real company — clean, professional, minimal, elegant, trustworthy, modern, data-focused, and enterprise-ready.

## Design Principles

1. **Clarity over decoration** — Every element serves a purpose. No decorative-only elements.
2. **Consistency** — Same component, same appearance, everywhere.
3. **Restraint** — Minimal color palette, minimal shadows, minimal animations.
4. **Data-first** — Content and data drive the layout, not decoration.
5. **Accessibility** — WCAG 2.1 AA compliant. Keyboard navigable. Screen-reader friendly.
6. **Responsive** — Adapts gracefully from desktop to mobile.

## Color Tokens

### Primary
- **Primary 50**: `#dbeafe`
- **Primary 100**: `#dbeafe`
- **Primary 200**: `#bfdbfe`
- **Primary 300**: `#93c5fd`
- **Primary 400**: `#60a5fa`
- **Primary 500**: `#2563eb` — Main brand color
- **Primary 600**: `#1d4ed8` — Hover states
- **Primary 700**: `#1e40af` — Active states
- **Primary 800**: `#1e3a5f`
- **Primary 900**: `#172554`

### Neutral (Zinc scale)
- **Zinc 50**: `#fafafa`
- **Zinc 100**: `#f4f4f5`
- **Zinc 200**: `#e4e4e7`
- **Zinc 300**: `#d4d4d8`
- **Zinc 400**: `#a1a1aa`
- **Zinc 500**: `#71717a`
- **Zinc 600**: `#52525b` — Secondary & muted text
- **Zinc 700**: `#3f3f46`
- **Zinc 800**: `#27272a`
- **Zinc 900**: `#18181b`
- **Zinc 950**: `#09090b`

### Semantic
- **Background**: `#ffffff` (light), `#09090b` (dark)
- **Surface**: `#ffffff` (light), `#18181b` (dark)
- **Card**: `#ffffff` (light), `#27272a` (dark)
- **Border**: `#d4d4d8` (light), `#3f3f46` (dark)
- **Text Primary**: `#18181b` (light), `#fafafa` (dark)
- **Text Secondary**: `#374151` (light), `#c0c0c0` (dark)
- **Muted**: `#52525b` (light), `#8a8a8a` (dark)
- **Placeholder**: `#6b7280` (light), `#737373` (dark)
- **Disabled**: `#6b7280` (light), `#737373` (dark)

### Status Colors
- **Success**: `#15803d` (text), `#dcfce7` (bg), `#14532d` (text-dark)
- **Warning**: `#b45309` (text), `#fef3c7` (bg), `#78350f` (text-dark)
- **Error**: `#b91c1c` (text), `#fee2e2` (bg), `#7f1d1d` (text-dark)
- **Info**: `#2563eb` (text), `#dbeafe` (bg), `#1e40af` (text-dark)

### Usage Rules
- Primary (`#2563eb`) for brand actions, links, active nav items
- Success (`#15803d`) only for positive statuses
- Warning (`#b45309`) only for pending/warning statuses
- Error (`#b91c1c`) only for negative/cancelled statuses
- All status text colors meet WCAG AA 4.5:1 minimum contrast ratio
- Never use random colors. Every color must have a documented purpose.
- Never use `#a1a1aa` for readable text (fails WCAG AA at 3.1:1)
- Never use `#d4d4d8` for icons or decorative elements (fails WCAG AA)

## Typography

### Font Family
- **Sans**: `Geist`, system-ui, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif
- **Mono**: `Geist Mono`, `Consolas`, `Monaco`, monospace

### Scale
| Token | Size | Weight | Line Height | Use |
|-------|------|--------|-------------|-----|
| `display` | 2rem (32px) | 700 | 1.2 | Page title (rarely used) |
| `h1` | 1.5rem (24px) | 600 | 1.3 | Section headings |
| `h2` | 1.25rem (20px) | 600 | 1.35 | Card/subsection headings |
| `h3` | 1.125rem (18px) | 600 | 1.4 | Widget/card title |
| `body` | 0.875rem (14px) | 400 | 1.5 | Body text |
| `body-lg` | 1rem (16px) | 400 | 1.5 | Large body text |
| `small` | 0.75rem (12px) | 400 | 1.4 | Captions, labels, helper text |
| `xsmall` | 0.6875rem (11px) | 500 | 1.3 | Badges, tags, overlines |
| `nav` | 0.875rem (14px) | 500 | 1.4 | Navigation items |
| `btn` | 0.875rem (14px) | 500 | 1.4 | Button text |
| `table` | 0.8125rem (13px) | 400 | 1.4 | Table cells |
| `input` | 0.875rem (14px) | 400 | 1.4 | Form inputs |
| `label` | 0.75rem (12px) | 600 | 1.4 | Form labels |

### Letter Spacing
- Tight: `-0.025em` (headings)
- Normal: `0` (body)
- Wide: `0.025em` (labels, badges)
- Wider: `0.05em` (overline, section labels)

## Spacing

### Base Unit: 4px
- `1` = 4px
- `2` = 8px
- `3` = 12px
- `4` = 16px
- `5` = 20px
- `6` = 24px
- `8` = 32px
- `10` = 40px
- `12` = 48px
- `16` = 64px

### Usage Rules
- Sidebar padding: `6` (24px) vertical, `4` (16px) horizontal
- Card padding: `6` (24px)
- Form gap: `4` (16px) between fields, `6` (24px) between sections
- Table row padding: `3` (12px) vertical, `4` (16px) horizontal
- Page content padding: `8` (32px) on desktop, `4` (16px) on mobile
- Section gap: `8` (32px)
- Component inner gap: `3` (12px)

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `none` | 0 | None |
| `sm` | 4px | Badges, tags, small elements |
| `md` | 6px | Buttons, inputs, selects, dropdowns |
| `lg` | 8px | Cards, modals |
| `xl` | 12px | Large containers, dialogs |
| `full` | 9999px | Pills, avatars, circular elements |

### Usage Rules
- Cards: `lg` (8px)
- Buttons: `md` (6px)
- Inputs: `md` (6px)
- Dropdowns: `md` (6px)
- Modals: `xl` (12px)
- Tables: `sm` (4px) for individual cells, none for table container
- Badges: `sm` (4px)
- Avatars: `full` (9999px)
- Do not use excessive rounded corners. No 9999px on cards or buttons.

## Shadows

### Shadow Scale
| Token | Value | Use |
|-------|-------|-----|
| `none` | `none` | Default |
| `sm` | `0 1px 2px 0 rgba(0,0,0,0.05)` | Subtle card shadow |
| `md` | `0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)` | Elevated cards |
| `lg` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)` | Dropdowns, popovers |
| `xl` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)` | Modals |
| `2xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)` | Overlay backdrop |

### Usage Rules
- Cards: `none` by default, `sm` on hover
- Dropdowns: `lg`
- Modals: `xl`
- Sidebar: `none`
- Avoid heavy floating-card effects. Keep shadows restrained.
- Dark mode: shadows should be softer (reduce opacity).

## Layout System

### Sidebar
- Width: `260px` expanded, `64px` collapsed
- Position: Fixed left
- Height: Full viewport height (`100vh`)
- Background: `#ffffff` (light), `#18181b` (dark)
- Border-right: `1px solid #e4e4e7` (light), `1px solid #27272a` (dark)
- Z-index: `50`
- Padding top: `16px` (for logo area)
- Padding bottom: `16px`
- Content area starts at `260px` offset from left (expanded) or `64px` (collapsed)

### Header
- Height: `64px`
- Position: Fixed top, right of sidebar
- Width: `calc(100vw - 260px)` expanded, `calc(100vw - 64px)` collapsed
- Background: `#ffffff` (light), `#18181b` (dark)
- Border-bottom: `1px solid #e4e4e7` (light), `1px solid #27272a` (dark)
- Z-index: `40`
- Padding: `0 32px`
- Contains: page title/breadcrumb, search, notifications, user profile

### Main Content
- Margin-left: `260px` (expanded), `64px` (collapsed)
- Margin-top: `64px`
- Padding: `32px` on desktop, `16px` on tablet, `16px` on mobile
- Min-height: `calc(100vh - 64px)`
- Background: `#fafafa` (light), `#09090b` (dark)

### Responsive Breakpoints
- `sm`: `640px` — Tablet
- `md`: `768px` — Small tablet
- `lg`: `1024px` — Laptop
- `xl`: `1280px` — Desktop
- `2xl`: `1536px` — Large desktop

### Grid System
- Dashboard uses `grid` with `repeat(auto-fill, minmax(280px, 1fr))` for stat cards
- Tables use full-width with `min-width` for horizontal scroll on mobile
- Forms use `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for responsive multi-column

## Sidebar

### Structure
- Logo area at top (32px height)
- Navigation sections below
- Each section has a heading label (overline style)
- Active item has left border accent (`3px solid #3b82f6`) and primary text color
- Hover items have `#f4f4f5` background (light), `#1f1f23` background (dark)
- Collapsed state shows only icons with tooltips

### Navigation Items
| Section | Icon | Pages |
|---------|------|-------|
| Dashboard | `LayoutDashboard` | Overview |
| Loan Management | `Landmark` | Overview, Add Organization, Add Loan, Pay Loan |
| Employee Management | `Users` | Overview, Employees, Salary Distribution |
| Accounts | `Wallet` | Add Investment, Company Deposit |
| Office Expense | `FileText` | Overview, Monthly Data Entry, Settings |
| Route Calculation | `Route` | Overview, Add Route Cost, Settings |
| Reports | `BarChart3` | Report Center |
| Settings | `Settings` | Settings |

### Expand/Collapse
- Toggle button at bottom of sidebar
- Collapsed width: `64px` (icon only)
- Tooltips appear on hover when collapsed
- State persisted via `localStorage`

## Header

### Structure
- Left: Page title + breadcrumb (if applicable)
- Center: Search input (optional, contextual)
- Right: Notification bell, user avatar, settings gear, logout
- Height: `64px`
- Border-bottom: `1px solid #e4e4e7`

### User Menu
- Avatar: `36px` circular
- Dropdown: `200px` width, `8px` radius
- Options: Profile, Settings, Logout
- Logout styled as destructive action

## Navigation

### Active State
- Left border: `3px solid #3b82f6`
- Text color: `#2563eb` (primary 600)
- Background: `#eff6ff` (primary 50) (light), `#1e3a5f` (dark)
- Icon color: `#2563eb`

### Hover State
- Background: `#f4f4f5` (light), `#1f1f23` (dark)
- Text color: `#18181b` (light), `#fafafa` (dark)
- No border change

### Focus State
- Outline: `2px solid #3b82f6`, `outline-offset: -2px`
- Visible on keyboard navigation only

## Buttons

### Variants
| Variant | Background | Text | Border | Use |
|---------|-----------|------|--------|-----|
| Primary | `#2563eb` | `#ffffff` | none | Main actions |
| Secondary | `#ffffff` | `#374151` | `1px solid #d4d4d8` | Secondary actions |
| Ghost | `transparent` | `#374151` | none | Tertiary actions |
| Danger | `#dc2626` | `#ffffff` | none | Destructive actions |
| Outline | `transparent` | `#2563eb` | `1px solid #2563eb` | Outlined primary |

### Sizes
| Size | Height | Padding | Font |
|------|--------|---------|------|
| `sm` | `32px` | `8px 12px` | `small` |
| `md` | `40px` | `8px 16px` | `btn` |
| `lg` | `48px` | `16px 24px` | `btn` |

### States
- Default: as above
- Hover: opacity `0.9`, slight lift (`translateY(-1px)`)
- Active: opacity `1`, no lift (`translateY(0)`)
- Disabled: opacity `0.5`, cursor `not-allowed`, no hover effects
- Loading: spinner inside button, disabled interaction

## Inputs

### Base Style
- Height: `40px`
- Padding: `8px 12px`
- Border: `1px solid #d4d4d8`
- Border-radius: `md` (6px)
- Font: `body` (14px)
- Background: `#ffffff`
- Color: `#18181b`
- Transition: `border-color 150ms, box-shadow 150ms`

### States
- Default: `1px solid #d4d4d8`
- Focus: `1px solid #3b82f6`, `box-shadow: 0 0 0 3px rgba(59,130,246,0.1)`
- Error: `1px solid #dc2626`, `box-shadow: 0 0 0 3px rgba(220,38,38,0.1)`
- Disabled: `background: #f4f4f5`, `color: #a1a1aa`, cursor `not-allowed`
- Placeholder: `color: #a1a1aa`

### Textarea
- Height: `auto`, min-height: `80px`
- Same styling as input
- Resize: vertical only

### Helper Text
- `small` (12px), `color: #71717a`, margin-top: `4px`

### Error Text
- `small` (12px), `color: #dc2626`, margin-top: `4px`

## Selects

### Base Style
- Same as input base style
- Appearance: custom arrow (chevron-down icon)
- Padding-right: `36px` (for arrow)
- Background: `#ffffff` with custom arrow

### Dropdown
- Background: `#ffffff` (light), `#1f1f23` (dark)
- Border: `1px solid #e4e4e7` (light), `#27272a` (dark)
- Border-radius: `md` (6px)
- Shadow: `lg`
- Max-height: `240px`, overflow-y: `auto`
- Option padding: `8px 12px`
- Option hover: `#f4f4f5` (light), `#1f1f23` (dark)

## Tables

### Container
- Background: `#ffffff`
- Border: `1px solid #e4e4e7`
- Border-radius: `lg` (8px)
- Overflow: hidden
- Box-shadow: `sm`

### Header Row
- Background: `#fafafa` (light), `#1f1f23` (dark)
- Border-bottom: `1px solid #e4e4e7`
- Font: `label` (12px), `600`, `text-transform: uppercase`, `letter-spacing: 0.05em`
- Color: `#71717a`
- Padding: `12px 16px`

### Data Rows
- Border-bottom: `1px solid #f4f4f5`
- Font: `table` (13px)
- Color: `#18181b`
- Padding: `12px 16px`
- Hover: `background: #fafafa` (light), `#1f1f23` (dark)
- Last row: no border-bottom

### Toolbar
- Display: `flex`, `align-items: center`, `gap: 12px`
- Padding: `16px`
- Border-bottom: `1px solid #e4e4e7`
- Wrap on smaller screens

### Pagination
- Display: `flex`, `align-items: center`, `justify-content: space-between`
- Padding: `12px 16px`
- Border-top: `1px solid #e4e4e7`
- Page buttons: `32px` height, `8px` padding
- Active page: `#2563eb` background, white text
- Disabled: opacity `0.5`

## Cards

### Structure
- Background: `#ffffff` (light), `#1f1f23` (dark)
- Border: `1px solid #e4e4e7` (light), `#27272a` (dark)
- Border-radius: `lg` (8px)
- Shadow: `none` by default, `sm` on hover
- Padding: `24px`
- No excessive padding

### Stat Card
- Grid layout with icon + value + label
- Icon: `40px`, `8px` radius, `primary-50` background
- Value: `h1` (24px), `700` weight
- Label: `small` (12px), `#71717a`
- Trend indicator: `small`, colored (green for up, red for down)

### Chart Card
- Header: title + optional actions
- Body: chart area with padding
- Footer: optional summary text

### Empty State Card
- Centered content
- Icon: `48px`, `#d4d4d8` color
- Title: `h3` (18px), `600` weight
- Description: `body` (14px), `#71717a`
- Action button below description

## Modals

### Structure
- Overlay: `background: rgba(0,0,0,0.5)`, backdrop blur, z-index `50`
- Container: `#ffffff` (light), `#1f1f23` (dark), `xl` (12px) radius, shadow `xl`
- Width: `480px` default, `max-width: 90vw`
- Max-height: `90vh`, overflow-y: `auto`
- Padding: `24px`

### Header
- Title: `h2` (20px), `600` weight
- Close button: top-right, `32px` circle, hover `#f4f4f5`

### Body
- Padding: `0 24px`
- Content area

### Footer
- Display: `flex`, `justify-content: flex-end`, `gap: 12px`
- Padding: `16px 24px`
- Border-top: `1px solid #e4e4e7`

### Delete Confirmation
- Icon: `AlertTriangle`, `40px`, `#dc2626` color
- Title: `h2` (20px), `600`
- Description: `body` (14px), `#52525b`
- Actions: Cancel (secondary), Delete (danger)

## Badges

### Structure
- Display: `inline-flex`, `align-items: center`, `gap: 4px`
- Height: `24px`
- Padding: `2px 8px`
- Border-radius: `sm` (4px)
- Font: `xsmall` (11px), `600`, `line-height: 1`

### Variants
| Status | Background | Text |
|--------|-----------|------|
| Active | `#dcfce7` | `#166534` |
| Pending | `#fef3c7` | `#92400e` |
| Paid | `#dcfce7` | `#166534` |
| Unpaid | `#fee2e2` | `#991b1b` |
| Completed | `#dcfce7` | `#166534` |
| Overdue | `#fee2e2` | `#991b1b` |
| Processing | `#e0e7ff` | `#3730a3` |
| Cancelled | `#f3f4f6` | `#6b7280` |
| Info | `#dbeafe` | `#1e40af` |

### Dot Indicator
- `6px` circle, `border-radius: full`
- Matches status color
- Before text content

## Toasts

### Structure
- Container: fixed bottom-right, `z-index: 100`, `flex flex-col gap-2`
- Item: `400px` width, `max-width: 90vw`, `bg: #ffffff`, border `1px solid #e4e4e7`, `border-radius: lg`, shadow `lg`, padding `16px`
- Left border: `4px solid` matching status color
- Icon: `20px`, matching status color
- Title: `body` (14px), `600` weight
- Message: `small` (12px), `#52525b`

### Variants
| Type | Left Border | Icon |
|------|------------|------|
| Success | `#16a34a` | `CheckCircle` |
| Error | `#dc2626` | `XCircle` |
| Warning | `#d97706` | `AlertTriangle` |
| Info | `#2563eb` | `Info` |

### Animation
- Enter: `slideInRight` from right, opacity `0` to `1`, `200ms`
- Exit: `slideOutRight` to right, opacity `1` to `0`, `200ms`

## Charts

### General
- Responsive container, `width: 100%`, `height: 300px`
- Axis labels: `small` (12px), `#71717a`
- Legend: `small` (12px), positioned bottom or right
- Tooltips: `bg: #18181b`, `color: #fafafa`, `border-radius: md`, `padding: 8px 12px`, `font-size: 12px`
- Grid lines: `1px solid #e4e4e7`, dashed

### Empty State
- Centered text, `color: #71717a`, `padding: 48px`
- Icon: `48px`, `#d4d4d8`

### Loading State
- Skeleton overlay or animated placeholder

## Loading States

### Skeleton
- Background: `#f4f4f5` (light), `#1f1f23` (dark)
- Animated pulse: `opacity: 0.5`, `2s ease-in-out infinite`
- Border-radius: `md` (6px)
- Used for: cards, table rows, chart areas, text lines

### Button Loading
- Spinner: `16px`, `border: 2px solid #ffffff`, `border-top-color: transparent`, `border-radius: full`, `animation: spin 600ms linear infinite`
- Button disabled during loading

### Page Loading
- Full-page overlay or inline skeleton grid
- Dashboard: grid of skeleton stat cards + skeleton chart + skeleton table

## Empty States

### Structure
- Vertical flex, centered, `padding: 48px 24px`
- Icon: `48px`, `#d4d4d8` color, `margin-bottom: 16px`
- Title: `h3` (18px), `600` weight, `color: #18181b`, `margin-bottom: 8px`
- Description: `body` (14px), `color: #71717a`, `margin-bottom: 24px`
- Action button below description

### Context
- Table empty: "No [resource] found", "There are currently no [resource] records matching your criteria."
- Dashboard empty: "No [resource] yet", "Get started by creating your first [resource]."

## Error States

### Structure
- Vertical flex, centered, `padding: 48px 24px`
- Icon: `48px`, `#dc2626` color, `margin-bottom: 16px`
- Title: `h3` (18px), `600` weight, `color: #18181b`, `margin-bottom: 8px`
- Description: `body` (14px), `color: #52525b`, `margin-bottom: 24px`
- Action button: "Try Again" (primary)

### Context
- "Something went wrong" for generic errors
- Specific messages for known error types
- "We couldn't load [resource]. Please try again."

## Responsive Behaviour

### Desktop (`xl` and above: `1280px+`)
- Full sidebar (`260px`)
- Full header
- Full content area
- Multi-column layouts

### Laptop (`lg`: `1024px–1279px`)
- Sidebar `260px` (still expanded)
- Content padding reduced to `24px`
- Tables may start condensing

### Tablet (`md`: `768px–1023px`)
- Sidebar collapses to `64px` or becomes overlay
- Content padding `16px`
- Grid: `grid-cols-1 md:grid-cols-2`
- Tables scroll horizontally

### Mobile (`sm`: `640px–767px`)
- Sidebar overlay with hamburger toggle
- Content padding `12px`
- Grid: single column
- Stacked forms
- Horizontal scroll for tables

### Small mobile (`below 640px`)
- Header height reduced to `56px`
- Minimal padding
- Touch-friendly targets (`min-height: 44px`)
- Bottom navigation as alternative

### Touch Targets
- Minimum `44px` height for interactive elements
- Minimum `44px` width for buttons
- `8px` minimum spacing between touch targets

## Accessibility

### Semantic HTML
- Use `<nav>`, `<main>`, `<aside>`, `<header>`, `<section>`, `<table>`, `<button>`, `<form>`
- ARIA roles: `navigation`, `main`, `banner`, `complementary`
- Proper heading hierarchy (`h1` → `h2` → `h3`)
- Table headers with `scope="col"`

### Keyboard Navigation
- All interactive elements focusable via `Tab`
- Focus indicator: `2px solid #3b82f6`, `outline-offset: 2px`
- Skip-to-content link
- Sidebar navigation: arrow keys within nav section
- Dropdown menus: `Escape` to close
- Modal: `Escape` to close, focus trap

### Screen Readers
- `aria-label` on icons used as buttons
- `aria-current="page"` on active nav items
- `aria-describedby` on form fields linking to helper/error text
- `role="alert"` on toast notifications
- `aria-live="polite"` for dynamic content updates
- Status badges: `aria-label="Status: Active"`

### Contrast
- Text primary on background: minimum `7:1` contrast ratio
- Text secondary on background: minimum `4.5:1` contrast ratio
- All status badge text: minimum `4.5:1` contrast ratio
- Focus indicators: visible on all interactive elements
- Never rely on color alone — use icons, text, or patterns

### Reduced Motion
- `@media (prefers-reduced-motion: reduce)` disables all animations
- No `transition`, `animation`, `scroll-behavior`
- Instant state changes only

## Animation Guidelines

### Principles
- Fast: `150ms–300ms`
- Subtle: minimal visual change
- Purposeful: only when it improves usability
- Consistent: same duration for same element type

### Animation Types
| Element | Duration | Easing |
|---------|----------|--------|
| Sidebar expand/collapse | `200ms` | `ease-in-out` |
| Dropdown open/close | `150ms` | `ease-out` |
| Modal open/close | `200ms` | `ease-out` |
| Button hover | `150ms` | `ease-out` |
| Table row hover | `100ms` | `ease-out` |
| Toast enter/exit | `200ms` | `ease-out` |
| Page transition | `250ms` | `ease-in-out` |
| Skeleton pulse | `2s` | `ease-in-out`, infinite |
| Badge pop-in | `100ms` | `ease-out` |

### Reduced Motion
- All animations disabled when `prefers-reduced-motion: reduce`
- Instant state changes with no transition

## Page-Specific Patterns

### Dashboard
- Top: KPI stat cards grid (`grid-cols-2 md:grid-cols-4`)
- Middle: Chart section (`grid-cols-1 lg:grid-cols-2`)
- Bottom: Recent activity table or list
- Each section has clear heading

### Forms
- Section grouping with `h3` headings and horizontal divider
- Multi-column layout on larger screens
- Submit/Cancel buttons at bottom-right
- Form-level validation before submission
- Loading state on submit button

### Tables
- Toolbar at top with search, filters, actions
- Column headers with sort indicators
- Row actions in rightmost column (dropdown or icon buttons)
- Pagination at bottom
- Row selection checkbox column option

### Modals
- Confirm delete: icon + description + Cancel/Delete
- Quick edit: form fields + Save/Cancel
- Payment confirmation: summary + Confirm/Cancel

## Component Architecture

### Directory Structure
```
app/
  components/
    layout/
      Sidebar.tsx
      Header.tsx
      PageContainer.tsx
    ui/
      Button.tsx
      Input.tsx
      Select.tsx
      Textarea.tsx
      Modal.tsx
      Badge.tsx
      Card.tsx
      Table.tsx
      Pagination.tsx
      Skeleton.tsx
      EmptyState.tsx
      ErrorState.tsx
      Toast.tsx
    dashboard/
      StatCard.tsx
      ChartCard.tsx
      ActivityList.tsx
    forms/
      FormField.tsx
      FormSection.tsx
    tables/
      DataTable.tsx
      TableToolbar.tsx
  contexts/
    SidebarContext.tsx
    ToastContext.tsx
  lib/
    utils.ts
    api.ts
  (dashboard)/
    page.tsx
    loan-management/
      page.tsx
      overview/
        page.tsx
        add-organization/
          page.tsx
        add-loan/
          page.tsx
        pay-loan/
          page.tsx
    employee-management/
      page.tsx
      overview/
        page.tsx
      employees/
        page.tsx
      salary-distribution/
        page.tsx
    accounts/
      page.tsx
      add-investment/
        page.tsx
      company-deposit/
        page.tsx
    office-expense/
      page.tsx
      overview/
        page.tsx
      monthly-data-entry/
        page.tsx
      settings/
        page.tsx
    route-calculation/
      page.tsx
      overview/
        page.tsx
      add-route-cost/
        page.tsx
      settings/
        page.tsx
    reports/
      page.tsx
    settings/
      page.tsx
```

## UX Rules

1. Every screen must have loading, empty, and error states.
2. Every destructive action must have confirmation.
3. Every form must have validation and success/error feedback.
4. Navigation must clearly show the active page.
5. Tables must have search, filter, sort, and pagination.
6. Toast notifications for all async operations.
7. Keyboard navigation must work for all interactive elements.
8. Focus states must be visible on all interactive elements.
9. Never use color alone to communicate meaning.
10. All icons must have `aria-label` or descriptive text.
11. Loading states must prevent duplicate submissions.
12. Responsive layout must adapt, not just shrink.
13. Same component = same appearance everywhere.
14. Data must be real (from APIs) — mock data only for UI demonstration.

## Visual QA Checklist

- [ ] All colors match design tokens
- [ ] Typography follows scale and hierarchy
- [ ] Spacing is consistent (multiples of 4px)
- [ ] Border radius follows defined tokens
- [ ] Shadows are restrained
- [ ] Cards have consistent padding
- [ ] Tables are readable and not cramped
- [ ] Forms have proper labels and validation
- [ ] Modals have proper header/body/footer structure
- [ ] Badges use correct status colors
- [ ] Toasts appear consistently
- [ ] Charts have proper labels and tooltips
- [ ] Loading states prevent interaction
- [ ] Empty states have explanatory text and actions
- [ ] Error states have actionable feedback
- [ ] Active nav state is visually obvious
- [ ] Hover states work on all interactive elements
- [ ] Focus states are visible for keyboard users
- [ ] Responsive layout works on all breakpoints
- [ ] Touch targets are `44px+` on mobile
- [ ] Contrast ratios meet WCAG AA
- [ ] Semantic HTML is correct
- [ ] ARIA labels are present where needed
- [ ] Reduced motion is respected
- [ ] Same components look identical across pages
- [ ] No excessive gradients, shadows, or animations
- [ ] No generic AI dashboard appearance
- [ ] Interface feels like a professional SaaS product
