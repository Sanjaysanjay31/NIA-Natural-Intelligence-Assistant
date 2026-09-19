/**
 * NIA Design System Tokens
 * Dark cinematic palette with restrained energy/cyan/purple glow
 */
export const colors = {
  background: {
    base: '#0A0B10',
    surface: '#12141F',
    elevated: '#1A1D2D',
    overlay: 'rgba(10, 11, 16, 0.85)',
  },
  primary: {
    cyan: '#00F0FF',
    electricBlue: '#3B82F6',
    neonPurple: '#8B5CF6',
  },
  accent: {
    amberDrift: '#F59E0B',
    dangerRed: '#EF4444',
    successGreen: '#10B981',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#94A3B8',
    muted: '#64748B',
    inverse: '#0A0B10',
  },
  border: {
    subtle: 'rgba(148, 163, 184, 0.12)',
    focus: 'rgba(0, 240, 255, 0.4)',
    glow: 'rgba(0, 240, 255, 0.25)',
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

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'Courier',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
} as const;
