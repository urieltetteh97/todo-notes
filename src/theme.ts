// Purple palette from the approved wireframes.
export const colors = {
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

export const radius = { chip: 22, card: 14, input: 12, button: 12 } as const;

// Smallest comfortable touch target.
export const HIT = 44;
