---
name: Architectural Precision
colors:
  surface: '#131312'
  surface-dim: '#131312'
  surface-bright: '#393937'
  surface-container-lowest: '#0e0e0d'
  surface-container-low: '#1b1c1a'
  surface-container: '#20201e'
  surface-container-high: '#2a2a28'
  surface-container-highest: '#353533'
  on-surface: '#e5e2df'
  on-surface-variant: '#c4c7c7'
  inverse-surface: '#e5e2df'
  inverse-on-surface: '#30302e'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c8c6c5'
  primary: '#c8c6c5'
  on-primary: '#313030'
  primary-container: '#1a1a1a'
  on-primary-container: '#848282'
  inverse-primary: '#5f5e5e'
  secondary: '#c8c6c2'
  on-secondary: '#30312d'
  secondary-container: '#474743'
  on-secondary-container: '#b6b5b0'
  tertiary: '#d6c4aa'
  on-tertiary: '#3a2f1c'
  tertiary-container: '#221908'
  on-tertiary-container: '#908169'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#e4e2dd'
  secondary-fixed-dim: '#c8c6c2'
  on-secondary-fixed: '#1b1c19'
  on-secondary-fixed-variant: '#474743'
  tertiary-fixed: '#f3e0c4'
  tertiary-fixed-dim: '#d6c4aa'
  on-tertiary-fixed: '#241a09'
  on-tertiary-fixed-variant: '#514531'
  background: '#131312'
  on-background: '#e5e2df'
  surface-variant: '#353533'
typography:
  display-sm:
    fontFamily: Hanken Grotesk
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 32px
  element-gap: 16px
  table-row-height: 48px
  sidebar-width: 240px
  drawer-width: 480px
---

## Brand & Style
The design system for the Recruiter Settings & Administration workspace shifts from the cinematic expansiveness of the Command Center to a focused, **Architectural Minimalism**. The personality is authoritative, precise, and utilitarian, designed for high-stakes configuration and long-duration administrative tasks.

The aesthetic blends **Corporate Modern** with **Technical Brutalism**—using structured grids, hairline borders, and a monochromatic foundation to allow the Muted Brass accents to signify critical actions. The goal is to evoke a sense of absolute control and systemic reliability, where every pixel serves a functional purpose in the tuning of AI agents and team governance.

## Colors
The palette is rooted in **Warm Graphite** (#121211) for deep background surfaces, providing a low-strain environment for complex data management. 

- **Primary (Warm Graphite):** Used for base surfaces and primary containers.
- **Secondary (Warm Pearl):** Reserved for high-contrast typography and essential icons.
- **Tertiary (Muted Brass):** A sophisticated accent for active states, primary buttons, and AI-tuning highlights.
- **Success/Support (Dusty Sage):** Used for verified integration statuses, system health indicators, and "Active" team member states.
- **Neutrals:** Multi-tiered greys with warm undertones are used for hair-line borders and secondary metadata.

## Typography
This design system utilizes **Hanken Grotesk** for its contemporary, sharp terminals that maintain legibility at small scales. 

For the administration workspace, typography is used to create clear information hierarchies within dense tables. **Label-caps** are utilized for table headers and section overlines to provide an editorial feel. A secondary monospaced font (JetBrains Mono) is introduced exclusively for Audit Log timestamps and AI weight values to emphasize technical accuracy.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. The secondary settings navigation is fixed at 240px on the left, while the main configuration area remains fluid with a max-width of 1200px to ensure readability.

- **Data Density:** Tables use a compact 48px row height with 12px horizontal cell padding. 
- **Configuration Modules:** Utilize an 8px grid for internal element alignment (sliders vs labels).
- **Secondary Sidebar:** Contains grouped navigation items with 8px vertical spacing.
- **Drawers:** Slide in from the right, overlaying 40% of the screen, used for specific "Integration Details" or "User Permissions" without losing the main context.

## Elevation & Depth
In this workspace, depth is communicated through **Tonal Layering** rather than heavy shadows. 

- **Surface Level 0:** Warm Graphite base.
- **Surface Level 1:** Neutral Graphite (#1A1A1A) for cards and table headers.
- **Stroke-based Depth:** Hairline borders (1px) in `border_subtle` define containers. 
- **Active State:** A 2px Muted Brass left-border is used to indicate the active navigation item or the selected row in a permission matrix.
- **Drawers:** Use a 40px background blur (backdrop-filter) on the underlying content to focus the user's attention, paired with a soft, 15% opacity black shadow.

## Shapes
The shape language is **Soft (0.25rem)**. This slight rounding prevents the UI from feeling overly aggressive or "unrefined" (Brutalist), maintaining a premium, software-as-a-tool feel. 

- **Buttons & Inputs:** 4px radius.
- **Cards & Modules:** 8px radius.
- **Tags/Status Pills:** Fully rounded (capsule) to differentiate them from interactive buttons.
- **Matrix Intersections:** Sharp 90-degree corners within internal grid lines of the permission matrix to reinforce the sense of a technical grid.

## Components
- **Data-Dense Tables:** Features "Sticky" headers and "Hover-Action" rows. Interaction controls (Edit/Delete) only appear on row hover to reduce visual noise.
- **AI Agent Tuning Sliders:** Custom sliders using Muted Brass for the track. The handle is a 12px square with a 1px Pearl border. Value tooltips are persistent during interaction.
- **Weight Matrices:** A grid-based component where cells are color-coded based on influence (Muted Brass for high weight, Warm Graphite for neutral).
- **Permission Matrix:** A cross-functional grid. Rows represent roles, columns represent capabilities. Uses a custom "Checkbox-Lite"—a simple 14px square that fills with Brass when active.
- **Inline Refined Forms:** Form fields appear as plain text with a subtle underline. On focus, they transition into a defined box with a Muted Brass border.
- **Settings Secondary Sidebar:** Features "Section Headers" in `label-caps` and "Navigation Links" with a subtle hover state shift from Grey to Warm Pearl.
- **Integration Drawers:** Right-aligned panels containing vertical progress steppers for setup and YAML-friendly code blocks for API configurations.