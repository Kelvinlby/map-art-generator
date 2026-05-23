export interface BlockColor {
  id: string;
  name: string;
  base: [number, number, number]; // RGB
  hex: string;
}

export interface CarpetColor extends BlockColor {}

export interface ProcessSettings {
  gridX: number;
  gridY: number;
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
