---
name: HireGenie AI Operating System
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
  tertiary: '#ffbba1'
  on-tertiary: '#552008'
  tertiary-container: '#ee9b7a'
  on-tertiary-container: '#6c3218'
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
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb599'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#71361c'
  background: '#131311'
  on-background: '#e5e2de'
  surface-variant: '#353532'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  mono-label:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1'
    letterSpacing: '0'
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
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system embodies a "Quiet Luxury" aesthetic for high-stakes enterprise recruitment. It moves away from generic SaaS blues toward a sophisticated, editorial-inspired palette that signals maturity, intelligence, and human-centricity. 

The style is **Cinematic Minimalism**: a focus on high-contrast typography, ample negative space, and precise lighting. It avoids decorative glassmorphism in favor of solid, structured surfaces that feel physical and grounded. The interface should feel like an elite workspace where AI handles the complexity, presenting only the most critical, legible information to the recruiter.

## Colors
This design system utilizes a warm, dark-mode foundation to reduce eye strain during long-form recruitment workflows. 

- **Foundation:** The "Warm Graphite" (#11110F) provides a cinematic depth that is softer than pure black.
- **Accents:** Muted Brass (#D6A85F) is used sparingly for primary actions and "AIGC" (AI-Generated Content) highlights. Dusty Sage (#79A89A) represents "Success" states and human-verified data. Terracotta (#C97C5D) is reserved for highlighting talent "Sparks" or urgent opportunities.
- **Interaction:** Use subtle shifts in surface luminance (moving from Background to Elevated Surface) to indicate interactivity rather than heavy color fills.

## Typography
The system uses **Hanken Grotesk** for its contemporary, sharp geometric qualities that maintain a human touch. 

- **Editorial Scale:** Large display sizes should use tighter letter-spacing and heavier weights to create an authoritative, headline feel.
- **Information Density:** For technical data (candidate IDs, timestamps), Geist Mono is permitted in small sizes to provide a "system-level" feel.
- **Hierarchy:** Use the "Warm Ivory" for headings and "Muted Stone" for body text to create a clear visual path. Never use pure white for text to maintain the "warm" aesthetic.

## Layout & Spacing
The layout follows a strict **12-column fixed-width grid** for desktop dashboards, transitioning to a fluid container for content-heavy views like candidate resumes or AI chat interfaces.

- **Rhythm:** An 8px-based grid drives all spacing, but 4px increments are allowed for tight component-level detailing (e.g., icon-to-text).
- **Whitespace:** Emphasize generous margins (48px+) at the edges of the screen to create the "editorial" feel. Content should never feel cramped; if density is required, use clear structural dividers rather than reducing padding.
- **Adaptation:** On mobile, margins reduce to 16px and the 12-column grid collapses to a single column with vertical stacks.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Micro-Borders** rather than traditional shadows.

- **The Layering Logic:** 
    - Level 0: Background (#11110F) - The canvas.
    - Level 1: Surface (#181815) - Primary cards and sidebars.
    - Level 2: Elevated Surface (#20201C) - Modals, popovers, and active states.
- **The "Brim" Technique:** Use a 1px solid border (#2A2A25) on all containers. For elevated elements, add a 1px top-border in a slightly lighter shade (#33332D) to simulate a subtle light source hitting the top edge. 
- **Shadows:** If used for modals, use a large, 64px blur with 40% opacity, utilizing a dark tint (#000000) to create a "void" effect behind the element.

## Shapes
To maintain a professional, architectural feel, the system uses a **Soft (0.25rem)** roundedness. 

- **Strictness:** Buttons and input fields should strictly adhere to the 4px (0.25rem) radius. 
- **Exceptions:** Large layout containers (like the main workspace card) may use `rounded-lg` (8px) to soften the overall frame, but nested elements must remain at the base 4px radius to ensure a crisp, high-end appearance.

## Components
- **Buttons:** Primary buttons use a Muted Brass (#D6A85F) background with black text. Secondary buttons use a transparent background with a 1px border (#2A2A25) and Ivory text. No gradients.
- **Inputs:** Input fields are Surface (#181815) with a 1px border. On focus, the border changes to Brass (#D6A85F) with a subtle 2px outer glow of the same color at 20% opacity.
- **Chips/Badges:** Use "Dusty Sage" (#79A89A) for positive status (e.g., "Highly Qualified") with a low-opacity background (10%) and solid text color.
- **Cards:** Cards should not have shadows. They are defined by their #181815 background and a #2A2A25 border. 
- **AI "Genie" Elements:** Any AI-driven suggestion should be wrapped in a subtle 1px border using the "Terracotta" (#C97C5D) accent to differentiate automated insights from human data.
- **Lists:** Use "Muted Stone" for dividers at 0.5px thickness. Ensure high vertical padding (16px+) between list items to maintain the editorial rhythm.