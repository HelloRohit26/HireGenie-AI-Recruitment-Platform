---
name: Warm Graphite Editorial
colors:
  surface: '#131311'
  surface-dim: '#131311'
  surface-bright: '#3a3937'
  surface-container-lowest: '#0e0e0c'
  surface-container-low: '#1c1c19'
  surface-container: '#20201d'
  surface-container-high: '#2a2a28'
  surface-container-highest: '#353532'
  on-surface: '#e3e2df'
  on-surface-variant: '#d2c4b3'
  inverse-surface: '#e5e2de'
  inverse-on-surface: '#31302e'
  outline: '#4f4538'
  outline-variant: '#4f4538'
  surface-tint: '#efbf73'
  primary: '#f4c377'
  on-primary: '#432c00'
  primary-container: '#d6a85f'
  on-primary-container: '#5b3d00'
  inverse-primary: '#7c5816'
  secondary: '#d3c4b3'
  on-secondary: '#382f23'
  secondary-container: '#4f4538'
  on-secondary-container: '#c1b3a2'
  tertiary: '#aaceff'
  on-tertiary: '#02315a'
  tertiary-container: '#8fb2e2'
  on-tertiary-container: '#1e446e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdeae'
  primary-fixed-dim: '#efbf73'
  on-primary-fixed: '#281800'
  on-primary-fixed-variant: '#604100'
  secondary-fixed: '#f0e0ce'
  secondary-fixed-dim: '#d3c4b3'
  on-secondary-fixed: '#221a0f'
  on-secondary-fixed-variant: '#4f4538'
  tertiary-fixed: '#d3e4ff'
  tertiary-fixed-dim: '#a6c9fa'
  on-tertiary-fixed: '#001c38'
  on-tertiary-fixed-variant: '#234872'
  background: '#131311'
  on-background: '#e5e2de'
  surface-variant: '#353532'
  accent-lume: '#f2dec0'
  success-muted: '#2d3528'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  container-max: 1200px
  onboarding-track-height: 4px
---

## Brand & Style

The design system is built on a "Warm Graphite" narrative—a sophisticated, high-end intersection of recruitment utility and editorial elegance. It targets two distinct personas: the high-performance Recruiter requiring information density and the modern Candidate seeking a premium, low-friction entry into their next career phase.

The style is a blend of **Minimalism** and **Tactile Modernism**. It prioritizes deep, obsidian surfaces with luminous accents. The emotional response should be one of "quiet confidence"—professional, exclusive, and precise, avoiding the frantic energy of typical job boards in favor of a curated, atmospheric experience.

## Colors

The palette is strictly dark-mode centric. The primary color, a desaturated gold, serves as the "lume"—a beacon of action against the graphite surface. 

- **Surface (#131311):** The foundation, providing a deep, non-pure-black backdrop that feels organic.
- **On-Surface (#e3e2df):** A warm off-white used for high-legibility text, preventing the harsh eye strain of pure white-on-black.
- **Outline (#4f4538):** A structural color used for boundaries, form fields, and subtle divisions, echoing the warmth of the primary accent.
- **Primary Accent (#d6a85f):** Reserved for critical intent, focus states, and progress.

## Typography

This design system utilizes **Hanken Grotesk** exclusively to maintain a cohesive, modern-industrial look. 

The typography differentiates the two user paths through scale and breathing room:
- **Candidate Path:** Utilizes `display-lg` and `body-lg` to create an editorial, low-density feel.
- **Recruiter Path:** Relies on `title-md` and `body-md` for higher information density and operational speed.
- All labels use a slight tracking increase (letter-spacing) to ensure legibility against dark backgrounds.

## Layout & Spacing

The layout is governed by an 8px rhythmic grid. 

- **Recruiter Flow:** Employs a 12-column fluid grid with standard 24px gutters to accommodate dense data tables and side-by-side comparisons.
- **Candidate/Authentication Flow:** Uses a centered, fixed-width layout (max 480px for forms) with significant vertical padding (80px+) to focus the user’s attention and evoke a premium "concierge" feel.
- **Onboarding Tracks:** Horizontal progress indicators are refined 4px tracks, spanning the width of the container, positioned at the very top of the layout to act as a structural horizon line.

## Elevation & Depth

Depth is achieved through **Tonal Layering** rather than traditional drop shadows.

- **Level 0 (Base):** #131311 (Surface).
- **Level 1 (Cards/Modals):** A subtle shift to a slightly lighter graphite (approx. 5% lighter) with a 1px border using the `Outline` color.
- **Interactive Depth:** When a role selection card or button is hovered, the border transitions from `Outline` to `Primary`. 
- **Backdrop:** Authentication screens use a subtle, large-scale radial gradient (Primary color at 5% opacity) centered behind the main input area to provide a soft "glow" effect without breaking the dark aesthetic.

## Shapes

The design system uses "Soft" geometry. Sharp corners are avoided to maintain the "Warm" brand promise, but large radii are rejected to stay professional and "Engineered."

- **Buttons & Inputs:** 4px (0.25rem) corner radius.
- **Role Selection Cards:** 8px (0.5rem) corner radius to differentiate them as larger structural containers.
- **Success Indicators:** Circular elements are permitted only for small icons or status pips.

## Components

### Role Selection Cards
Cards must be equal height. In the rest state, they use the `Outline` border. On selection, the border thickens to 2px `Primary` and the background gains a faint `Primary` tint (2-4% opacity). Use `title-md` for the role name and `body-md` for the description.

### Multi-step Progress Indicators
A series of 4px horizontal tracks. The 'Completed' segments are `Primary`. The 'Active' segment is a gradient from `Primary` to `Outline`. 'Upcoming' segments are `Outline` at 30% opacity.

### Form Fields
- **Rest:** Background is transparent; border is `Outline` (1px).
- **Focus:** Border transitions to `Primary` (1px) with a subtle "inner glow" (0 0 4px #d6a85f at 20% opacity). Label moves to a floating position using `label-sm`.
- **Error:** Border transitions to a muted terracotta (avoiding bright neon reds).

### Magic Link Entry
Minimalist, centered composition. The primary CTA button is "Airy"—generous internal padding (16px vertical, 32px horizontal). The success state for magic link delivery is a simple, premium "Link Sent" message using `title-md` with a subtle check icon; avoid celebratory confetti or animations.

### Success/Ready States
"Premium Ready" state: Use a high-contrast combination of `on-surface` text on a `Primary` background for the final action button. The interface should feel "locked and loaded" rather than "cheering," emphasizing readiness for the next operational step.