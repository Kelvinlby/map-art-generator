import React, { useState, useEffect } from 'react';
import { UploadArea } from './components/UploadArea';
import { MapPreview } from './components/MapPreview';
import { MaterialsList } from './components/MaterialsList';
import { processImage } from './utils/imageProcessor';
import { MATERIAL_FILTERS } from './utils/colors';
import { ProcessResult, ProcessSettings } from './types';
import { Map, Settings2, X, FolderOpen, ChevronDown, RotateCcw } from 'lucide-react';

const Slider = ({ label, settingKey, min = -100, max = 100, unit = '', value, onChange, defaultValue = 0 }: any) => {
  const isDefault = value === defaultValue;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs font-medium text-slate-300">
        <label>{label}</label>
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400">{value > 0 && min < 0 ? '+' : ''}{value}{unit}</span>
          <button
            type="button"
            onClick={() => onChange(settingKey, defaultValue)}
            disabled={isDefault}
            title={`Reset ${label}`}
            aria-label={`Reset ${label}`}
            className="text-slate-500 hover:text-emerald-400 disabled:opacity-30 disabled:hover:text-slate-500 disabled:cursor-default transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(settingKey, parseInt(e.target.value))}
        onDoubleClick={() => onChange(settingKey, defaultValue)}
        className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-2 outline-none cursor-pointer"
      />
    </div>
  );
};

export default function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('mapart');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProjectExpanded, setIsProjectExpanded] = useState(false);
  const [settings, setSettings] = useState<ProcessSettings>({
    gridX: 1,
    gridY: 1,
    materials: 'carpet',
    dithering: 'floyd-steinberg',
    colorMetric: 'cielab',
    saturation: 0,
    contrast: 0,
    sharpness: 0,
    hue: 0,
    exposure: 0,
    highlights: 0,
    shadows: 0,
    temperature: 0,
  });

  const updateSetting = (key: keyof ProcessSettings, value: any) => {
    setSettings(s => ({ ...s, [key]: value }));
  };

  useEffect(() => {
    if (!imageSrc) {
      setResult(null);
      return;
    }
    
    setIsProcessing(true);
    let cancelled = false;
    // Small debounce coalesces rapid slider drags; the worker also
    // cancels any still-running prior job inside processImage.
    const timer = setTimeout(() => {
      const safeSettings = {
        ...settings,
        gridX: Math.max(1, settings.gridX || 1),
        gridY: Math.max(1, settings.gridY || 1),
      };
      processImage(imageSrc, safeSettings)
        .then(res => { if (!cancelled) setResult(res); })
        .catch(console.error)
        .finally(() => { if (!cancelled) setIsProcessing(false); });
    }, 60);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [imageSrc, settings]);

  return (
    <div 
      className="min-h-screen bg-slate-950 text-slate-300 font-sans p-4 md:p-8 selection:bg-emerald-500/30 selection:text-emerald-100"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        <header className="flex items-center space-x-4 border-b border-slate-800 pb-6">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 shadow-sm">
            <Map className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Minecraft Map Art Generator</h1>
            <p className="text-slate-500 text-sm mt-1">Convert any image into a carpet building schematic with multi-map and lossless support.</p>
          </div>
        </header>

        <main className="grid lg:grid-cols-12 gap-8">
          {/* Controls & Original Image */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
             {!imageSrc ? (
               <UploadArea 
                  currentImage={imageSrc} 
                  onImageSelect={(src, name) => {
                    setImageSrc(src);
                    if (name) {
                      const baseName = name.replace(/\.[^/.]+$/, "");
                      setImageName(baseName);
                    }
                  }} 
               />
             ) : (
               <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-4">
                 <div className="flex justify-between items-center pb-3 border-b border-slate-800/50">
                    <div className="flex items-center space-x-2 text-slate-100 font-medium">
                       <FolderOpen className="w-5 h-5 text-slate-400" />
                       <h2>Project</h2>
                    </div>
                    <button onClick={() => setImageSrc(null)} className="text-slate-500 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 rounded-sm transition-colors" title="Remove Image">
                      <X className="w-5 h-5" />
                    </button>
                 </div>
                 
                 <div className="space-y-5">
                   <div className="flex gap-3">
                     <div className="flex-1">
                       <label className="block text-sm font-medium text-slate-200 mb-1">Name</label>
                       <input
                         type="text"
                         value={imageName}
                         onChange={(e) => setImageName(e.target.value)}
                         className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                         placeholder="Enter project name..."
                       />
                     </div>
                     <div className="flex-1">
                       <label className="block text-sm font-medium text-slate-200 mb-1">Materials</label>
                       <select
                         className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                         value={settings.materials}
                         onChange={(e) => updateSetting('materials', e.target.value)}
                       >
                         {MATERIAL_FILTERS.map(f => (
                           <option key={f.value} value={f.value}>{f.label}</option>
                         ))}
                       </select>
                     </div>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-slate-200 mb-2">Grid Dimensions (Maps)</label>
                     <div className="flex items-center space-x-2">
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 flex-1">
                          <input 
                            type="number"
                            min="1"
                            className="w-full bg-transparent px-3 py-2 text-sm text-slate-200 outline-none"
                            style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                            value={settings.gridX || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setSettings({...settings, gridX: isNaN(val) ? 0 : val});
                            }}
                            onBlur={() => setSettings(s => ({...s, gridX: Math.max(1, s.gridX || 1)}))}
                          />
                          <span className="text-slate-500 text-sm pl-2 pr-3 pointer-events-none whitespace-nowrap border-l border-slate-800/50">Maps Wide</span>
                        </div>
                        <span className="text-slate-500 font-medium">x</span>
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 flex-1">
                          <input 
                            type="number"
                            min="1"
                            className="w-full bg-transparent px-3 py-2 text-sm text-slate-200 outline-none"
                            style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                            value={settings.gridY || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setSettings({...settings, gridY: isNaN(val) ? 0 : val});
                            }}
                            onBlur={() => setSettings(s => ({...s, gridY: Math.max(1, s.gridY || 1)}))}
                          />
                          <span className="text-slate-500 text-sm pl-2 pr-3 pointer-events-none whitespace-nowrap border-l border-slate-800/50">Maps Tall</span>
                        </div>
                     </div>
                   </div>

                   {isProjectExpanded && (
                     <div className="space-y-5 pt-2 animate-in fade-in slide-in-from-top-2">
                       <div>
                         <label className="block text-sm font-medium text-slate-200 mb-1">Color Matching Algorithm</label>
                         <div className="text-xs text-slate-500 mb-2">Determines how closest block colors are chosen. CIELAB appears much more accurate and "lossless" to the human eye.</div>
                         <select 
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none w-full"
                            value={settings.colorMetric}
                            onChange={(e) => updateSetting('colorMetric', e.target.value)}
                         >
                           <option value="cielab">Perceptual (CIELAB) - Recommended</option>
                           <option value="rgb">Standard (RGB Euclidean)</option>
                         </select>
                       </div>

                       <div>
                         <label className="block text-sm font-medium text-slate-200 mb-1">Dithering Strategy</label>
                         <div className="text-xs text-slate-500 mb-2">Reduces color banding by dispersing quantization error. Atkinson is generally preferred for crisp pixel/map art.</div>
                         <select 
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none w-full"
                            value={settings.dithering}
                            onChange={(e) => updateSetting('dithering', e.target.value)}
                         >
                           <option value="atkinson">Atkinson - Best for Pixel Art</option>
                           <option value="floyd-steinberg">Floyd-Steinberg - Smoothest</option>
                           <option value="none">Nearest Neighbor - No Dithering</option>
                         </select>
                       </div>
                     </div>
                   )}

                   <button 
                     onClick={() => setIsProjectExpanded(!isProjectExpanded)} 
                     className="flex items-center justify-center w-full space-x-2 text-xs font-medium text-slate-400 hover:text-slate-300 pt-4 border-t border-slate-800/50 transition-colors"
                   >
                     <span>{isProjectExpanded ? 'Hide Advanced Settings' : 'Advanced Settings'}</span>
                     <ChevronDown className={`w-4 h-4 transition-transform ${isProjectExpanded ? 'rotate-180' : ''}`} />
                   </button>
                 </div>
               </div>
             )}
             
             {imageSrc && (
               <>
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
                   <div className="flex items-center space-x-2 text-slate-100 font-medium pb-3 border-b border-slate-800/50">
                      <Settings2 className="w-5 h-5 text-slate-400" />
                      <h2>Image Adjustments</h2>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                     <Slider label="Exposure" settingKey="exposure" value={settings.exposure} onChange={updateSetting} />
                     <Slider label="Contrast" settingKey="contrast" value={settings.contrast} onChange={updateSetting} />
                     <Slider label="Highlights" settingKey="highlights" value={settings.highlights} onChange={updateSetting} />
                     <Slider label="Shadows" settingKey="shadows" value={settings.shadows} onChange={updateSetting} />
                     <Slider label="Saturation" settingKey="saturation" value={settings.saturation} onChange={updateSetting} />
                     <Slider label="Temperature" settingKey="temperature" value={settings.temperature} onChange={updateSetting} />
                     <Slider label="Hue" settingKey="hue" min={-180} max={180} unit="°" value={settings.hue} onChange={updateSetting} />
                     <Slider label="Sharpness" settingKey="sharpness" min={0} max={100} value={settings.sharpness} onChange={updateSetting} />
                   </div>
                 </div>

                 <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                   <h3 className="text-sm font-medium text-slate-200">About Schematics</h3>
                   <p className="text-xs text-slate-400 leading-relaxed">
                     Schematics are exported as JSON files mapping <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded font-mono">(x, y)</code> coordinates to Minecraft block IDs.
                     <br /><br />
                     <strong>X</strong> represents the horizontal position (width) and <strong>Y</strong> represents the vertical position (height). The coordinates are 0-indexed, with <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded font-mono">(0, 0)</code> located at the top-left corner of the map.
                     <br /><br />
                     Each individual map represents exactly a 128×128 block area. For multi-map setups, a separate <code className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded font-mono">&lt;name&gt;_&lt;x&gt;-&lt;y&gt;.json</code> file is generated for each map piece in the grid.
                   </p>
                 </div>
               </>
             )}
          </div>

          {/* Assembly Outputs */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            <MapPreview result={result} isProcessing={isProcessing} fileName={imageName} />
            <MaterialsList materials={result?.materials} />
          </div>
        </main>
        
      </div>
    </div>
  );
}
