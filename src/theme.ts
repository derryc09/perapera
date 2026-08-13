// Design tokens for PeraPera — single source of truth for colors & fonts.
export const theme = {
  bg: '#e7ddcd',
  paper: '#f6f0e4',
  surface: '#fbf7ec',
  ink: '#2a2620',
  ink2: '#6f6557',
  accent: '#c5452c',
  accentD: '#a5371f',
  line: '#ddd0bb',
  line2: '#ebe1cf',
  white: '#ffffff',

  accentSoft: '#fbeee9',
  accentSoftBorder: '#e9b9ad',
  success: '#5a8a55',
  successBg: '#eef3ee',
  successBorder: '#bcd0b9',

  // familiarity levels
  lv: {
    new: '#9a9082',
    learning: '#c5452c',
    familiar: '#cd8f2e',
    strong: '#5a8a55',
    mastered: '#b08a3c',
  },
  // rating buttons
  rate: {
    again: '#c5452c',
    hard: '#cd8f2e',
    good: '#5a8a55',
    easy: '#3f7a8c',
  },
} as const;

// Font family names — these must match the keys passed to useFonts() in app/_layout.tsx
export const fonts = {
  jp: 'KleeOne_600SemiBold',        // Japanese headwords (textbook-handwriting style)
  jpRegular: 'KleeOne_400Regular',
  display: 'Fraunces_600SemiBold',  // big numbers / display text
  displayMd: 'Fraunces_500Medium',
} as const;
