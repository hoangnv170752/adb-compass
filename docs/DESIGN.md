# Design System — DeviceHub

This document describes the visual design language, component patterns, and UI architecture of DeviceHub.

---

## Overview

DeviceHub follows an **Apple-inspired design language** — clean surfaces, generous whitespace, soft shadows, and smooth animations. The UI is built with **React 19 + TailwindCSS v3**, animated via **Framer Motion**, and runs as a native desktop app on Tauri v2.

---

## Brand & Identity

### App Name
**DeviceHub** — a modern Android device management tool.

### Logo / App Icon
- File: `public/icon.png`
- Displayed in the header at **48×48px** with `rounded-xl` corners and a soft shadow
- The icon is also used for all platform bundles (see `src-tauri/icons/`)

### Tagline
*"A simple desktop app to install APK files on your Android devices."*

---

## Color Palette

### Accent Colors (fixed, theme-independent)

| Token | Hex | Description |
|---|---|---|
| `accent` | `#06b6d4` | Cyan-500 — primary brand color |
| `accent-secondary` | `#8b5cf6` | Violet-500 — secondary brand color |
| `accent-gradient` | `135deg, #06b6d4 → #8b5cf6` | Used on primary buttons and highlights |

### Status Colors (fixed, theme-independent)

| Token | Hex | Tailwind equiv. | Usage |
|---|---|---|---|
| `success` | `#22c55e` | green-500 | Connected devices, success states |
| `warning` | `#eab308` | yellow-500 | Unauthorized, caution states |
| `error` | `#ef4444` | red-500 | Errors, ADB not found |

### Surface Colors (CSS variables, theme-aware)

#### Light Theme

| Token | RGB | Tailwind equiv. | Usage |
|---|---|---|---|
| `surface-bg` | `241 245 249` | slate-100 | Page background |
| `surface-card` | `255 255 255` | white | Cards, panels |
| `surface-elevated` | `226 232 240` | slate-200 | Buttons, elevated elements |
| `surface-hover` | `203 213 225` | slate-300 | Hover states |
| `border` | `203 213 225` | slate-300 | Borders, dividers |

#### Dark Theme

| Token | RGB | Usage |
|---|---|---|
| `surface-bg` | `10 10 15` | Near-black page background |
| `surface-card` | `20 20 30` | Card backgrounds |
| `surface-elevated` | `30 30 45` | Elevated UI elements |
| `surface-hover` | `40 40 60` | Hover states |
| `border` | `100 116 139` | slate-500 — Borders, dividers |

### Text Colors (CSS variables, theme-aware)

| Token | Light RGB | Dark RGB | Usage |
|---|---|---|---|
| `text-primary` | `15 23 42` (slate-900) | `248 250 252` | Headings, primary content |
| `text-secondary` | `51 65 85` (slate-700) | `148 163 184` | Labels, secondary content |
| `text-muted` | `100 116 139` (slate-500) | `100 116 139` | Hints, placeholders, metadata |

---

## Typography

### Font Stack

| Role | Fonts |
|---|---|
| **Sans-serif** | `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif` |
| **Monospace** | `JetBrains Mono`, `SF Mono`, `Consolas`, `monospace` |

Monospace is used for version strings, terminal output, device IDs, and code.

### Type Scale

| Token | Size | Usage |
|---|---|---|
| `text-xs` | 11px | Fine print, badges |
| `text-sm` | 13px | Labels, secondary text |
| `text-base` | 15px | Body text |
| `text-lg` | 17px | Section headings |
| `text-xl` | 20px | Page titles |
| `text-2xl` | 24px | Large headings |
| `text-3xl` | 30px | Display text |

### Font Weights

| Token | Value |
|---|---|
| `font-normal` | 400 |
| `font-medium` | 500 |
| `font-semibold` | 600 |
| `font-bold` | 700 |

---

## Spacing

4px base grid system.

| Token | Value |
|---|---|
| `space-xs` | 4px |
| `space-sm` | 8px |
| `space-md` | 12px |
| `space-lg` | 16px |
| `space-xl` | 24px |
| `space-2xl` | 32px |
| `space-3xl` | 48px |

---

## Border Radius

Apple-style rounded corners throughout.

| Token | Value | Common usage |
|---|---|---|
| `radius-sm` | 8px | Small buttons, tags |
| `radius-md` | 12px | Inputs, small cards |
| `radius-lg` | 16px | Standard cards |
| `radius-xl` | 20px | Large panels |
| `radius-2xl` | 24px | Major containers |
| `radius-full` | 9999px | Pills, badges, status indicators |

---

## Shadow System

Layered depth shadows, heavier in dark mode.

| Token | Light value |
|---|---|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` |
| `shadow-sm` | `0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` |
| `shadow-md` | `0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)` |
| `shadow-lg` | `0 8px 16px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06)` |
| `shadow-xl` | `0 16px 32px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)` |
| `shadow-glow` | `0 0 20px rgba(59,130,246,0.30)` |

---

## Animation & Motion

Powered by **Framer Motion**. All page/view transitions use `opacity + scale(0.98 → 1)`.

### Easing Curves

| Token | Value | Usage |
|---|---|---|
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Exit animations |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | General transitions |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy, playful interactions |

### Duration Scale

| Token | Value | Usage |
|---|---|---|
| `duration-fast` | 150ms | Micro-interactions, hover |
| `duration-normal` | 200ms | Most UI transitions |
| `duration-slow` | 300ms | Theme transitions, panels |
| `duration-slower` | 400ms | Page-level animations |

Theme color transitions (background, border, text) all use **300ms ease-in-out** globally.

---

## Layout Architecture

```
┌─────────────────────────────────────────────────────┐
│  Header (sticky, backdrop-blur, z-50)                │
│  [Icon + App name + version] [ADB status badge]      │
├────────────┬────────────────────────────────────────┤
│  Sidebar   │  Main Content Area                      │
│  (fixed    │  (flex-1, overflow-hidden)              │
│  left)     │                                         │
│            │  AnimatePresence (mode="wait")          │
│  - APK     │  ┌─────────────────────────────────┐   │
│    panel   │  │ Device List / Device Detail /   │   │
│  - Tools   │  │ Settings / Logcat / Terminal /  │   │
│  - Settings│  │ Multi-Screen View               │   │
│            │  └─────────────────────────────────┘   │
└────────────┴────────────────────────────────────────┘
```

- **Header**: `sticky top-0 z-50`, `backdrop-blur-md`, `bg-surface-bg/80`
- **Sidebar**: fixed width, left-aligned, always visible
- **Main content**: fills remaining space, single active view at a time
- **View transitions**: `opacity 0→1`, `scale 0.98→1`, 200ms

---

## Component Patterns

### Primary Button (`.btn-primary`)
```css
gradient: from-accent to-accent-secondary
text: white, font-semibold
shadow: shadow-accent/30, elevates on hover
border-radius: rounded-lg (8px)
```

### Card (`.card`)
```css
background: surface-card
border: 1px solid border
border-radius: rounded-2xl (24px)
padding: p-5 (20px)
transition: 300ms
```

### Card with hover (`.card-hover`)
```css
hover: -translate-y-1, shadow-xl, border-accent
```

### ADB Status Badge (in header)
```css
shape: pill (rounded-full)
available:   bg-success/10, border-success/20 + green dot with glow
unavailable: bg-error/10,   border-error/20   + red dot
```

### Toast Notifications
- Library: **Sonner** (`sonner@2.x`)
- Position: `bottom-right`
- Styled to match surface/border/text tokens
- Auto-adapts to current theme

### Scrollbar
- Width: **6px**, hidden by default, appears on hover
- Color: `border` token color, brighter on thumb hover
- Applied globally and via `.custom-scrollbar` utility class

---

## Theming

| Mode | Trigger |
|---|---|
| Light | `.dark` class absent on `<html>` |
| Dark | `.dark` class on `<html>` |
| System | Follows OS preference, managed by `ThemeContext` |

All color CSS variables are defined on `:root` (light) and `.dark`. TailwindCSS `darkMode: 'class'` is used.

---

## Icon Library

**Lucide React** (`lucide-react@0.562`) — consistent stroke-based icons at 14–18px throughout the UI.

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| UI Framework | React 19 |
| Language | TypeScript ~5.8 |
| Styling | TailwindCSS v3 |
| Animation | Framer Motion v12 |
| Icons | Lucide React |
| Components | Radix UI (Dialog, Progress, Tooltip) |
| Notifications | Sonner |
| Desktop runtime | Tauri v2 |
| Build tool | Vite v7 |
| Package manager | pnpm |

---

*Last updated: March 2026*
