// Purple palette from the approved wireframes.
export const lightColors = {
  ink: '#1E1233',
  muted: '#4C3F6B',
  primary: '#A78BFA', // buttons, selected controls, toggles on
  accent: '#6D28D9', // headings, icons, links, active tab
  border: '#D4C9F0',
  divider: '#E6DEF7',
  soft: '#F3F0FF', // chips, input fills
  softAlt: '#FAF5FF',
  chipBorder: '#C4B5FD',
  pill: '#F5D0FE',
  trackOff: '#D4C9F0',
  white: '#FFFFFF',
  overlay: 'rgba(30, 18, 51, 0.45)',
  gradientFrom: '#DDD6FE',
  gradientTo: '#F5D0FE',
} as const;

export const darkColors: ThemeColors = {
  ink: '#F4EEFF',
  muted: '#B9ACCD',
  primary: '#A78BFA',
  accent: '#C4B5FD',
  border: '#493B60',
  divider: '#30253F',
  soft: '#292137',
  softAlt: '#211A2D',
  chipBorder: '#76629B',
  pill: '#5B3063',
  trackOff: '#594E67',
  white: '#17121F',
  overlay: 'rgba(0, 0, 0, 0.62)',
  gradientFrom: '#302344',
  gradientTo: '#42243E',
};

export type ThemeColors = { [K in keyof typeof lightColors]: string };

export const radius = { chip: 22, card: 14, input: 12, button: 12 } as const;

// Smallest comfortable touch target.
export const HIT = 44;
