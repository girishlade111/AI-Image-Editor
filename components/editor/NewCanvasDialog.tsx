'use client';

import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CanvasPreset, CanvasBackground } from '@/types/editor';

const PRESETS: (CanvasPreset & { id: string })[] = [
  { id: 'custom', label: 'Custom', width: 800, height: 600 },
  { id: '800x600', label: '800 × 600', width: 800, height: 600 },
  { id: '1920x1080', label: '1920 × 1080', width: 1920, height: 1080 },
  { id: 'instagram', label: 'Instagram', width: 1080, height: 1080 },
  { id: 'story', label: 'Story', width: 1080, height: 1920 },
  { id: 'a4', label: 'A4', width: 2480, height: 3508 },
  { id: 'twitter', label: 'Twitter Post', width: 1500, height: 500 },
];

const BACKGROUNDS: { id: CanvasBackground; label: string; color: string }[] = [
  { id: 'white', label: 'White', color: '#ffffff' },
  { id: 'transparent', label: 'Transparent', color: 'transparent' },
  { id: 'black', label: 'Black', color: '#000000' },
];

interface NewCanvasDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateCanvas: (width: number, height: number, bg: string) => void;
}

export default function NewCanvasDialog({
  open,
  onClose,
  onCreateCanvas,
}: NewCanvasDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState('800x600');
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [background, setBackground] = useState<CanvasBackground>('white');

  const handlePresetClick = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      setSelectedPreset(preset.id);
      if (preset.id !== 'custom') {
        setWidth(preset.width);
        setHeight(preset.height);
      }
    },
    []
  );

  const handleCreate = useCallback(() => {
    const bgColor =
      background === 'white'
        ? '#ffffff'
        : background === 'black'
        ? '#000000'
        : '';
    onCreateCanvas(
      Math.max(1, Math.min(10000, width)),
      Math.max(1, Math.min(10000, height)),
      bgColor
    );
  }, [width, height, background, onCreateCanvas]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-metal-elevated p-6 shadow-metal-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-base font-semibold text-white">New Canvas</h2>
        <p className="mt-1 text-xs text-white/30">
          Choose a preset size or enter custom dimensions
        </p>

        {/* Presets grid */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-center transition-all duration-150',
                selectedPreset === preset.id
                  ? 'border-[#e94560]/40 bg-[#e94560]/10 text-white shadow-[inset_0_1px_0_rgba(233,69,96,0.08)]'
                  : 'border-white/[0.04] bg-white/[0.02] text-white/50 hover:border-white/[0.08] hover:bg-white/[0.04]'
              )}
            >
              <span className="text-[11px] font-medium">{preset.label}</span>
              {preset.id !== 'custom' && (
                <span className="text-[9px] tabular-nums text-white/20 font-mono">
                  {preset.width} × {preset.height}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Custom size inputs */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/30">
              Width
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              value={width}
              onChange={(e) => {
                setWidth(parseInt(e.target.value) || 0);
                setSelectedPreset('custom');
              }}
              className="h-9 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-sm tabular-nums text-white outline-none transition-colors focus:border-[#e94560]/30"
            />
          </div>
          <span className="mt-5 text-white/15">×</span>
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/30">
              Height
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              value={height}
              onChange={(e) => {
                setHeight(parseInt(e.target.value) || 0);
                setSelectedPreset('custom');
              }}
              className="h-9 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-sm tabular-nums text-white outline-none transition-colors focus:border-[#e94560]/30"
            />
          </div>
          <div className="mt-5 text-[10px] text-white/20">px</div>
        </div>

        {/* Background selector */}
        <div className="mt-4">
          <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/30">
            Background
          </label>
          <div className="flex gap-2">
            {BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => setBackground(bg.id)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-medium transition-all duration-150',
                  background === bg.id
                    ? 'border-[#e94560]/40 bg-[#e94560]/10 text-white'
                    : 'border-white/[0.04] text-white/40 hover:border-white/[0.08]'
                )}
              >
                <div
                  className={cn(
                    'h-4 w-4 rounded-md border',
                    bg.id === 'transparent'
                      ? 'border-white/15'
                      : 'border-white/10'
                  )}
                  style={{
                    backgroundColor:
                      bg.id === 'transparent' ? undefined : bg.color,
                    backgroundImage:
                      bg.id === 'transparent'
                        ? 'linear-gradient(45deg, #4a506e 25%, transparent 25%), linear-gradient(-45deg, #4a506e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #4a506e 75%), linear-gradient(-45deg, transparent 75%, #4a506e 75%)'
                        : undefined,
                    backgroundSize: '6px 6px',
                    backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                  }}
                />
                {bg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Create button */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-xs text-white/40 hover:bg-white/[0.04] hover:text-white/60 transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="h-10 px-6 rounded-xl bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-xs font-semibold text-white shadow-[0_2px_12px_rgba(233,69,96,0.25)] hover:shadow-[0_4px_20px_rgba(233,69,96,0.35)] hover:from-[#f05a73] hover:to-[#ff8080] transition-all duration-150"
          >
            Create Canvas
          </button>
        </div>
      </div>
    </div>
  );
}
