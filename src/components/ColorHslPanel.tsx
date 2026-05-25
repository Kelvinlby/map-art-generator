import React from 'react';
import { Palette, RotateCcw } from 'lucide-react';
import { COLOR_BANDS } from '../utils/colorBands';
import type { ColorBandAdjust, ColorBandKey, ColorHslSettings } from '../types';

interface MiniSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

const MiniSlider = ({ label, value, onChange, min = -100, max = 100 }: MiniSliderProps) => {
  const isDefault = value === 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wide text-slate-500 w-3">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        onDoubleClick={() => onChange(0)}
        className="flex-1 accent-emerald-500 bg-slate-800 rounded-lg h-1.5 outline-none cursor-pointer"
      />
      <span className="text-[10px] text-emerald-400 w-8 text-right tabular-nums">
        {value > 0 ? '+' : ''}{value}
      </span>
      <button
        type="button"
        onClick={() => onChange(0)}
        disabled={isDefault}
        title={`Reset ${label}`}
        aria-label={`Reset ${label}`}
        className="text-slate-600 hover:text-emerald-400 disabled:opacity-30 disabled:hover:text-slate-600 disabled:cursor-default transition-colors"
      >
        <RotateCcw className="w-3 h-3" />
      </button>
    </div>
  );
};

interface ColorHslPanelProps {
  value: ColorHslSettings;
  onChange: (band: ColorBandKey, channel: keyof ColorBandAdjust, value: number) => void;
  onResetBand: (band: ColorBandKey) => void;
  onResetAll: () => void;
}

export const ColorHslPanel = ({ value, onChange, onResetBand, onResetAll }: ColorHslPanelProps) => {
  const anyActive = COLOR_BANDS.some(b => {
    const a = value[b.key];
    return a.h !== 0 || a.s !== 0 || a.l !== 0;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/50">
        <div className="flex items-center space-x-2 text-slate-100 font-medium">
          <Palette className="w-5 h-5 text-slate-400" />
          <h2>Color HSL</h2>
        </div>
        <button
          type="button"
          onClick={onResetAll}
          disabled={!anyActive}
          className="text-xs text-slate-500 hover:text-emerald-400 disabled:opacity-30 disabled:hover:text-slate-500 disabled:cursor-default transition-colors flex items-center gap-1"
          title="Reset all color adjustments"
        >
          <RotateCcw className="w-3 h-3" />
          Reset All
        </button>
      </div>

      <div className="space-y-4">
        {COLOR_BANDS.map(band => {
          const a = value[band.key];
          const bandActive = a.h !== 0 || a.s !== 0 || a.l !== 0;
          return (
            <div key={band.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-4 h-4 rounded-full border border-slate-700 shadow-sm"
                    style={{ backgroundColor: band.swatch }}
                  />
                  <span className="text-xs font-medium text-slate-200">{band.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onResetBand(band.key)}
                  disabled={!bandActive}
                  title={`Reset ${band.label}`}
                  aria-label={`Reset ${band.label}`}
                  className="text-slate-600 hover:text-emerald-400 disabled:opacity-30 disabled:hover:text-slate-600 disabled:cursor-default transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1.5 pl-6">
                <MiniSlider label="H" value={a.h} onChange={v => onChange(band.key, 'h', v)} />
                <MiniSlider label="S" value={a.s} onChange={v => onChange(band.key, 's', v)} />
                <MiniSlider label="L" value={a.l} onChange={v => onChange(band.key, 'l', v)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
