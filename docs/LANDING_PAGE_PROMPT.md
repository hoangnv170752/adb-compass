# DeviceHub Landing Page — Implementation Specification

Act as a senior engineer. Prioritize accuracy over creativity. Do not introduce ideas that aren't in this reference.

You are to create a landing page for DeviceHub, a modern Android device management desktop application. Follow the design system and specifications below with pixel-perfect accuracy. All layout, typography, color, spacing, and UI patterns must match exactly.

---

## Project Overview

**App Name:** DeviceHub
**Tagline:** "A simple desktop app to install APK files on your Android devices."
**Description:** A comprehensive desktop application for Android device management, debugging, and development. Built with React 19, TailwindCSS, Framer Motion, and Tauri v2.

---

## Typography

### Font Families

| Role | Fonts |
|------|-------|
| **Sans-serif** | `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif` |
| **Monospace** | `JetBrains Mono`, `SF Mono`, `Consolas`, `monospace` |

Use monospace for version strings, terminal output, device IDs, and code snippets.

### Type Scale

| Token | Size | Usage |
|-------|------|-------|
| `text-xs` | 11px | Fine print, badges |
| `text-sm` | 13px | Labels, secondary text |
| `text-base` | 15px | Body text |
| `text-lg` | 17px | Section headings |
| `text-xl` | 20px | Page titles |
| `text-2xl` | 24px | Large headings |
| `text-3xl` | 30px | Display text |
| `text-4xl` | 36px | Hero heading |
| `text-5xl` | 48px | Main hero title |

### Font Weights

| Token | Value |
|-------|-------|
| `font-normal` | 400 |
| `font-medium` | 500 |
| `font-semibold` | 600 |
| `font-bold` | 700 |

### Special Treatments

- Hero title: `text-5xl`, `font-bold`, gradient text using accent colors
- Section headings: `text-2xl`, `font-semibold`
- Body text: `text-base`, `font-normal`
- Buttons: `font-semibold`, slight letter-spacing on uppercase CTAs
- Code/terminal: Monospace font family

---

## Color Palette

### Accent Colors (Fixed, Theme-Independent)

| Token | Hex | Description |
|-------|-----|-------------|
| `accent` | `#06b6d4` | Cyan-500 — primary brand color |
| `accent-secondary` | `#8b5cf6` | Violet-500 — secondary brand color |
| `accent-gradient` | `135deg, #06b6d4 → #8b5cf6` | Used on primary buttons and highlights |

### Status Colors (Fixed, Theme-Independent)

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#22c55e` | Connected devices, success states |
| `warning` | `#eab308` | Unauthorized, caution states |
| `error` | `#ef4444` | Errors, ADB not found |

### Surface Colors — Light Theme

| Token | RGB | Tailwind equiv. | Usage |
|-------|-----|-----------------|-------|
| `surface-bg` | `241 245 249` | slate-100 | Page background |
| `surface-card` | `255 255 255` | white | Cards, panels |
| `surface-elevated` | `226 232 240` | slate-200 | Buttons, elevated elements |
| `surface-hover` | `203 213 225` | slate-300 | Hover states |
| `border` | `203 213 225` | slate-300 | Borders, dividers |

### Surface Colors — Dark Theme

| Token | RGB | Usage |
|-------|-----|-------|
| `surface-bg` | `10 10 15` | Near-black page background |
| `surface-card` | `20 20 30` | Card backgrounds |
| `surface-elevated` | `30 30 45` | Elevated UI elements |
| `surface-hover` | `40 40 60` | Hover states |
| `border` | `100 116 139` | Borders, dividers (slate-500) |

### Text Colors (Theme-Aware)

| Token | Light RGB | Dark RGB | Usage |
|-------|-----------|----------|-------|
| `text-primary` | `15 23 42` (slate-900) | `248 250 252` | Headings, primary content |
| `text-secondary` | `51 65 85` (slate-700) | `148 163 184` | Labels, secondary content |
| `text-muted` | `100 116 139` (slate-500) | `100 116 139` | Hints, placeholders, metadata |

---

## Spacing

4px base grid system.

| Token | Value |
|-------|-------|
| `space-xs` | 4px |
| `space-sm` | 8px |
| `space-md` | 12px |
| `space-lg` | 16px |
| `space-xl` | 24px |
| `space-2xl` | 32px |
| `space-3xl` | 48px |
| `space-4xl` | 64px |
| `space-5xl` | 96px |

---

## Border Radius

Apple-style rounded corners throughout.

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 8px | Small buttons, tags |
| `radius-md` | 12px | Inputs, small cards |
| `radius-lg` | 16px | Standard cards |
| `radius-xl` | 20px | Large panels |
| `radius-2xl` | 24px | Major containers |
| `radius-full` | 9999px | Pills, badges, status indicators |

---

## Shadow System

Layered depth shadows, heavier in dark mode.

| Token | Light Value |
|-------|-------------|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` |
| `shadow-sm` | `0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` |
| `shadow-md` | `0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)` |
| `shadow-lg` | `0 8px 16px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06)` |
| `shadow-xl` | `0 16px 32px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)` |
| `shadow-glow` | `0 0 20px rgba(6,182,212,0.30)` | Accent glow effect |

---

## Animation & Motion

Powered by **Framer Motion**.

### Easing Curves

| Token | Value | Usage |
|-------|-------|-------|
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Exit animations |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | General transitions |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy, playful interactions |

### Duration Scale

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 150ms | Micro-interactions, hover |
| `duration-normal` | 200ms | Most UI transitions |
| `duration-slow` | 300ms | Theme transitions, panels |
| `duration-slower` | 400ms | Page-level animations |

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Navigation Bar (sticky, backdrop-blur, z-50)                   │
│  [Logo + DeviceHub] [Features] [Download] [GitHub] [Theme]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Hero Section                                                   │
│  - Gradient headline                                            │
│  - Tagline                                                      │
│  - CTA buttons (Download, View on GitHub)                       │
│  - App screenshot/mockup                                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Features Grid (3 columns desktop, 1 mobile)                    │
│  - Device Management                                            │
│  - Screen Mirroring                                             │
│  - Multi-Screen Control                                         │
│  - App Management                                               │
│  - File Management                                              │
│  - Developer Tools                                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  App Showcase (Screenshots/Demo)                                │
│  - Tabbed interface showing different features                  │
│  - Animated transitions between tabs                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tech Stack Section                                             │
│  - React, TypeScript, Tauri, TailwindCSS logos                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Download Section                                               │
│  - Platform buttons (Windows, macOS, Linux)                     │
│  - Version number                                               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Footer                                                         │
│  - Credits, GitHub link, License                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Container Widths & Spacing

| Element | Width | Notes |
|---------|-------|-------|
| Max container | 1280px | Centered with auto margins |
| Navigation | Full width | Content max 1280px |
| Hero | Full width | Content max 1024px |
| Features grid | max 1280px | 3 columns, 24px gap |
| Section padding | 96px vertical | 24px horizontal on mobile |
| Card padding | 24px | All sides |

---

## Section Breakdown

### 1. Navigation Bar

**Specifications:**
- Position: `sticky top-0 z-50`
- Background: `surface-bg/80` with `backdrop-blur-md`
- Height: 64px
- Border: 1px bottom border using `border` token

**Elements (left to right):**
- Logo: App icon (48×48px, `rounded-xl`, subtle shadow) + "DeviceHub" text (`text-xl`, `font-bold`)
- Nav links: Features, Download, GitHub (`text-secondary`, hover: `text-primary`)
- Theme toggle: Sun/Moon icon button (`surface-elevated`, `rounded-lg`)

**Spacing:**
- 24px between nav links
- Logo and nav links separated by `flex-1`

---

### 2. Hero Section

**Layout:**
- Full viewport height minus nav (min-height: calc(100vh - 64px))
- Content centered vertically and horizontally
- Two-column on desktop: text left, app mockup right
- Single column stacked on mobile

**Hero Text:**
- Headline: "Android Device Management,\nSimplified."
  - `text-5xl` (desktop), `text-3xl` (mobile)
  - `font-bold`
  - Gradient text: `bg-gradient-to-r from-accent to-accent-secondary bg-clip-text text-transparent`
- Subheadline: "A powerful desktop app for managing Android devices. Install APKs, mirror screens, browse files, and debug — all from one beautiful interface."
  - `text-lg`, `text-secondary`
  - Max width: 540px
  - 16px margin top

**CTA Buttons:**
- Primary: "Download for Free"
  - Gradient background: `from-accent to-accent-secondary`
  - Text: white, `font-semibold`
  - Padding: 16px 32px
  - Border radius: `radius-lg` (16px)
  - Shadow: `shadow-lg`, glow on hover
  - Icon: Download arrow (left of text)
- Secondary: "View on GitHub"
  - Background: transparent
  - Border: 1px solid `border`
  - Text: `text-primary`, `font-semibold`
  - Padding: 16px 32px
  - Border radius: `radius-lg`
  - Icon: GitHub logo (left of text)
- Button spacing: 16px gap between buttons
- Button group margin top: 32px

**App Mockup:**
- Screenshot of DeviceHub app in a device frame
- Subtle shadow: `shadow-xl`
- Border radius: `radius-2xl`
- Slight rotation: `rotate-1` or `rotate-2` for visual interest
- Floating animation: subtle up/down motion (Framer Motion)

---

### 3. Features Grid

**Section Header:**
- Title: "Everything you need to manage Android devices"
  - `text-3xl`, `font-bold`, `text-primary`
  - Centered
- Subtitle: "DeviceHub combines powerful tools in one elegant interface"
  - `text-lg`, `text-secondary`
  - Centered
  - 16px margin top
- Section padding: 96px top, 96px bottom

**Grid Layout:**
- 3 columns on desktop (≥1024px)
- 2 columns on tablet (≥768px)
- 1 column on mobile
- Gap: 24px

**Feature Cards:**

Each card follows this structure:
- Background: `surface-card`
- Border: 1px solid `border`
- Border radius: `radius-2xl` (24px)
- Padding: 32px
- Hover: `-translate-y-1`, `shadow-xl`, `border-accent`
- Transition: 300ms

Card content:
- Icon: 48×48px, gradient background (`from-accent/10 to-accent-secondary/10`), `rounded-xl`, centered icon in accent color
- Title: `text-xl`, `font-semibold`, 16px margin top
- Description: `text-base`, `text-secondary`, 8px margin top

**Features to Include:**

1. **Device Management**
   - Icon: Smartphone
   - "Auto-detect connected Android devices. View detailed hardware info, battery status, storage, and more."

2. **Screen Mirroring**
   - Icon: Monitor/Cast
   - "Mirror your device screen in real-time with up to 60 FPS. Touch, scroll, and type directly from your desktop."

3. **Multi-Screen Control**
   - Icon: Layout Grid
   - "Control multiple devices simultaneously. Perfect for testing across different devices or team demos."

4. **App Management**
   - Icon: Package/Grid
   - "Browse, search, and manage installed apps. Uninstall apps, clear data, and grant permissions with one click."

5. **File Management**
   - Icon: Folder
   - "Full-featured file explorer. Upload, download, and organize files on your device with drag-and-drop."

6. **APK Installation**
   - Icon: Download/Box
   - "Drag and drop APK files to install. Pre-installation validation ensures successful installs every time."

7. **Developer Tools**
   - Icon: Terminal
   - "Built-in logcat viewer and shell terminal. Filter logs, run commands, and debug in real-time."

8. **Wireless ADB**
   - Icon: Wifi
   - "Connect wirelessly over WiFi. No USB cable needed after initial setup."

9. **Cross-Platform**
   - Icon: Layers
   - "Native apps for Windows, macOS, and Linux. Fast, lightweight, and beautifully designed."

---

### 4. App Showcase Section

**Layout:**
- Full-width background: Subtle gradient or pattern
- Content max-width: 1024px
- Centered

**Tab Navigation:**
- Horizontal tabs: "Overview", "Screen", "Apps", "Files", "Terminal"
- Tab style: Pill-shaped buttons
  - Inactive: `surface-elevated`, `text-secondary`
  - Active: Gradient background, white text
- Tab spacing: 8px gap
- Tab padding: 12px 24px
- Border radius: `radius-full`

**Screenshot Display:**
- Large app screenshot below tabs
- Border radius: `radius-xl`
- Shadow: `shadow-xl`
- Animated transition between screenshots (fade + scale)
- Caption below: Feature description, `text-secondary`, centered

---

### 5. Tech Stack Section

**Background:** Slightly different surface color for contrast

**Title:** "Built with modern technologies"
- `text-2xl`, `font-semibold`, centered

**Logo Grid:**
- Horizontal row of tech logos
- Logos: React, TypeScript, TailwindCSS, Tauri, Framer Motion
- Logo size: 48px height
- Grayscale by default, full color on hover
- Gap: 48px between logos
- Centered horizontally

---

### 6. Download Section

**Background:** Gradient from `accent/5` to `accent-secondary/5`

**Content:**
- Title: "Ready to get started?"
  - `text-3xl`, `font-bold`, centered
- Subtitle: "Download DeviceHub for free and take control of your Android devices."
  - `text-lg`, `text-secondary`, centered
  - 16px margin top

**Platform Buttons:**
- Three buttons in a row (stacked on mobile)
- Gap: 16px

Button specifications:
- Background: `surface-card`
- Border: 1px solid `border`
- Border radius: `radius-xl`
- Padding: 24px 32px
- Hover: `shadow-lg`, `border-accent`
- Content:
  - Platform icon (Windows/Apple/Linux): 32px
  - Platform name: `font-semibold`
  - File format: `text-sm`, `text-muted`

Platform details:
1. **Windows**: "Windows" / "EXE, MSI, ZIP"
2. **macOS**: "macOS" / "DMG"
3. **Linux**: "Linux" / "DEB, AppImage"

**Version Badge:**
- Below buttons
- Pill-shaped: `rounded-full`
- Background: `surface-elevated`
- Text: "v1.0.0" (or current version)
- `text-sm`, `font-mono`

---

### 7. Footer

**Background:** `surface-card` or slightly darker

**Layout:**
- Max-width: 1280px, centered
- Padding: 48px vertical

**Content:**
- Left: Logo + "DeviceHub" + copyright
  - "© 2026 DeviceHub. Made with ❤️ by hoangnv170752"
  - `text-sm`, `text-muted`
- Right: Links
  - GitHub, Documentation, License
  - `text-secondary`, hover: `text-primary`

**Credits:**
- "Original idea by h1dr0n"
- `text-xs`, `text-muted`

---

## Animations (Framer Motion)

### Page Load

1. **Navigation**: Fade in from top, 0.3s delay
2. **Hero headline**: Fade in + slide up (y: 20 → 0), 0.5s, staggered by word
3. **Hero subheadline**: Fade in, 0.4s delay after headline
4. **CTA buttons**: Fade in + scale (0.95 → 1), staggered, 0.5s delay
5. **App mockup**: Fade in + slide from right (x: 40 → 0), 0.6s

### Scroll Animations

1. **Feature cards**: Fade in + slide up as they enter viewport, staggered by 0.1s
2. **Section headers**: Fade in when 20% visible
3. **Tech logos**: Staggered fade in
4. **Download buttons**: Scale up on hover (1.02)

### Hover States

1. **Feature cards**: Lift (-4px translateY), shadow intensifies, border color changes to accent
2. **Buttons**: Slight scale (1.02), shadow-glow appears
3. **Nav links**: Underline slides in from left
4. **Platform buttons**: Lift + shadow

### Floating App Mockup

- Subtle floating animation: translateY oscillates ±8px over 4s
- Use `animate` with `repeat: Infinity`, `ease: "easeInOut"`

---

## Responsive Behavior

### Desktop (≥1280px)
- Full layout as specified
- Hero: Two columns
- Features: 3 columns
- Download buttons: Row

### Laptop (≥1024px)
- Container max-width: 95vw
- Features: 3 columns
- Typography scales down slightly

### Tablet (≥768px)
- Hero: Stacked (text above mockup)
- Features: 2 columns
- Navigation links may collapse to hamburger
- Typography: Hero `text-4xl`

### Mobile (≤767px)
- Single column throughout
- Features: 1 column
- Download buttons: Stacked vertically
- Navigation: Hamburger menu
- Hero: `text-3xl` headline, full-width mockup
- Section padding: 48px vertical
- Card padding: 20px

---

## Performance Requirements

- Use Next/Image for all images with lazy loading
- Optimize screenshots for web (WebP format, compressed)
- Target Lighthouse score: 90+
- Preload critical fonts (Inter, JetBrains Mono)
- Use CSS containment for animated sections
- Defer non-critical animations until after LCP

---

## Component Structure

```
components/
├── layout/
│   ├── Navigation.tsx
│   ├── Footer.tsx
│   └── Container.tsx
├── sections/
│   ├── HeroSection.tsx
│   ├── FeaturesSection.tsx
│   ├── ShowcaseSection.tsx
│   ├── TechStackSection.tsx
│   └── DownloadSection.tsx
├── ui/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── FeatureCard.tsx
│   ├── PlatformButton.tsx
│   ├── TabButton.tsx
│   └── ThemeToggle.tsx
└── common/
    ├── Logo.tsx
    ├── Icon.tsx
    └── GradientText.tsx

pages/
└── index.tsx

styles/
├── globals.css
└── theme.css

public/
├── images/
│   ├── screenshots/
│   │   ├── overview.webp
│   │   ├── screen.webp
│   │   ├── apps.webp
│   │   ├── files.webp
│   │   └── terminal.webp
│   └── mockup.webp
├── icons/
│   ├── logo.svg
│   ├── windows.svg
│   ├── apple.svg
│   └── linux.svg
└── fonts/
    ├── Inter.woff2
    └── JetBrainsMono.woff2
```

---

## Asset Requirements

### Screenshots
- Capture actual DeviceHub app screenshots for each tab:
  1. Overview tab showing device info
  2. Screen tab with mirroring active
  3. Apps tab with app list
  4. Files tab with file browser
  5. Terminal/Logcat view
- Resolution: 1920×1080 minimum
- Format: WebP, quality 85%

### App Mockup
- DeviceHub window in a clean desktop mockup
- Show the main interface with a device connected
- Optional: Add subtle glow/reflection effects

### Icons
- Use Lucide React icons (already in project)
- Size: 24px for navigation, 48px for feature cards
- Color: Use accent color or text-primary

### Logo
- Source: `public/icon.png`
- Display sizes: 48×48px (nav), 64×64px (footer)
- Apply `rounded-xl` and subtle shadow

---

## Implementation Notes

1. **Framework**: Use Next.js with App Router or Vite + React
2. **Styling**: TailwindCSS with custom theme extending the design system
3. **Animation**: Framer Motion for all animations
4. **Icons**: Lucide React (consistent with main app)
5. **Theme**: Support light/dark mode with CSS variables
6. **Fonts**: Self-host Inter and JetBrains Mono for performance
7. **Images**: Use next/image or optimized img tags with lazy loading

---

## Content Text

### Hero
**Headline:** "Android Device Management, Simplified."

**Subheadline:** "A powerful desktop app for managing Android devices. Install APKs, mirror screens, browse files, and debug — all from one beautiful interface."

### Features Section
**Title:** "Everything you need to manage Android devices"
**Subtitle:** "DeviceHub combines powerful tools in one elegant interface"

### Download Section
**Title:** "Ready to get started?"
**Subtitle:** "Download DeviceHub for free and take control of your Android devices."

### Footer
**Copyright:** "© 2026 DeviceHub. Made with ❤️ by hoangnv170752"
**Credit:** "Original idea by h1dr0n"

---

## Quality Checklist

- [ ] All colors match the design system exactly
- [ ] Typography uses correct sizes, weights, and line-heights
- [ ] Spacing follows the 4px grid system
- [ ] Border radius matches specification
- [ ] Shadows are consistent throughout
- [ ] Animations are smooth and performant
- [ ] Responsive breakpoints work correctly
- [ ] Theme toggle works for light/dark mode
- [ ] All images are optimized and lazy-loaded
- [ ] Lighthouse score ≥90
- [ ] Accessibility: proper heading hierarchy, alt text, ARIA labels
- [ ] Links to GitHub and downloads are functional

---

## Competitor Comparison Section

### Competitors

1. **scrcpy** (by Genymobile)
   - Free & Open Source (Apache 2.0)
   - GitHub: https://github.com/genymobile/scrcpy
   - CLI-only, no GUI
   - High performance (up to 120 FPS)
   - No file management, no app management, no device dashboard

2. **Vysor** (by Koushik Dutta)
   - Freemium / Proprietary
   - Website: https://www.vysor.io
   - Free: Low quality, USB only, ads
   - Pro ($2.50/mo, $10/yr, $40 lifetime): Wireless, high quality, file drag & drop
   - No file browser, no app management, no developer tools

3. **Android Studio**
   - Free (official Google IDE)
   - 1GB+ installation size
   - Full IDE with device management
   - Overkill for simple device management tasks

### Accurate Comparison Data

| Feature | DeviceHub | scrcpy | Vysor Free | Vysor Pro | Android Studio |
|---------|-----------|--------|------------|-----------|----------------|
| Screen Mirroring | ✅ 60 FPS | ✅ 120 FPS | ✅ Low quality | ✅ High quality | ✅ |
| File Browser | ✅ | ❌ | ❌ | ❌ (drag only) | ✅ |
| Wireless ADB | ✅ | ✅ | ❌ | ✅ | ✅ |
| APK Drag & Drop | ✅ | ❌ | ❌ | ❌ | ❌ |
| Multi-Device Sync | ✅ | ❌ | ❌ | ❌ | ❌ |
| App Management | ✅ | ❌ | ❌ | ❌ | ✅ |
| Logcat Viewer | ✅ | ❌ | ❌ | ❌ | ✅ |
| Shell Terminal | ✅ | ❌ | ❌ | ❌ | ✅ |
| GUI Interface | ✅ | ❌ | ✅ | ✅ | ✅ |
| Free & Open Source | ✅ | ✅ | ✅ (limited) | ❌ | ❌ |
| Lightweight (<50MB) | ✅ | ✅ | ✅ | ✅ | ❌ (1GB+) |

### Stats (Verified Claims Only)

| Stat | Value | Comparison |
|------|-------|------------|
| App Size | <50MB | vs Android Studio 1GB+ |
| Startup | <2s | vs IDE 30s+ |
| Price | $0 | Free forever, no tiers |
| Tools | 9+ | Integrated features |

### Unique Selling Points

**vs scrcpy:**
- GUI interface (no command-line)
- Integrated file browser
- App management
- Multi-device sync
- Device dashboard

**vs Vysor:**
- Completely free (no paid tiers)
- Open source
- Full file browser
- Developer tools (logcat, terminal)
- No ads

**vs Android Studio:**
- 20× lighter
- Instant startup
- Purpose-built for device management
- Simpler UI

### Limitations to Acknowledge
- No audio forwarding (scrcpy has this)
- No iOS support (Vysor has this)
- Max 60 FPS (scrcpy supports 120 FPS)

---

*Last updated: March 2026*
