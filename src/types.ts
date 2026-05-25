export interface BlockColor {
  name: string;
  item: string; // full Minecraft item ID, e.g. "minecraft:red_carpet"
  base: [number, number, number]; // RGB
  hex: string;
}

export interface CarpetColor extends BlockColor {}

import type { MaterialFilterValue } from './utils/colors';

export type ColorBandKey =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'magenta';

export interface ColorBandAdjust {
  h: number; // -100..100, mapped to ±60° hue rotation
  s: number; // -100..100, multiplicative saturation
  l: number; // -100..100, multiplicative lightness
}

export type ColorHslSettings = Record<ColorBandKey, ColorBandAdjust>;

export interface ProcessSettings {
  gridX: number;
  gridY: number;
  materials: MaterialFilterValue;
  dithering: 'none' | 'floyd-steinberg' | 'atkinson';
  colorMetric: 'rgb' | 'cielab';
  saturation: number;
  contrast: number;
  sharpness: number;
  hue: number;
  exposure: number;
  highlights: number;
  shadows: number;
  temperature: number;
  colorHsl: ColorHslSettings;
}

export interface ProcessResult {
  pixels: Uint8ClampedArray;
  materials: Record<string, number>;
  width: number;
  height: number;
  gridX: number;
  gridY: number;
  // blocks[i] is an index into `palette` giving the Minecraft block id for
  // pixel i. Using a typed array keeps the transfer payload small enough for
  // structured-clone at large grid sizes (a string[] of 40M+ entries fails).
  blocks: Uint16Array;
  palette: string[];
}
