/**
 * NIA Design System Tokens - Premium Dark Cinematic Base
 * Atmospheric Cyan/Blue/Purple palette with restrained glow and strict surface hierarchy.
 */

export const colors = {
  background: {
    base: '#07080D',        // Deepest cosmic black
    surface: '#0E111C',     // Elevated card/component surface
    elevated: '#161A2B',    // Highlighted card / active modal
    overlay: 'rgba(7, 8, 13, 0.88)',
    glass: 'rgba(22, 26, 43, 0.65)',
  },
  primary: {
    cyan: '#00F0FF',        // Reality verified / Primary energetic focal
    cyanMuted: 'rgba(0, 240, 255, 0.18)',
    electricBlue: '#3B82F6',
    neonPurple: '#8B5CF6',
    purpleMuted: 'rgba(139, 92, 246, 0.20)',
  },
  accent: {
    amberDrift: '#F59E0B',  // Reality Drift detected warning
    amberMuted: 'rgba(245, 158, 11, 0.18)',
    dangerRed: '#EF4444',   // Action rejection / error
    successGreen: '#10B981',// Safe action executed / verified
    successMuted: 'rgba(16, 185, 129, 0.18)',
  },
  text: {
    primary: '#F8FAFC',     // Crisp high-contrast heading/body
    secondary: '#94A3B8',   // Descriptive and metadata text
    muted: '#64748B',       // De-emphasized labels and timestamps
    inverse: '#07080D',
  },
  border: {
    subtle: 'rgba(148, 163, 184, 0.12)',
    elevated: 'rgba(148, 163, 184, 0.22)',
    focus: 'rgba(0, 240, 255, 0.5)',
    glowCyan: 'rgba(0, 240, 255, 0.3)',
    glowAmber: 'rgba(245, 158, 11, 0.4)',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

export const opacity = {
  disabled: 0.4,
  subtle: 0.7,
  active: 1.0,
} as const;

export const motion = {
  duration: {
    instant: 150,
    quick: 250,
    normal: 400,
    slow: 800,
    pulse: 2000,
  },
} as const;

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'Courier',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 36,
  },
  lineHeight: {
    xs: 14,
    sm: 18,
    md: 22,
    lg: 26,
    xl: 30,
    xxl: 36,
  },
} as const;
