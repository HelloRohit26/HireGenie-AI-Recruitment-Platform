---
name: HireGenie TalentOS
colors:
  surface: '#131311'
  surface-dim: '#131311'
  surface-bright: '#3a3937'
  surface-container-lowest: '#0e0e0c'
  surface-container-low: '#1c1c19'
  surface-container: '#20201d'
  surface-container-high: '#2a2a28'
  surface-container-highest: '#353532'
  on-surface: '#e5e2de'
  on-surface-variant: '#d2c4b3'
  inverse-surface: '#e5e2de'
  inverse-on-surface: '#31302e'
  outline: '#9b8f7f'
  outline-variant: '#4f4538'
  surface-tint: '#efbf73'
  primary: '#f4c377'
  on-primary: '#432c00'
  primary-container: '#d6a85f'
  on-primary-container: '#5b3d00'
  inverse-primary: '#7c5816'
  secondary: '#a0d0c1'
  on-secondary: '#02382d'
  secondary-container: '#204f43'
  on-secondary-container: '#8fbfb0'
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
  secondary-fixed: '#bceddd'
  secondary-fixed-dim: '#a0d0c1'
  on-secondary-fixed: '#002019'
  on-secondary-fixed-variant: '#204f43'
  tertiary-fixed: '#d3e4ff'
  tertiary-fixed-dim: '#a6c9fa'
  on-tertiary-fixed: '#001c38'
  on-tertiary-fixed-variant: '#234872'
  background: '#131311'
  on-background: '#e5e2de'
  surface-variant: '#353532'
  background-light: '#F4F1E9'
  surface-muted: '#1C1C1A'
  text-primary: '#F4F1E9'
  text-secondary: '#A1A19A'
  border-subtle: '#2A2A28'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
  mono-data:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 32px
  gutter: 16px
  drawer-width: 400px
  header-height: 72px
---

## Brand & Style
The design system embodies a "Cinematic Technical" aesthetic—a sophisticated intersection of high-end editorial design and precise engineering tools. It moves away from the "neon-future" AI tropes, opting instead for a grounded, premium atmosphere that emphasizes human agency over automated mystery.

The style is **Modern Corporate with Editorial refinement**. It utilizes heavy whitespace, high-density data visualizations, and a palette inspired by natural materials (brass, stone, and sage). The emotional response should be one of calm focus and absolute reliability, positioning the platform as a high-performance operating system for talent professionals.

## Colors
The palette is rooted in an ultra-dark "Obsidian" background (`#11110F`), providing a cinematic canvas for high-contrast information.

- **Primary (Muted Brass):** Used for primary actions, success states, and premium highlights. It represents "the gold standard" of talent.
- **Secondary (Muted Sage):** Used for secondary intelligence features, growth metrics, and "human-in-the-loop" indicators.
- **Neutral:** A range of warm grays and off-whites that prevent the interface from feeling "tech-cold."
- **Light Mode:** When toggled, the background shifts to a "Parchment" white (`#F4F1E9`) with deep charcoal text, maintaining the editorial feel.

## Typography
The system uses **Hanken Grotesk** exclusively to maintain a sharp, contemporary professional look. 

The typographic hierarchy is "Numerical-First." In a talent OS, data points (match scores, salaries, dates) should be treated with the same visual weight as headlines. Use `label-caps` for section headers and metadata descriptors to create a clear structural rhythm. Tighten letter spacing on larger displays to enhance the "cinematic" feel.

## Layout & Spacing
The layout uses a **12-column Fixed Grid** for main content areas, centered on desktop with a max-width of 1440px. 

- **Intelligence Drawers:** A signature layout element. These are 400px fixed-width panels that slide from the right, containing contextual AI insights.
- **High-Density Spacing:** Use an 8px base unit. Content-heavy tables should use a "Compact" vertical rhythm (8px padding) while editorial landing areas use "Relaxed" (24px+).
- **Persistent Headers:** Job-specific headers remain sticky to provide constant context during deep-funnel tasks.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Low-Contrast Outlines** rather than traditional shadows.

1.  **Level 0 (Floor):** `#11110F` — The base canvas.
2.  **Level 1 (Cards/Tables):** `#1C1C1A` — Slightly lifted surfaces with a 1px border of `#2A2A28`.
3.  **Level 2 (Modals/Drawers):** Elevated via a subtle "Ambient Glow"—a very low-opacity (10%) shadow tinted with the Primary Brass color to suggest active intelligence.

Avoid heavy blurs; maintain "paper-thin" layers to emphasize the precision of the software.

## Shapes
The shape language is "Restrained Geometric." 

- **Small Components (Tags, Checkboxes):** 6px radius.
- **Standard Components (Buttons, Inputs):** 10px radius.
- **Large Containers (Cards, Drawers):** 14px radius.

This progression ensures that smaller elements feel precise and "tool-like," while larger structural containers feel approachable and modern. Avoid pill-shaped buttons except for specialized "AI Trigger" floating actions.

## Components
- **Buttons:** Primary buttons use a solid Muted Brass with dark text. Secondary buttons use a "Ghost" style with a 1px Sage border.
- **High-Density Tables:** Rows should have a subtle hover state (`#1C1C1A`). Cells containing AI-derived data should be marked with a tiny 4px Sage dot.
- **AI Insight Modules:** Containers with a subtle gradient stroke (Brass to Sage) at 20% opacity. These house "Talent Constellations"—Three.js visualizations of candidate skills.
- **Input Fields:** Flat styling. No background on idle, only a bottom border. On focus, a full 1px border in Brass.
- **Chips/Badges:** Rectangular with 4px corners. Use Sage for "Matched" and Brass for "Top Tier."
- **Contextual Intelligence Drawer:** Should feature a semi-transparent backdrop blur (10px) to maintain a sense of the underlying data while focusing on the insight.