export interface BlockColor {
  name: string;
  item: string; // full Minecraft item ID, e.g. "minecraft:red_carpet"
  base: [number, number, number]; // RGB
  hex: string;
}

export interface CarpetColor extends BlockColor {}

import type { MaterialFilterValue } from './utils/colors';

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
}

export interface ProcessResult {
  pixels: Uint8ClampedArray;
  materials: Record<string, number>;
  width: number;
  height: number;
  gridX: number;
  gridY: number;
  blocks: string[];
}
