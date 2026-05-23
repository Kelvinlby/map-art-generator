import React from 'react';
import { CARPET_PALETTE } from '../utils/colors';

interface Props {
  materials?: Record<string, number>;
}

export function MaterialsList({ materials }: Props) {
  if (!materials) return null;

  // Filter out any 0s and arrange the rest
  const requirements = CARPET_PALETTE
    .map(color => ({
      color,
      count: materials[color.id] || 0
    }))
    .filter(req => req.count > 0)
    .sort((a, b) => b.count - a.count);

  const totalBlocks = requirements.reduce((sum, req) => sum + req.count, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-end justify-between border-b border-slate-800/50 pb-4">
        <div>
          <h2 className="text-slate-100 font-medium">Material Requirements</h2>
          <p className="text-slate-500 text-sm mt-1">Carpet blocks needed to construct layout.</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-mono text-emerald-400">{totalBlocks.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Total Blocks</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {requirements.map((req) => {
          const stacks = Math.floor(req.count / 64);
          const remainder = req.count % 64;

          return (
            <div key={req.color.id} className="flex items-center p-3 bg-slate-950/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
              <div 
                className="w-10 h-10 rounded-md shrink-0 shadow-sm border border-black/20"
                style={{ backgroundColor: req.color.hex }}
              />
              <div className="ml-4 flex-1">
                <div className="text-sm font-medium text-slate-200">{req.color.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  <span className="font-mono text-slate-400">{req.count}</span>
                </div>
              </div>
              <div className="text-right text-xs font-mono text-slate-400 pl-2">
                {stacks > 0 && <span className="text-emerald-500/80">{stacks}st </span>}
                {(remainder > 0 || stacks === 0) && <span className="text-slate-500">{remainder}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
