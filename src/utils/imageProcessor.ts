import { ProcessResult, ProcessSettings } from '../types';

let worker: Worker | null = null;
let nextJobId = 0;
const pending = new Map<number, { resolve: (r: ProcessResult) => void; reject: (e: Error) => void; gridX: number; gridY: number }>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./processor.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent) => {
    const msg = e.data;
    if (msg.type !== 'done') return;
    const entry = pending.get(msg.jobId);
    if (!entry) return;
    pending.delete(msg.jobId);
    entry.resolve({
      pixels: new Uint8ClampedArray(msg.pixels),
      materials: msg.materials,
      blocks: new Uint16Array(msg.blocks),
      palette: msg.palette,
      width: msg.width,
      height: msg.height,
      gridX: entry.gridX,
      gridY: entry.gridY,
    });
  };
  worker.onerror = (e) => {
    pending.forEach(p => p.reject(new Error(e.message || 'Worker error')));
    pending.clear();
  };
  return worker;
}

const imgCache = new Map<string, HTMLImageElement>();
function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imgCache.get(src);
  if (cached && cached.complete && cached.naturalWidth > 0) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => { imgCache.set(src, img); resolve(img); };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

export function cancelPendingJobs() {
  if (!worker) return;
  for (const jobId of pending.keys()) {
    worker.postMessage({ type: 'cancel', jobId });
  }
  pending.clear();
}

export async function processImage(
  imageSrc: string,
  settings: ProcessSettings
): Promise<ProcessResult> {
  const img = await loadImage(imageSrc);

  const mapSize = 128;
  const targetWidth = mapSize * settings.gridX;
  const targetHeight = mapSize * settings.gridY;

  const targetAspect = targetWidth / targetHeight;
  const imgAspect = img.width / img.height;
  let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
  if (imgAspect > targetAspect) {
    sWidth = img.height * targetAspect;
    sx = (img.width - sWidth) / 2;
  } else {
    sHeight = img.width / targetAspect;
    sy = (img.height - sHeight) / 2;
  }

  const filterSaturation = 100 + (settings.saturation || 0);
  const filterContrast = 100 + (settings.contrast || 0);
  const filterHue = settings.hue || 0;
  const filterBrightness = 100 + (settings.exposure || 0);
  const filterStr = `hue-rotate(${filterHue}deg) saturate(${filterSaturation}%) contrast(${filterContrast}%) brightness(${filterBrightness}%)`;

  // Allocate the full pixel buffer directly as a typed array. Going through a
  // single targetWidth×targetHeight canvas blows past browser ImageData limits
  // for large grids (~12.8k×12.8k = 655 MB), failing with RangeError. Instead
  // we draw the image one map-tile at a time into a tiny reusable 128×128
  // staging canvas and copy each tile's pixels into the full buffer.
  const totalPixels = targetWidth * targetHeight;
  const fullPixels = new Uint8ClampedArray(totalPixels * 4);

  const tile = document.createElement('canvas');
  tile.width = mapSize;
  tile.height = mapSize;
  const tileCtx = tile.getContext('2d', { willReadFrequently: true });
  if (!tileCtx) throw new Error('No 2D context');
  tileCtx.filter = filterStr;

  const srcTileW = sWidth / settings.gridX;
  const srcTileH = sHeight / settings.gridY;

  for (let my = 0; my < settings.gridY; my++) {
    for (let mx = 0; mx < settings.gridX; mx++) {
      tileCtx.clearRect(0, 0, mapSize, mapSize);
      tileCtx.drawImage(
        img,
        sx + mx * srcTileW, sy + my * srcTileH, srcTileW, srcTileH,
        0, 0, mapSize, mapSize,
      );
      const tileData = tileCtx.getImageData(0, 0, mapSize, mapSize).data;
      const dstX = mx * mapSize;
      const dstY = my * mapSize;
      for (let row = 0; row < mapSize; row++) {
        const srcOff = row * mapSize * 4;
        const dstOff = ((dstY + row) * targetWidth + dstX) * 4;
        fullPixels.set(tileData.subarray(srcOff, srcOff + mapSize * 4), dstOff);
      }
    }
  }

  const pixelsBuf = fullPixels.buffer;

  cancelPendingJobs();
  const w = getWorker();
  const jobId = nextJobId++;

  return new Promise<ProcessResult>((resolve, reject) => {
    pending.set(jobId, { resolve, reject, gridX: settings.gridX, gridY: settings.gridY });
    w.postMessage(
      {
        type: 'process',
        jobId,
        width: targetWidth,
        height: targetHeight,
        pixels: pixelsBuf,
        settings,
      },
      [pixelsBuf]
    );
  });
}

// Browser canvases cap out well below 16k×16k for ImageData / toDataURL. If
// dimensions exceed the safe threshold the caller must use pixelsToTilePngs
// to assemble a ZIP of per-tile PNGs instead.
export const MAX_SINGLE_PNG_DIM = 8192;

export function pixelsToDataURL(pixels: Uint8ClampedArray, width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const imgData = new ImageData(new Uint8ClampedArray(pixels), width, height);
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

export async function pixelsToTileBlobs(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  gridX: number,
  gridY: number,
): Promise<{ mapX: number; mapY: number; blob: Blob }[]> {
  const mapSize = 128;
  const tile = document.createElement('canvas');
  tile.width = mapSize;
  tile.height = mapSize;
  const ctx = tile.getContext('2d');
  if (!ctx) return [];

  const out: { mapX: number; mapY: number; blob: Blob }[] = [];
  for (let my = 0; my < gridY; my++) {
    for (let mx = 0; mx < gridX; mx++) {
      const tileData = ctx.createImageData(mapSize, mapSize);
      const startX = mx * mapSize;
      const startY = my * mapSize;
      for (let row = 0; row < mapSize; row++) {
        const srcOff = ((startY + row) * width + startX) * 4;
        const dstOff = row * mapSize * 4;
        tileData.data.set(pixels.subarray(srcOff, srcOff + mapSize * 4), dstOff);
      }
      ctx.putImageData(tileData, 0, 0);
      const blob: Blob = await new Promise(resolve =>
        tile.toBlob(b => resolve(b!), 'image/png'),
      );
      out.push({ mapX: mx, mapY: my, blob });
    }
  }
  return out;
}
