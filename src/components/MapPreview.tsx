import React, { useEffect, useRef } from 'react';
import { ProcessResult } from '../types';
import { Loader2, Download, Grid, Image as ImageIcon } from 'lucide-react';
import JSZip from 'jszip';
import { pixelsToDataURL } from '../utils/imageProcessor';

interface Props {
  result: ProcessResult | null;
  isProcessing: boolean;
  fileName: string;
}

export function MapPreview({ result, isProcessing, fileName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!result || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = result.width;
    canvas.height = result.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = new ImageData(new Uint8ClampedArray(result.pixels), result.width, result.height);
    ctx.putImageData(imgData, 0, 0);
  }, [result]);

  const handleDownloadPNG = () => {
    if (!result) return;
    const url = pixelsToDataURL(result.pixels, result.width, result.height);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_preview.png`;
    a.click();
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
          zip.file(`${fileName}_${mapX}-${mapY}.json`, JSON.stringify(json, null, 2));
        }
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadFile(`${fileName}_schematics.zip`, blob, 'application/zip');
    }
  };

  const generateMapJson = (mapX: number, mapY: number) => {
    const json: Record<string, string> = {};
    const mapSize = 128;
    const startX = mapX * mapSize;
    const startY = mapY * mapSize;

    for (let y = 0; y < mapSize; y++) {
      for (let x = 0; x < mapSize; x++) {
        const globalX = startX + x;
        const globalY = startY + y;
        json[`(${x}, ${y})`] = result!.blocks[globalY * result!.width + globalX];
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
              <Download className="w-4 h-4" />
              <span>Schematics</span>
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
            <div className="text-slate-600 text-sm flex flex-col items-center space-y-3">
              <div className="w-16 h-16 border-2 border-dashed border-slate-700 rounded-lg opacity-50"></div>
              <span>Awaiting image input...</span>
            </div>
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
