---
name: HireGenie Candidate Portal
colors:
  surface: '#121412'
  surface-dim: '#121412'
  surface-bright: '#383938'
  surface-container-lowest: '#0d0f0d'
  surface-container-low: '#1a1c1a'
  surface-container: '#1f201e'
  surface-container-high: '#292a29'
  surface-container-highest: '#343533'
  on-surface: '#e3e2df'
  on-surface-variant: '#d2c4b3'
  inverse-surface: '#e3e2df'
  inverse-on-surface: '#2f312f'
  outline: '#9b8f7f'
  outline-variant: '#4f4538'
  surface-tint: '#efbf73'
  primary: '#f4c377'
  on-primary: '#432c00'
  primary-container: '#d6a85f'
  on-primary-container: '#5b3d00'
  inverse-primary: '#7c5816'
  secondary: '#c9c6c2'
  on-secondary: '#31302e'
  secondary-container: '#474744'
  on-secondary-container: '#b7b5b1'
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
  secondary-fixed: '#e5e2de'
  secondary-fixed-dim: '#c9c6c2'
  on-secondary-fixed: '#1c1c19'
  on-secondary-fixed-variant: '#474744'
  tertiary-fixed: '#d3e4ff'
  tertiary-fixed-dim: '#a6c9fa'
  on-tertiary-fixed: '#001c38'
  on-tertiary-fixed-variant: '#234872'
  background: '#121412'
  on-background: '#e3e2df'
  surface-variant: '#343533'
typography:
  display:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '500'
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
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container_max: 1120px
  gutter: 24px
---

## Brand & Style

The design system bridges high-performance AI utility with a premium editorial aesthetic. It transitions the brand from a dense "mission control" tool into a serene, human-centric candidate experience. The personality is sophisticated, encouraging, and transparent, aimed at top-tier talent who value clarity and professional respect.

The style is **Minimalist with Tactile accents**. It leverages expansive whitespace, high-quality typography, and subtle depth to create an environment that feels like a bespoke digital concierge rather than a standard job application portal. The interface prioritizes focus, reducing cognitive load through generous margins and a deliberate lack of decorative clutter.

## Colors

The system operates on a dual-mode foundation: **Warm Graphite** (Dark) and **Warm Pearl** (Light).

- **Primary (#D6A85F):** A muted, metallic gold used sparingly for calls to action, progress indicators, and key highlights. It represents value and achievement.
- **Surface Strategy:** In both modes, the "Bright" surface is used for elevated cards and modals to create a clear visual hierarchy against the base surface.
- **On-Surface:** Typography should avoid pure #000 or #FFF, instead utilizing the softened black (#131311) or the off-white pearl (#F8F7F4) to maintain the warm, organic feel of the brand.

## Typography

Using **Hanken Grotesk** across all levels ensures a clean, contemporary, and highly legible experience. 

- **Editorial Pacing:** Large display sizes use tight tracking and leading for a confident, high-end feel.
- **Readability:** Body copy uses a generous 1.6 line-height to allow text-heavy interview guides and job descriptions to breathe.
- **Labels:** Use uppercase for small labels (tags, overlines) to provide a structural contrast to the sentence-case headlines.

## Layout & Spacing

This design system moves away from high-density grids toward a **centered, editorial-column layout**. 

- **The Focus Column:** Content is primarily housed in a 1120px container. On wider screens, margins expand to maintain focus on the central narrative.
- **Vertical Rhythm:** Use large `xl` (80px) padding between major sections to emphasize the "Premium" feel. 
- **Adaptation:** On mobile, margins reduce to 16px, and vertical spacing shifts from `xl` to `lg` to maintain momentum without feeling cramped.

## Elevation & Depth

Hierarchy is achieved through **Tonal Layering** and **Soft Ambient Shadows**.

- **Level 0 (Surface):** The base background.
- **Level 1 (Surface Bright):** For cards and primary containers. In Dark mode, this is a subtle lift; in Light mode, this is pure white.
- **Shadows:** Use extremely soft, large-radius shadows (24px - 48px blur) with very low opacity (5-8%). Shadow colors should be tinted with the surface color (e.g., a warm brownish-grey shadow) rather than pure black to preserve the "Warm Pearl" or "Warm Graphite" atmosphere.
- **Transitions:** All depth changes (hovering a card, opening a modal) must use a 300ms ease-out duration to feel intentional and smooth.

## Shapes

The shape language is **Soft and Approachable**. 

The base unit is **8px (0.5rem)** for standard components like input fields and small cards. Larger containers (main application panels) should use **16px (1rem)** to emphasize a protective, "contained" feel. Buttons for primary actions should be fully rounded (pill-shaped) to distinguish them from structural layout elements.

## Components

- **Buttons:** 
  - *Primary:* Filled with `#D6A85F`, text in `#131311`. Pill-shaped.
  - *Secondary:* Outlined with a 1px border of the current theme's `outline` color. 
- **Cards:** Use `surface_bright` with a 1px `outline` and the Level 1 shadow. Padding should never be less than `md` (24px).
- **Input Fields:** Minimalist design. In Light mode, use a soft grey background with no border until focus. On focus, a 1px `#D6A85F` border appears.
- **Progress Indicators:** Use the primary accent color. For interview stages, use thin, elegant lines rather than chunky bars to maintain the editorial feel.
- **Chips/Tags:** Small, semi-transparent versions of the primary color with `label-md` typography.
- **Lists:** High-spaced items with subtle separators. Interaction on list items should be a background color shift rather than a heavy shadow.