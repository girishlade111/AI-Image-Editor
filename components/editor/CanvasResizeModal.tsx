'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { X, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/useEditorStore';
import { Button } from '@/components/ui/button';
import { fabric } from 'fabric';
import { serializeCanvas } from '@/lib/fabricHelpers';

type BgFill = 'white' | 'transparent' | 'current';
type AnchorPoint = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export function resizeCanvas(
  canvas: fabric.Canvas,
  newW: number,
  newH: number,
  anchor: string,
  scaleContent: boolean,
  bgFill: string,
  store: any
) {
  if (scaleContent) {
    const currentW = canvas.width || 1;
    const currentH = canvas.height || 1;
    const scaleX = newW / currentW;
    const scaleY = newH / currentH;

    canvas.getObjects().forEach((obj: fabric.Object) => {
      obj.scaleX = (obj.scaleX || 1) * scaleX;
      obj.scaleY = (obj.scaleY || 1) * scaleY;
      obj.left = (obj.left || 0) * scaleX;
      obj.top = (obj.top || 0) * scaleY;
      obj.setCoords();
    });
  }

  if (bgFill === 'transparent') {
    canvas.backgroundColor = '';
  } else if (bgFill === 'white') {
    canvas.backgroundColor = '#ffffff';
  }

  canvas.setWidth(newW);
  canvas.setHeight(newH);
  canvas.renderAll();

  store.setCanvasSize(newW, newH);
  store.pushHistory(serializeCanvas(canvas));
}

interface CanvasResizeModalProps {
  open: boolean;
  onClose: () => void;
  onResize: (newWidth: number, newHeight: number, anchor: AnchorPoint, scaleContent: boolean, bgFill: BgFill) => void;
}

const ANCHOR_GRID: AnchorPoint[][] = [
  ['top-left', 'top-center', 'top-right'],
  ['middle-left', 'center', 'middle-right'],
  ['bottom-left', 'bottom-center', 'bottom-right'],
];

function getAnchorLabel(anchor: AnchorPoint): string {
  const labels: Record<AnchorPoint, string> = {
    'top-left': 'Top Left',
    'top-center': 'Top Center',
    'top-right': 'Top Right',
    'middle-left': 'Middle Left',
    'center': 'Center',
    'middle-right': 'Middle Right',
    'bottom-left': 'Bottom Left',
    'bottom-center': 'Bottom Center',
    'bottom-right': 'Bottom Right',
  };
  return labels[anchor];
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function getAspectRatio(w: number, h: number): string {
  if (w <= 0 || h <= 0) return '0:0';
  const divisor = gcd(Math.round(w), Math.round(h));
  return `${Math.round(w) / divisor}:${Math.round(h) / divisor}`;
}

export default function CanvasResizeModal({
  open,
  onClose,
  onResize,
}: CanvasResizeModalProps) {
  const { canvasWidth, canvasHeight } = useEditorStore();

  const [width, setWidth] = useState(canvasWidth);
  const [height, setHeight] = useState(canvasHeight);
  const [lockAspect, setLockAspect] = useState(false);
  const [anchor, setAnchor] = useState<AnchorPoint>('center');
  const [scaleContent, setScaleContent] = useState(false);
  const [bgFill, setBgFill] = useState<BgFill>('current');

  useEffect(() => {
    if (open) {
      setWidth(canvasWidth);
      setHeight(canvasHeight);
      setLockAspect(false);
      setAnchor('center');
      setScaleContent(false);
      setBgFill('current');
    }
  }, [open, canvasWidth, canvasHeight]);

  const aspectRatio = width / height;
  const aspectRatioDisplay = getAspectRatio(width, height);

  const handleWidthChange = useCallback((newWidth: number) => {
    setWidth(newWidth);
    if (lockAspect && height > 0) {
      setHeight(Math.round(newWidth / aspectRatio));
    }
  }, [lockAspect, height, aspectRatio]);

  const handleHeightChange = useCallback((newHeight: number) => {
    setHeight(newHeight);
    if (lockAspect && width > 0) {
      setWidth(Math.round(newHeight * aspectRatio));
    }
  }, [lockAspect, width, aspectRatio]);

  const handleLockToggle = useCallback(() => {
    setLockAspect((prev) => !prev);
  }, []);

  const handleConfirm = useCallback(() => {
    onResize(
      Math.max(1, Math.min(10000, width)),
      Math.max(1, Math.min(10000, height)),
      anchor,
      scaleContent,
      bgFill
    );
    onClose();
  }, [width, height, anchor, scaleContent, bgFill, onResize, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#16213e] p-6 shadow-2xl shadow-black/40">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <h2 className="text-base font-semibold text-white">Resize Canvas</h2>
        <p className="mt-1 text-xs text-white/30">
          Adjust canvas dimensions and positioning
        </p>

        {/* SECTION 1 — Dimensions */}
        <div className="mt-5">
          <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/30">
            Dimensions
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="number"
                min={1}
                max={10000}
                value={width}
                onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm tabular-nums text-white outline-none transition-colors focus:border-[#e94560]/40 focus:ring-1 focus:ring-[#e94560]/20"
              />
              <span className="mt-1 block text-[9px] text-white/25">Width (px)</span>
            </div>
            <button
              onClick={handleLockToggle}
              className={cn(
                'mt-4 flex h-8 w-8 items-center justify-center rounded-lg border transition-all',
                lockAspect
                  ? 'border-[#e94560]/50 bg-[#e94560]/10 text-[#e94560]'
                  : 'border-white/[0.08] text-white/30 hover:border-white/20 hover:text-white/50'
              )}
              title={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
            >
              {lockAspect ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </button>
            <div className="flex-1">
              <input
                type="number"
                min={1}
                max={10000}
                value={height}
                onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm tabular-nums text-white outline-none transition-colors focus:border-[#e94560]/40 focus:ring-1 focus:ring-[#e94560]/20"
              />
              <span className="mt-1 block text-[9px] text-white/25">Height (px)</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-white/30">
            Aspect: <span className="text-white/50">{aspectRatioDisplay}</span>
          </div>
        </div>

        {/* SECTION 2 — Anchor point selector */}
        <div className="mt-4">
          <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/30">
            Anchor Point
          </label>
          <div className="flex items-center gap-3">
            <div className="grid grid-cols-3 gap-1">
              {ANCHOR_GRID.map((row, rowIdx) =>
                row.map((anchorPoint) => (
                  <button
                    key={anchorPoint}
                    onClick={() => setAnchor(anchorPoint)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md border transition-all',
                      anchor === anchorPoint
                        ? 'border-[#e94560]/50 bg-[#e94560]/10'
                        : 'border-white/[0.06] hover:border-white/20'
                    )}
                    title={getAnchorLabel(anchorPoint)}
                  >
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        anchor === anchorPoint
                          ? 'bg-[#e94560]'
                          : 'bg-white/20'
                      )}
                    />
                  </button>
                ))
              )}
            </div>
            <span className="text-[10px] text-white/30">
              {getAnchorLabel(anchor)}
            </span>
          </div>
        </div>

        {/* SECTION 3 — Background fill */}
        <div className="mt-4">
          <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/30">
            Background Fill
          </label>
          <div className="flex gap-2">
            {[
              { id: 'white', label: 'White' },
              { id: 'transparent', label: 'Transparent' },
              { id: 'current', label: 'Current BG' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setBgFill(option.id as BgFill)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all',
                  bgFill === option.id
                    ? 'border-[#e94560]/50 bg-[#e94560]/10 text-white'
                    : 'border-white/[0.06] text-white/40 hover:border-white/10'
                )}
              >
                <div
                  className={cn(
                    'h-4 w-4 rounded border',
                    option.id === 'transparent'
                      ? 'border-white/20'
                      : 'border-white/10'
                  )}
                  style={{
                    backgroundColor:
                      option.id === 'white'
                        ? '#ffffff'
                        : option.id === 'current'
                        ? undefined
                        : 'transparent',
                    backgroundImage:
                      option.id === 'transparent'
                        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                        : undefined,
                    backgroundSize: '6px 6px',
                    backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                  }}
                />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 4 — Resize mode */}
        <div className="mt-4">
          <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/30">
            Resize Mode
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScaleContent(false)}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all',
                !scaleContent
                  ? 'border-[#e94560]/50 bg-[#e94560]/10 text-white'
                  : 'border-white/[0.06] text-white/40 hover:border-white/10'
              )}
            >
              Resize Canvas
            </button>
            <button
              onClick={() => setScaleContent(true)}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all',
                scaleContent
                  ? 'border-[#e94560]/50 bg-[#e94560]/10 text-white'
                  : 'border-white/[0.06] text-white/40 hover:border-white/10'
              )}
            >
              Scale Content
            </button>
          </div>
          <p className="mt-1 text-[9px] text-white/25">
            {scaleContent
              ? 'Resize canvas AND scale all objects proportionally'
              : 'Change canvas dimensions, content stays same size'}
          </p>
        </div>

        {/* Preview */}
        <div className="mt-5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-wider text-white/30">Before</div>
              <div className="mt-0.5 text-sm font-medium text-white/50">
                {canvasWidth} × {canvasHeight}
              </div>
            </div>
            <div className="text-white/20">→</div>
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-wider text-white/30">After</div>
              <div className="mt-0.5 text-sm font-medium text-white">
                {width} × {height}
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-9 px-4 text-xs text-white/40 hover:bg-white/[0.06] hover:text-white/60"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="h-9 bg-[#e94560] px-6 text-xs font-medium text-white hover:bg-[#e94560]/80"
          >
            Resize Canvas
          </Button>
        </div>
      </div>
    </div>
  );
}
