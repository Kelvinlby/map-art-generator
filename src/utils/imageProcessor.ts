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
      blocks: msg.blocks,
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

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No 2D context');

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

  ctx.filter = `hue-rotate(${filterHue}deg) saturate(${filterSaturation}%) contrast(${filterContrast}%) brightness(${filterBrightness}%)`;
  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
  ctx.filter = 'none';

  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const pixelsBuf = imageData.data.buffer;

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
