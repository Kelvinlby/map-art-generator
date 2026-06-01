import React, { useEffect, useRef } from 'react';
import { ProcessResult } from '../types';
import { Loader2, FileJson, Grid, Image as ImageIcon, Boxes, AlertTriangle } from 'lucide-react';
import JSZip from 'jszip';
import { pixelsToDataURL, pixelsToTileBlobs, MAX_SINGLE_PNG_DIM } from '../utils/imageProcessor';
import { generateStructureNbt } from '../utils/nbtExporter';
import type { MaterialFilterValue } from '../utils/colors';

interface Props {
  result: ProcessResult | null;
  isProcessing: boolean;
  fileName: string;
  materials: MaterialFilterValue;
  error?: string | null;
}

export function MapPreview({ result, isProcessing, fileName, materials, error }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!result || !canvasRef.current) return;
    const canvas = canvasRef.current;

    // Cap the on-screen preview canvas. The full result can be 12.8k×12.8k+
    // pixels, which exceeds browser canvas/ImageData limits and is also
    // pointless for a viewport-sized preview. We downsample by an integer
    // factor (so the pixelated look is preserved) into a small canvas.
    const MAX_PREVIEW_DIM = 2048;
    const scale = Math.max(
      1,
      Math.ceil(Math.max(result.width, result.height) / MAX_PREVIEW_DIM),
    );
    const previewW = Math.ceil(result.width / scale);
    const previewH = Math.ceil(result.height / scale);
    canvas.width = previewW;
    canvas.height = previewH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (scale === 1) {
      const imgData = new ImageData(new Uint8ClampedArray(result.pixels), result.width, result.height);
      ctx.putImageData(imgData, 0, 0);
      return;
    }

    const out = ctx.createImageData(previewW, previewH);
    const src = result.pixels;
    const W = result.width;
    for (let y = 0; y < previewH; y++) {
      const sy = y * scale;
      for (let x = 0; x < previewW; x++) {
        const sx = x * scale;
        const si = (sy * W + sx) * 4;
        const di = (y * previewW + x) * 4;
        out.data[di]     = src[si];
        out.data[di + 1] = src[si + 1];
        out.data[di + 2] = src[si + 2];
        out.data[di + 3] = src[si + 3];
      }
    }
    ctx.putImageData(out, 0, 0);
  }, [result]);

  const handleDownloadPNG = async () => {
    if (!result) return;
    if (Math.max(result.width, result.height) <= MAX_SINGLE_PNG_DIM) {
      const url = pixelsToDataURL(result.pixels, result.width, result.height);
      if (!url) return;
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}_preview.png`;
      a.click();
      return;
    }
    const tiles = await pixelsToTileBlobs(
      result.pixels, result.width, result.height, result.gridX, result.gridY,
    );
    const zip = new JSZip();
    for (const { mapX, mapY, blob } of tiles) {
      zip.file(`${fileName}_${padCoord(mapX, result.gridX)}-${padCoord(mapY, result.gridY)}.png`, blob);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadFile(`${fileName}_preview.zip`, blob, 'application/zip');
  };

  const handleDownloadSchematics = async () => {
    if (!result) return;

    if (result.gridX === 1 && result.gridY === 1) {
      const json = generateMapJson(0, 0);
      downloadFile(`${fileName}.json`, JSON.stringify(json, null, 2));
    } else {
      const zip = new JSZip();
      for (let mapY = 0; mapY < result.gridY; mapY++) {
        for (let mapX = 0; mapX < result.gridX; mapX++) {
          const json = generateMapJson(mapX, mapY);
          zip.file(`${fileName}_${padCoord(mapX, result.gridX)}-${padCoord(mapY, result.gridY)}.json`, JSON.stringify(json, null, 2));
        }
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadFile(`${fileName}_schematics.zip`, blob, 'application/zip');
    }
  };

  const handleDownloadNbt = async () => {
    if (!result) return;
    const mapSize = 128;

    const buildOne = (mapX: number, mapY: number) => {
      const startX = mapX * mapSize;
      const startY = mapY * mapSize;
      const tile: string[] = new Array(mapSize * mapSize);
      for (let y = 0; y < mapSize; y++) {
        for (let x = 0; x < mapSize; x++) {
          tile[y * mapSize + x] = result.palette[result.blocks[(startY + y) * result.width + (startX + x)]];
        }
      }
      return generateStructureNbt(tile, mapSize, mapSize, materials);
    };

    if (result.gridX === 1 && result.gridY === 1) {
      const nbt = await buildOne(0, 0);
      downloadFile(`${fileName}.nbt`, new Blob([nbt as BlobPart], { type: 'application/octet-stream' }), 'application/octet-stream');
    } else {
      const zip = new JSZip();
      for (let mapY = 0; mapY < result.gridY; mapY++) {
        for (let mapX = 0; mapX < result.gridX; mapX++) {
          const nbt = await buildOne(mapX, mapY);
          zip.file(`${fileName}_${padCoord(mapX, result.gridX)}-${padCoord(mapY, result.gridY)}.nbt`, nbt);
        }
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadFile(`${fileName}_nbt.zip`, blob, 'application/zip');
    }
  };

  const padCoord = (value: number, gridSize: number) =>
    String(value).padStart(String(Math.max(gridSize - 1, 0)).length, '0');

  const generateMapJson = (mapX: number, mapY: number) => {
    const json: Record<string, string> = {};
    const mapSize = 128;
    const startX = mapX * mapSize;
    const startY = mapY * mapSize;

    for (let y = 0; y < mapSize; y++) {
      for (let x = 0; x < mapSize; x++) {
        const globalX = startX + x;
        const globalY = startY + y;
        json[`(${x}, ${y})`] = result!.palette[result!.blocks[globalY * result!.width + globalX]];
      }
    }
    return json;
  };

  const downloadFile = (name: string, content: string | Blob, type = 'application/json') => {
    const blob = typeof content === 'string' ? new Blob([content], { type }) : content;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getGridPreviewStyles = () => {
    if (!result) return {};
    return {
      backgroundImage: `
        linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)
      `,
      backgroundSize: `${100 / result.gridX}% ${100 / result.gridY}%`,
    };
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <h2 className="text-slate-100 font-medium flex items-center gap-2">
           <Grid className="w-5 h-5 text-emerald-500" />
           {result ? `${result.gridX}×${result.gridY} Map Group` : 'Map Preview'}
        </h2>
        {result && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPNG}
              className="flex items-center space-x-2 text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 px-3 py-1.5 rounded-lg transition-all"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={handleDownloadSchematics}
              className="flex items-center space-x-2 text-xs font-medium text-slate-900 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 px-3 py-1.5 rounded-lg transition-all"
            >
              <FileJson className="w-4 h-4" />
              <span>JSON</span>
            </button>
            <button
              onClick={handleDownloadNbt}
              className="flex items-center space-x-2 text-xs font-medium text-slate-900 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 px-3 py-1.5 rounded-lg transition-all"
            >
              <Boxes className="w-4 h-4" />
              <span>NBT</span>
            </button>
          </div>
        )}
      </div>

      <div className="relative w-full mx-auto bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner p-4 min-h-[300px]">
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 space-y-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-slate-400 text-sm font-medium animate-pulse">Processing image...</p>
          </div>
        )}

        {result ? (
          <div
            className="relative"
            style={{
              aspectRatio: `${result.width}/${result.height}`,
              maxWidth: '100%',
              maxHeight: '70vh',
              height: '100%',
            }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ imageRendering: 'pixelated', objectFit: 'contain', display: 'block' }}
            />
            {(result.gridX > 1 || result.gridY > 1) && (
              <div
                className="absolute inset-0 pointer-events-none opacity-50"
                style={getGridPreviewStyles()}
              />
            )}
          </div>
        ) : (
          !isProcessing && (
            error ? (
              <div className="text-sm flex flex-col items-center space-y-3 max-w-md text-center px-4">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
                <div className="text-slate-200 font-medium">Failed to generate map art</div>
                <div className="text-slate-400 text-xs break-words">{error}</div>
                <div className="text-slate-500 text-xs">
                  This usually happens when the grid is very large and the browser can't allocate enough memory. Try reducing the grid dimensions.
                </div>
              </div>
            ) : (
              <div className="text-slate-600 text-sm flex flex-col items-center space-y-3">
                <div className="w-16 h-16 border-2 border-dashed border-slate-700 rounded-lg opacity-50"></div>
                <span>Awaiting image input...</span>
              </div>
            )
          )
        )}
      </div>

      {result && (
        <div className="text-center text-xs text-slate-500 font-mono">
          Final dimensions: {result.width}×{result.height} blocks ({result.gridX * result.gridY} maps total)
        </div>
      )}
    </div>
  );
}
