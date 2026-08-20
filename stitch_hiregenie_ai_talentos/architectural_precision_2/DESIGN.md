---
name: Architectural Precision
colors:
  surface: '#121415'
  surface-dim: '#121415'
  surface-bright: '#38393a'
  surface-container-lowest: '#0c0e0f'
  surface-container-low: '#1a1c1d'
  surface-container: '#1e2021'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333536'
  on-surface: '#e2e2e3'
  on-surface-variant: '#d1c5b5'
  inverse-surface: '#e2e2e3'
  inverse-on-surface: '#2f3132'
  outline: '#9a8f81'
  outline-variant: '#4e463a'
  surface-tint: '#e6c183'
  primary: '#e6c183'
  on-primary: '#422c00'
  primary-container: '#c5a267'
  on-primary-container: '#503806'
  inverse-primary: '#765a26'
  secondary: '#bbcbba'
  on-secondary: '#263428'
  secondary-container: '#3c4a3d'
  on-secondary-container: '#aab9a9'
  tertiary: '#c5c7c8'
  on-tertiary: '#2e3132'
  tertiary-container: '#a5a7a8'
  on-tertiary-container: '#3a3d3e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdeaa'
  primary-fixed-dim: '#e6c183'
  on-primary-fixed: '#271900'
  on-primary-fixed-variant: '#5c4210'
  secondary-fixed: '#d7e7d5'
  secondary-fixed-dim: '#bbcbba'
  on-secondary-fixed: '#121e14'
  on-secondary-fixed-variant: '#3c4a3d'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#444748'
  background: '#121415'
  on-background: '#e2e2e3'
  surface-variant: '#333536'
typography:
  display-lg:
    fontFamily: Newsreader
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-job:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  headline-job-mobile:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
  tab-label:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  body-ui:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-page: 48px
  workspace-header-height: 120px
  tab-bar-height: 48px
---

## Brand & Style
The design system is defined by a rigorous, structural elegance tailored for high-stakes recruitment. It prioritizes clarity, intentionality, and a sense of permanence, moving away from ephemeral SaaS trends toward an editorial, workspace-centric aesthetic. 

The visual style is **Modern Minimalist with a focus on Tonal Layering**. It evokes the feeling of a high-end architectural firm's portfolio: quiet, expensive, and precise. The emotional response should be one of "calm authority," reducing the cognitive load of complex hiring workflows through generous whitespace and a sophisticated, low-vibrancy palette.

## Colors
The palette is divided into two primary modes: **Warm Graphite** (Dark) and **Warm Pearl** (Light).

- **Warm Graphite:** A deep, desaturated charcoal base with warm undertones. It provides a non-fatiguing environment for long-form candidate review.
- **Warm Pearl:** A creamy, sophisticated light mode that avoids the starkness of pure white (#FFFFFF), using bone and parchment tones to maintain a premium feel.
- **Accents:** We use a **Muted Brass** (#C5A267) for primary actions and highlights, and **Dusty Sage** (#7D8C7D) for secondary status indicators or success states, ensuring the UI remains grounded and organic.

## Typography
The system employs a high-contrast typographic pairing to achieve an editorial look.

- **Headlines:** Use **Newsreader** for all job titles and major section headers. It provides a literary, authoritative feel.
- **UI Elements & Body:** Use **Hanken Grotesk** for functional elements, data, and body copy. This keeps the interface feeling modern and highly legible.
- **Letter Spacing:** All caps labels should use a minimum of 5-8% tracking to enhance readability and premium feel.

## Layout & Spacing
This design system utilizes a **Fixed-Fluid Hybrid** model. The main workspace is contained within a max-width of 1440px to preserve line lengths for reading candidate profiles, while the header background stretches to fill the viewport.

**Workspace Anatomy:**
1. **Persistent Header:** A 120px height block containing the Job Title (Headline-Job) and metadata (Location, Department, Status). 
2. **Sub-Navigation:** A sticky 48px tab bar sits immediately below the header.
3. **Content Area:** Uses a 12-column grid with 24px gutters.

On mobile, margins reduce to 16px, and the sub-navigation becomes a horizontally scrollable track.

## Elevation & Depth
Depth is created through **Tonal Stepping** rather than aggressive shadows.

- **Level 0 (Background):** The base canvas.
- **Level 1 (Surface):** The primary content cards and workspace area.
- **Level 2 (Navigation):** Floating elements or dropdowns use a subtle 1px border in a slightly lighter tone than the surface, with a very soft, large-radius ambient shadow (15% opacity).

In the Warm Graphite theme, elevation is signaled by moving from darker to lighter grays. In Warm Pearl, elevation is signaled by subtle shifts in saturation and very light "ghost" borders.

## Shapes
To maintain the "Architectural" narrative, the shape language is **Soft-Geometric**. 

- **Primary Radius:** 4px (Standard UI components, buttons, inputs).
- **Secondary Radius:** 8px (Cards, modal containers).
- **Interactive Elements:** Use sharp internal corners and slightly rounded external corners to emphasize a "built" or "constructed" look.

## Components

### Workspace Header
The core of the system. The background should use a subtle vertical gradient from `surface_alt` to `surface`. The Job Title is always left-aligned in **Newsreader**. Metadata (Status, Date Posted) sits below the title in **label-caps** using the Brass accent.

### Multi-Tab Sub-Navigation
Tabs are strictly text-based with no containers. An active state is indicated by a 2px bottom border in **Brass** (#C5A267). Inactive tabs use `text_secondary`. Hover states transition text to `text_primary`.

### Buttons
- **Primary:** Solid **Brass** background with dark text. 4px radius.
- **Secondary:** Transparent background with a 1px border of `accent_secondary` (Sage).
- **Ghost:** No border, `text_secondary` which shifts to `text_primary` on hover.

### Candidate Cards
Cards should be flat with a 1px border (`border` token). Avoid shadows. The candidate's name should be in a small serif font, while their current title and data remain in the sans-serif.

### Input Fields
Inputs use a "floating label" style or a very clear top-aligned label in **label-caps**. The background is slightly darker than the surface in dark mode, and slightly grayer in light mode.