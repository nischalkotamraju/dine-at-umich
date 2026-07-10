export const COLORS = {
  'um-maize': '#FFCB05',
  'um-blue': '#00274C',
  'um-grey': '#333F48',
  'um-grey-dark-mode': '#9CA3AF',
  'status-open': '#22c55e',
  'status-closed': '#ef4444',
};

// Maize (um-maize) is the app's accent color in dark mode, but on light
// backgrounds it washes out — so in light mode the accent becomes Michigan's
// blue (um-blue) instead. Use these anywhere the maize accent was previously
// hardcoded.
export function getAccent(isDarkMode: boolean): string {
  return isDarkMode ? COLORS['um-maize'] : COLORS['um-blue'];
}

export function getAccentTint(isDarkMode: boolean): string {
  return isDarkMode ? 'rgba(255,203,5,0.15)' : 'rgba(0,39,76,0.1)';
}
