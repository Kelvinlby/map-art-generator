/// <reference lib="webworker" />
import { CARPET_PALETTE, MATERIAL_FILTERS } from './colors';
import { COLOR_BANDS } from './colorBands';
import { ProcessSettings } from '../types';

function rgb2hsl(r: number, g: number, b: number): [number, number, number] {
  const r_ = r / 255, g_ = g / 255, b_ = b / 255;
  const max = Math.max(r_, g_, b_), min = Math.min(r_, g_, b_);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r_) h = ((g_ - b_) / d + (g_ < b_ ? 6 : 0));
  else if (max === g_) h = (b_ - r_) / d + 2;
  else h = (r_ - g_) / d + 4;
  return [h * 60, s, l];
}

function hsl2rgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  const hp = ((h % 360) + 360) % 360 / 60;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (hp < 1) { r1 = c; g1 = x; }
  else if (hp < 2) { r1 = x; g1 = c; }
  else if (hp < 3) { g1 = c; b1 = x; }
  else if (hp < 4) { g1 = x; b1 = c; }
  else if (hp < 5) { r1 = x; b1 = c; }
  else { r1 = c; b1 = x; }
  const m = l - c / 2;
  return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
}

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

  const filter = MATERIAL_FILTERS.find(f => f.value === settings.materials) ?? MATERIAL_FILTERS[0];
  const filtered = PALETTE_WITH_LAB.filter(c => filter.predicate(c.item));
  const activePalette = filtered.length > 0 ? filtered : PALETTE_WITH_LAB;

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

  const colorHsl = settings.colorHsl;
  const bandsActive = colorHsl
    ? COLOR_BANDS.some(b => {
        const a = colorHsl[b.key];
        return a && (a.h !== 0 || a.s !== 0 || a.l !== 0);
      })
    : false;

  if (bandsActive) {
    const N = COLOR_BANDS.length;
    const centers = new Float32Array(N);
    const adjH = new Float32Array(N);
    const adjS = new Float32Array(N);
    const adjL = new Float32Array(N);
    for (let k = 0; k < N; k++) {
      const band = COLOR_BANDS[k];
      const a = colorHsl[band.key];
      centers[k] = band.hueDeg;
      adjH[k] = a.h;
      adjS[k] = a.s;
      adjL[k] = a.l;
    }
    const SIGMA = 30;
    const INV_2SIGMA2 = 1 / (2 * SIGMA * SIGMA);
    const HUE_RANGE_DEG = 60; // slider ±100 maps to ±60°

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const [h, s, l] = rgb2hsl(r, g, b);

      // Skip near-gray pixels: hue is unstable and per-color adjustments
      // should not affect achromatic regions.
      if (s < 0.04) continue;

      let wSum = 0, dh = 0, ds = 0, dl = 0;
      for (let k = 0; k < N; k++) {
        let d = Math.abs(h - centers[k]);
        if (d > 180) d = 360 - d;
        const w = Math.exp(-(d * d) * INV_2SIGMA2);
        wSum += w;
        dh += w * adjH[k];
        ds += w * adjS[k];
        dl += w * adjL[k];
      }
      if (wSum > 0) {
        dh /= wSum; ds /= wSum; dl /= wSum;
      }

      // Saturation weighting: gray pixels (low s) get less effect, so the
      // adjustment fades to zero smoothly as colors desaturate.
      const satWeight = Math.min(1, s / 0.25);
      dh *= satWeight; ds *= satWeight; dl *= satWeight;

      const newH = h + (dh / 100) * HUE_RANGE_DEG;

      let newS: number;
      if (ds >= 0) newS = s + (1 - s) * (ds / 100);
      else newS = s * (1 + ds / 100);
      if (newS < 0) newS = 0; else if (newS > 1) newS = 1;

      let newL: number;
      if (dl >= 0) newL = l + (1 - l) * (dl / 100);
      else newL = l * (1 + dl / 100);
      if (newL < 0) newL = 0; else if (newL > 1) newL = 1;

      const [nr, ng, nb] = hsl2rgb(newH, newS, newL);
      data[i]     = Math.min(255, Math.max(0, nr));
      data[i + 1] = Math.min(255, Math.max(0, ng));
      data[i + 2] = Math.min(255, Math.max(0, nb));
    }
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
  activePalette.forEach(c => (materials[c.item] = 0));
  // Store block assignments as palette indices in a typed array rather than
  // a string[]. A Uint16Array of size width*height costs 2 bytes per cell and
  // transfers cheaply; a string[] of the same length would either fail to
  // allocate or fail to structured-clone on postMessage at large grids.
  const blocks = new Uint16Array(width * height);
  const palette = activePalette.map(c => c.item);

  const useLab = settings.colorMetric !== 'rgb';

  const getClosestIdx = (r: number, g: number, b: number) => {
    let minDist = Infinity;
    let bestIdx = 0;
    let labCache: [number, number, number] | null = null;
    for (let i = 0; i < activePalette.length; i++) {
      const color = activePalette[i];
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
    return bestIdx;
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
      const idx = getClosestIdx(data[i], data[i + 1], data[i + 2]);
      const closest = activePalette[idx];
      data[i] = closest.base[0]; data[i + 1] = closest.base[1]; data[i + 2] = closest.base[2];
      materials[closest.item]++;
      blocks[i / 4] = idx;
    }
  } else {
    for (let y = 0; y < height; y++) {
      if ((y % CANCEL_CHECK_ROWS) === 0 && jobId !== currentJobId) return;
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const idx = getClosestIdx(r, g, b);
        const closest = activePalette[idx];
        data[i] = closest.base[0]; data[i + 1] = closest.base[1]; data[i + 2] = closest.base[2];
        materials[closest.item]++;
        blocks[y * width + x] = idx;

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

  const pixelsBuf = data.buffer;
  const blocksBuf = blocks.buffer;
  (self as unknown as Worker).postMessage(
    { type: 'done', jobId, width, height, pixels: pixelsBuf, blocks: blocksBuf, palette, materials },
    [pixelsBuf, blocksBuf]
  );
};

export {};
