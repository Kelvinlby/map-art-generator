import type { ColorBandKey, ColorHslSettings } from '../types';

export interface ColorBand {
  key: ColorBandKey;
  label: string;
  hueDeg: number;
  swatch: string;
}

// Capture One's 8 classical hue bands. Centers are non-uniform to match
// perceptual spacing — closer through red→yellow where the eye is more sensitive.
export const COLOR_BANDS: ColorBand[] = [
  { key: 'red',     label: 'Red',     hueDeg:   0, swatch: '#ff3b30' },
  { key: 'orange',  label: 'Orange',  hueDeg:  30, swatch: '#ff9500' },
  { key: 'yellow',  label: 'Yellow',  hueDeg:  60, swatch: '#ffcc00' },
  { key: 'green',   label: 'Green',   hueDeg: 120, swatch: '#34c759' },
  { key: 'cyan',    label: 'Cyan',    hueDeg: 180, swatch: '#5ac8fa' },
  { key: 'blue',    label: 'Blue',    hueDeg: 220, swatch: '#0a84ff' },
  { key: 'purple',  label: 'Purple',  hueDeg: 280, swatch: '#af52de' },
  { key: 'magenta', label: 'Magenta', hueDeg: 320, swatch: '#ff2d92' },
];

export const DEFAULT_COLOR_HSL: ColorHslSettings = COLOR_BANDS.reduce(
  (acc, b) => {
    acc[b.key] = { h: 0, s: 0, l: 0 };
    return acc;
  },
  {} as ColorHslSettings,
);
