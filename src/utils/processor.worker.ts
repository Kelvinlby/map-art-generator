/// <reference lib="webworker" />
import { CARPET_PALETTE } from './colors';
import { ProcessSettings } from '../types';

function rgb2lab(r: number, g: number, b: number): [number, number, number] {
  let r_ = r / 255, g_ = g / 255, b_ = b / 255;
  r_ = r_ > 0.04045 ? Math.pow((r_ + 0.055) / 1.055, 2.4) : r_ / 12.92;
  g_ = g_ > 0.04045 ? Math.pow((g_ + 0.055) / 1.055, 2.4) : g_ / 12.92;
  b_ = b_ > 0.04045 ? Math.pow((b_ + 0.055) / 1.055, 2.4) : b_ / 12.92;

  let x = (r_ * 0.4124 + g_ * 0.3576 + b_ * 0.1805) / 0.95047;
  let y = (r_ * 0.2126 + g_ * 0.7152 + b_ * 0.0722) / 1.00000;
  let z = (r_ * 0.0193 + g_ * 0.1192 + b_ * 0.9505) / 1.08883;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)];
}

const PALETTE_WITH_LAB = CARPET_PALETTE.map(c => ({
  ...c,
  lab: rgb2lab(c.base[0], c.base[1], c.base[2]),
}));

interface JobRequest {
  type: 'process';
  jobId: number;
  width: number;
  height: number;
  pixels: ArrayBuffer;
  settings: ProcessSettings;
}

interface CancelRequest {
  type: 'cancel';
  jobId: number;
}

type Incoming = JobRequest | CancelRequest;

let currentJobId = -1;

self.onmessage = (e: MessageEvent<Incoming>) => {
  const msg = e.data;
  if (msg.type === 'cancel') {
    if (msg.jobId === currentJobId) currentJobId = -1;
    return;
  }

  currentJobId = msg.jobId;
  const { jobId, width, height, pixels, settings } = msg;
  const data = new Uint8ClampedArray(pixels);

  const tempScale = (settings.temperature || 0) / 100;
  const rTemp = tempScale > 0 ? tempScale * 40 : 0;
  const bTemp = tempScale < 0 ? -tempScale * 40 : 0;
  const hlFactor = (settings.highlights || 0) / 100;
  const shFactor = (settings.shadows || 0) / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r += rTemp;
    b += bTemp;

    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (luma > 128) {
      const fraction = (luma - 128) / 127;
      if (hlFactor > 0) {
        r += (255 - r) * hlFactor * fraction;
        g += (255 - g) * hlFactor * fraction;
        b += (255 - b) * hlFactor * fraction;
      } else {
        r += (r - 128) * hlFactor * fraction;
        g += (g - 128) * hlFactor * fraction;
        b += (b - 128) * hlFactor * fraction;
      }
    } else {
      const fraction = (128 - luma) / 128;
      if (shFactor > 0) {
        r += (128 - r) * shFactor * fraction;
        g += (128 - g) * shFactor * fraction;
        b += (128 - b) * shFactor * fraction;
      } else {
        r += r * shFactor * fraction;
        g += g * shFactor * fraction;
        b += b * shFactor * fraction;
      }
    }

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  if (jobId !== currentJobId) return;

  if ((settings.sharpness || 0) > 0) {
    const mix = settings.sharpness / 100;
    const copy = new Uint8ClampedArray(data);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const t = ((y - 1) * width + x) * 4;
        const bIdx = ((y + 1) * width + x) * 4;
        const l = (y * width + (x - 1)) * 4;
        const r = (y * width + (x + 1)) * 4;
        for (let c = 0; c < 3; c++) {
          const val = 5 * copy[idx + c] - copy[t + c] - copy[bIdx + c] - copy[l + c] - copy[r + c];
          const newColor = Math.min(255, Math.max(0, val));
          data[idx + c] = copy[idx + c] * (1 - mix) + newColor * mix;
        }
      }
    }
  }

  if (jobId !== currentJobId) return;

  const materials: Record<string, number> = {};
  PALETTE_WITH_LAB.forEach(c => (materials[c.id] = 0));
  const blocks: string[] = new Array(width * height);

  const useLab = settings.colorMetric !== 'rgb';

  const getClosestColor = (r: number, g: number, b: number) => {
    let minDist = Infinity;
    let bestIdx = 0;
    let labCache: [number, number, number] | null = null;
    for (let i = 0; i < PALETTE_WITH_LAB.length; i++) {
      const color = PALETTE_WITH_LAB[i];
      let dist;
      if (!useLab) {
        const dr = r - color.base[0], dg = g - color.base[1], db = b - color.base[2];
        dist = dr * dr + dg * dg + db * db;
      } else {
        if (!labCache) labCache = rgb2lab(r, g, b);
        const dl = labCache[0] - color.lab[0];
        const da = labCache[1] - color.lab[1];
        const dbv = labCache[2] - color.lab[2];
        dist = dl * dl + da * da + dbv * dbv;
      }
      if (dist < minDist) { minDist = dist; bestIdx = i; }
    }
    return PALETTE_WITH_LAB[bestIdx];
  };

  const distributeError = (x: number, y: number, errR: number, errG: number, errB: number, factor: number) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const idx = (y * width + x) * 4;
      data[idx]     = Math.min(255, Math.max(0, data[idx]     + errR * factor));
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + errG * factor));
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + errB * factor));
    }
  };

  const CANCEL_CHECK_ROWS = 16;

  if (settings.dithering === 'none') {
    for (let i = 0; i < data.length; i += 4) {
      const closest = getClosestColor(data[i], data[i + 1], data[i + 2]);
      data[i] = closest.base[0]; data[i + 1] = closest.base[1]; data[i + 2] = closest.base[2];
      materials[closest.id]++;
      blocks[i / 4] = closest.id;
    }
  } else {
    for (let y = 0; y < height; y++) {
      if ((y % CANCEL_CHECK_ROWS) === 0 && jobId !== currentJobId) return;
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const closest = getClosestColor(r, g, b);
        data[i] = closest.base[0]; data[i + 1] = closest.base[1]; data[i + 2] = closest.base[2];
        materials[closest.id]++;
        blocks[y * width + x] = closest.id;

        const errR = r - closest.base[0];
        const errG = g - closest.base[1];
        const errB = b - closest.base[2];

        if (settings.dithering === 'floyd-steinberg') {
          distributeError(x + 1, y,     errR, errG, errB, 7 / 16);
          distributeError(x - 1, y + 1, errR, errG, errB, 3 / 16);
          distributeError(x,     y + 1, errR, errG, errB, 5 / 16);
          distributeError(x + 1, y + 1, errR, errG, errB, 1 / 16);
        } else if (settings.dithering === 'atkinson') {
          distributeError(x + 1, y,     errR, errG, errB, 1 / 8);
          distributeError(x + 2, y,     errR, errG, errB, 1 / 8);
          distributeError(x - 1, y + 1, errR, errG, errB, 1 / 8);
          distributeError(x,     y + 1, errR, errG, errB, 1 / 8);
          distributeError(x + 1, y + 1, errR, errG, errB, 1 / 8);
          distributeError(x,     y + 2, errR, errG, errB, 1 / 8);
        }
      }
    }
  }

  if (jobId !== currentJobId) return;

  const buf = data.buffer;
  (self as unknown as Worker).postMessage(
    { type: 'done', jobId, width, height, pixels: buf, blocks, materials },
    [buf]
  );
};

export {};
