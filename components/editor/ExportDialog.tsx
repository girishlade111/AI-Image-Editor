'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { X, Image, FileImage, FileCode, Download, Lock, Unlock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/useEditorStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import fabric from 'fabric';

export type CanvasExportFormat = 'png' | 'jpg' | 'webp' | 'svg';

const FORMATS: { id: CanvasExportFormat; label: string; icon: React.ElementType }[] = [
  { id: 'png', label: 'PNG', icon: Image },
  { id: 'jpg', label: 'JPG', icon: FileImage },
  { id: 'webp', label: 'WEBP', icon: FileImage },
  { id: 'svg', label: 'SVG', icon: FileCode },
];

const SIZE_PRESETS = [
  { id: 'original', label: 'Original', width: 0, height: 0 },
  { id: '1920x1080', label: '1920 × 1080', width: 1920, height: 1080 },
  { id: '1080x1080', label: '1080 × 1080', width: 1080, height: 1080 },
  { id: '1280x720', label: '1280 × 720', width: 1280, height: 720 },
  { id: '2048x2048', label: '2048 × 2048', width: 2048, height: 2048 },
  { id: '4096x4096', label: '4096 × 4096', width: 4096, height: 4096 },
];

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function ExportDialog({ open, onClose }: ExportDialogProps) {
  const { canvasWidth, canvasHeight } = useEditorStore();
  
  const [format, setFormat] = useState<CanvasExportFormat>('png');
  const [quality, setQuality] = useState(85);
  const [sizeMode, setSizeMode] = useState<'original' | 'custom'>('original');
  const [customWidth, setCustomWidth] = useState(canvasWidth);
  const [customHeight, setCustomHeight] = useState(canvasHeight);
  const [lockAspect, setLockAspect] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('original');
  const [includeBackground, setIncludeBackground] = useState(true);
  const [applyEffects, setApplyEffects] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<string>('--');

  useEffect(() => {
    if (open && canvasWidth && canvasHeight) {
      setCustomWidth(canvasWidth);
      setCustomHeight(canvasHeight);
    }
  }, [open, canvasWidth, canvasHeight]);

  useEffect(() => {
    if (selectedPreset !== 'original') {
      const preset = SIZE_PRESETS.find(p => p.id === selectedPreset);
      if (preset) {
        setCustomWidth(preset.width);
        setCustomHeight(preset.height);
      }
    } else {
      setCustomWidth(canvasWidth);
      setCustomHeight(canvasHeight);
    }
  }, [selectedPreset, canvasWidth, canvasHeight]);

  useEffect(() => {
    const originalRatio = canvasWidth / canvasHeight;
    if (lockAspect && selectedPreset === 'custom') {
      const currentRatio = customWidth / customHeight;
      if (Math.abs(currentRatio - originalRatio) > 0.001) {
        setCustomHeight(Math.round(customWidth / originalRatio));
      }
    }
  }, [customWidth, lockAspect, canvasWidth, canvasHeight, selectedPreset]);

  useEffect(() => {
    const timer = setTimeout(() => {
      generatePreview();
    }, 300);
    return () => clearTimeout(timer);
  }, [format, quality, includeBackground]);

  const generatePreview = useCallback(async () => {
    const canvasEl = document.querySelector('.canvas-container canvas') as HTMLCanvasElement;
    if (!canvasEl) return;

    try {
      const fabricCanvas = fabric.Canvas.getInstance();
      if (!fabricCanvas) return;

      const originalBg = fabricCanvas.backgroundColor;
      if (!includeBackground && (format === 'png' || format === 'webp')) {
        fabricCanvas.backgroundColor = '';
        fabricCanvas.renderAll();
      }

      const multiplier = 0.15;
      const dataUrl = fabricCanvas.toDataURL({
        format: format === 'jpg' ? 'jpeg' : format,
        quality: quality / 100,
        multiplier,
      });

      fabricCanvas.backgroundColor = originalBg;
      fabricCanvas.renderAll();

      setPreviewUrl(dataUrl);

      const baseLength = Math.round((dataUrl.length * 3) / 4);
      const estimatedBytes = format === 'png' || format === 'webp'
        ? baseLength
        : format === 'jpg'
        ? Math.round(baseLength * (quality / 100))
        : baseLength;
      
      if (estimatedBytes < 1024) {
        setEstimatedSize(`${estimatedBytes} B`);
      } else if (estimatedBytes < 1024 * 1024) {
        setEstimatedSize(`${(estimatedBytes / 1024).toFixed(1)} KB`);
      } else {
        setEstimatedSize(`${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`);
      }
    } catch (e) {
      console.error('Preview generation error:', e);
    }
  }, [format, quality, includeBackground]);

  const handleFormatClick = useCallback((f: CanvasExportFormat) => {
    if (f === 'svg') {
      setShowUpgradeModal(true);
      return;
    }
    setFormat(f);
  }, []);

  const handlePresetClick = useCallback((preset: typeof SIZE_PRESETS[number]) => {
    setSelectedPreset(preset.id);
    if (preset.id === 'original') {
      setSizeMode('original');
    } else {
      setSizeMode('custom');
      setCustomWidth(preset.width);
      setCustomHeight(preset.height);
    }
  }, []);

  const exportImage = useCallback(async () => {
    const canvasEl = document.querySelector('.canvas-container canvas') as HTMLCanvasElement;
    if (!canvasEl) return;

    const fabricCanvas = fabric.Canvas.getInstance();
    if (!fabricCanvas) return;

    const originalWidth = fabricCanvas.width || 1;
    const originalHeight = fabricCanvas.height || 1;

    let exportWidth = originalWidth;
    let exportHeight = originalHeight;

    if (sizeMode === 'custom') {
      exportWidth = customWidth;
      exportHeight = customHeight;
    }

    const originalBg = fabricCanvas.backgroundColor;
    if (!includeBackground && (format === 'png' || format === 'webp')) {
      fabricCanvas.backgroundColor = '';
      fabricCanvas.renderAll();
    }

    const scaleX = exportWidth / originalWidth;
    const scaleY = exportHeight / originalHeight;
    const multiplier = Math.max(scaleX, scaleY, 1);

    if (format === 'svg') {
      const svgString = fabricCanvas.toSVG();
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `ladestack-export.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      fabricCanvas.backgroundColor = originalBg;
      fabricCanvas.renderAll();
      onClose();
      return;
    }

    const dataUrl = fabricCanvas.toDataURL({
      format: format === 'jpg' ? 'jpeg' : format,
      quality: quality / 100,
      multiplier,
    });

    fabricCanvas.backgroundColor = originalBg;
    fabricCanvas.renderAll();

    const link = document.createElement('a');
    link.download = `ladestack-export.${format === 'jpg' ? 'jpg' : format}`;
    link.href = dataUrl;
    link.click();
    onClose();
  }, [format, quality, sizeMode, customWidth, customHeight, includeBackground, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#16213e] p-6 shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
          <button onClick={onClose} className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60">
            <X className="h-4 w-4" />
          </button>

          <h2 className="text-base font-semibold text-white">Export Image</h2>
          <p className="mt-1 text-xs text-white/30">
            Configure export settings for your design
          </p>

          {/* Format Section */}
          <div className="mt-5">
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/30">
              Format
            </label>
            <div className="flex gap-1.5">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFormatClick(f.id)}
                  className={cn(
                    'relative flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-medium transition-all',
                    format === f.id && f.id !== 'svg'
                      ? 'border-[#e94560]/50 bg-[#e94560]/10 text-white'
                      : format === f.id && f.id === 'svg'
                      ? 'border-white/20 bg-white/[0.04] text-white/50'
                      : 'border-white/[0.06] bg-white/[0.02] text-white/40 hover:border-white/10 hover:bg-white/[0.04]'
                  )}
                >
                  <f.icon className="h-3.5 w-3.5" />
                  {f.label}
                  {f.id === 'svg' && (
                    <span className="absolute -top-1.5 -right-1.5 rounded-full bg-[#e94560] px-1.5 py-0.5 text-[8px] font-semibold text-white">
                      Pro
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Section (JPG/WEBP only) */}
          {(format === 'jpg' || format === 'webp') && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                  Quality
                </label>
                <span className="text-[10px] text-white/50">{quality}%</span>
              </div>
              <Slider
                value={[quality]}
                onValueChange={([v]) => setQuality(v)}
                max={100}
                min={1}
                step={1}
                className="py-1"
              />
            </div>
          )}

          {/* Size Section */}
          <div className="mt-4">
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/30">
              Size
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handlePresetClick(SIZE_PRESETS[0])}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all',
                  sizeMode === 'original'
                    ? 'border-[#e94560]/50 bg-[#e94560]/10 text-white'
                    : 'border-white/[0.06] text-white/40 hover:border-white/10'
                )}
              >
                Original
              </button>
              <button
                onClick={() => setSizeMode('custom')}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all',
                  sizeMode === 'custom'
                    ? 'border-[#e94560]/50 bg-[#e94560]/10 text-white'
                    : 'border-white/[0.06] text-white/40 hover:border-white/10'
                )}
              >
                Custom Size
              </button>
            </div>

            {sizeMode === 'custom' && (
              <>
                <div className="mt-3 flex items-center gap-2">
                  <select
                    value={selectedPreset}
                    onChange={(e) => handlePresetClick(SIZE_PRESETS.find(p => p.id === e.target.value) || SIZE_PRESETS[0])}
                    className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-[11px] text-white outline-none"
                  >
                    {SIZE_PRESETS.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#16213e]">
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setLockAspect(!lockAspect)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg border transition-all',
                      lockAspect
                        ? 'border-[#e94560]/50 bg-[#e94560]/10 text-white'
                        : 'border-white/[0.06] text-white/40 hover:border-white/10'
                    )}
                    title={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                  >
                    {lockAspect ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/30">
                      Width
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={customWidth}
                      onChange={(e) => {
                        setCustomWidth(parseInt(e.target.value) || 0);
                        setSelectedPreset('custom');
                      }}
                      className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm tabular-nums text-white outline-none transition-colors focus:border-[#e94560]/40 focus:ring-1 focus:ring-[#e94560]/20"
                    />
                  </div>
                  <span className="mt-5 text-white/20">×</span>
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/30">
                      Height
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={customHeight}
                      onChange={(e) => {
                        setCustomHeight(parseInt(e.target.value) || 0);
                        setSelectedPreset('custom');
                      }}
                      className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm tabular-nums text-white outline-none transition-colors focus:border-[#e94560]/40 focus:ring-1 focus:ring-[#e94560]/20"
                    />
                  </div>
                  <div className="mt-5 text-[10px] text-white/20">px</div>
                </div>
              </>
            )}
          </div>

          {/* Options Section */}
          <div className="mt-4">
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/30">
              Options
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setIncludeBackground(!includeBackground)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all',
                  includeBackground
                    ? 'border-[#e94560]/50 bg-[#e94560]/10 text-white'
                    : 'border-white/[0.06] text-white/40 hover:border-white/10'
                )}
              >
                <div className={cn('flex h-4 w-4 items-center justify-center rounded border', includeBackground ? 'bg-[#e94560] border-[#e94560]' : 'border-white/20')}>
                  {includeBackground && <Check className="h-3 w-3 text-white" />}
                </div>
                Include background
              </button>
              <button
                onClick={() => setApplyEffects(!applyEffects)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all',
                  applyEffects
                    ? 'border-[#e94560]/50 bg-[#e94560]/10 text-white'
                    : 'border-white/[0.06] text-white/40 hover:border-white/10'
                )}
              >
                <div className={cn('flex h-4 w-4 items-center justify-center rounded border', applyEffects ? 'bg-[#e94560] border-[#e94560]' : 'border-white/20')}>
                  {applyEffects && <Check className="h-3 w-3 text-white" />}
                </div>
                Apply all effects before export
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="mt-4">
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/30">
              Preview
            </label>
            <div className="relative flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-white/5">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/20">
                    <Image className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[8px] font-semibold text-white">
                  {format.toUpperCase()}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/30">Estimated size</span>
                <span className="text-sm font-medium text-white">{estimatedSize}</span>
                <span className="text-[10px] text-white/30">
                  {sizeMode === 'original' ? `${canvasWidth} × ${canvasHeight}` : `${customWidth} × ${customHeight}`}
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex gap-2">
            <Button variant="ghost" onClick={onClose} className="h-9 flex-1 text-xs text-white/40 hover:bg-white/[0.06] hover:text-white/60">
              Cancel
            </Button>
            <Button onClick={exportImage} className="h-9 flex-1 bg-[#e94560] px-6 text-xs font-medium text-white hover:bg-[#e94560]/80">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export Now
            </Button>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#16213e] p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Upgrade to Pro</h3>
            <p className="mt-2 text-xs text-white/50">
              SVG export is available for Pro users. Upgrade now to unlock this feature and more.
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" onClick={() => setShowUpgradeModal(false)} className="h-9 flex-1 text-xs text-white/40">
                Not now
              </Button>
              <Button onClick={() => setShowUpgradeModal(false)} className="h-9 flex-1 bg-[#e94560] text-xs font-medium">
                Upgrade
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}