import React, { useCallback, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';

interface Props {
  currentImage: string | null;
  onImageSelect: (src: string | null, name?: string) => void;
}

export function UploadArea({ currentImage, onImageSelect }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      readImage(file);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readImage(file);
    }
  };

  const readImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      onImageSelect(event.target?.result as string, file.name);
    };
    reader.readAsDataURL(file);
  };

  return (
    <label 
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center w-full aspect-square md:aspect-[4/3] rounded-2xl border-2 border-dashed transition-all cursor-pointer bg-slate-900/50 hover:bg-slate-900 focus-within:ring-2 focus-within:ring-emerald-500 ${isDragOver ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-700 hover:border-slate-600'}`}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
        <UploadCloud className={`w-12 h-12 mb-4 ${isDragOver ? 'text-emerald-500' : 'text-slate-500'}`} />
        <p className="mb-2 text-sm text-slate-300"><span className="font-semibold text-emerald-400">Click to upload</span> or drag and drop</p>
        <p className="text-xs text-slate-500">Automatically cropped to fit the target map grid</p>
      </div>
      <input type="file" className="hidden" accept="image/*" onChange={handleChange} />
    </label>
  );
}
