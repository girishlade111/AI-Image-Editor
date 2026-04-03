'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEditorStore } from '@/store/useEditorStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import type { AdjustmentKey, AdjustmentSection, AdjustmentsState } from '@/types/editor';
import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { fabric } from 'fabric';

// ── Slider config per section ──────────────────────────────
interface SliderDef {
  key: AdjustmentKey;
  label: string;
  min: number;
  max: number;
}

const TONE_SLIDERS: SliderDef[] = [
  { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
  { key: 'exposure', label: 'Exposure', min: -100, max: 100 },
  { key: 'shadows', label: 'Shadows', min: 0, max: 100 },
  { key: 'highlights', label: 'Highlights', min: -100, max: 0 },
];

const COLOR_SLIDERS: SliderDef[] = [
  { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
  { key: 'vibrance', label: 'Vibrance', min: -100, max: 100 },
  { key: 'hue', label: 'Hue', min: -180, max: 180 },
  { key: 'temperature', label: 'Temperature', min: -100, max: 100 },
  { key: 'tint', label: 'Tint', min: -100, max: 100 },
];

const DETAIL_SLIDERS: SliderDef[] = [
  { key: 'sharpness', label: 'Sharpness', min: 0, max: 100 },
  { key: 'clarity', label: 'Clarity', min: -100, max: 100 },
  { key: 'noiseReduction', label: 'Noise Reduction', min: 0, max: 100 },
];

const VIGNETTE_SLIDERS: SliderDef[] = [
  { key: 'vignetteAmount', label: 'Amount', min: -100, max: 100 },
  { key: 'vignetteMidpoint', label: 'Midpoint', min: 0, max: 100 },
  { key: 'vignetteFeather', label: 'Feather', min: 0, max: 100 },
];

const SECTIONS: { id: AdjustmentSection; label: string; sliders: SliderDef[] }[] = [
  { id: 'tone', label: 'TONE', sliders: TONE_SLIDERS },
  { id: 'color', label: 'COLOR', sliders: COLOR_SLIDERS },
  { id: 'detail', label: 'DETAIL', sliders: DETAIL_SLIDERS },
  { id: 'vignette', label: 'VIGNETTE', sliders: VIGNETTE_SLIDERS },
];

// ── Build fabric filters from adjustments ──────────────────
function buildFilters(adj: AdjustmentsState): any[] {
  const filters: any[] = [];

  const totalBrightness = (adj.brightness + adj.exposure) / 100;
  if (totalBrightness !== 0) {
    filters.push(new fabric.Image.filters.Brightness({ brightness: totalBrightness }));
  }

  if (adj.contrast !== 0) {
    filters.push(new fabric.Image.filters.Contrast({ contrast: adj.contrast / 100 }));
  }

  const totalSat = (adj.saturation + adj.vibrance * 0.5) / 100;
  if (totalSat !== 0) {
    filters.push(new fabric.Image.filters.Saturation({ saturation: totalSat }));
  }

  if (adj.hue !== 0) {
    filters.push(new fabric.Image.filters.HueRotation({ rotation: adj.hue / 360 }));
  }

  if (adj.temperature !== 0) {
    const t = adj.temperature / 100;
    filters.push(new fabric.Image.filters.ColorMatrix({
      matrix: [
        1 + t * 0.1, 0, 0, 0, 0,
        0, 1, 0, 0, 0,
        0, 0, 1 - t * 0.1, 0, 0,
        0, 0, 0, 1, 0,
      ],
    }));
  }

  if (adj.tint !== 0) {
    const ti = adj.tint / 100;
    filters.push(new fabric.Image.filters.ColorMatrix({
      matrix: [
        1, 0, 0, 0, 0,
        0, 1 - ti * 0.1, 0, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 0, 1, 0,
      ],
    }));
  }

  if (adj.shadows !== 0) {
    const s = adj.shadows / 100;
    filters.push(new fabric.Image.filters.Brightness({ brightness: s * 0.15 }));
  }

  if (adj.highlights !== 0) {
    const h = adj.highlights / 100;
    filters.push(new fabric.Image.filters.Brightness({ brightness: h * 0.15 }));
  }

  if (adj.clarity !== 0) {
    filters.push(new fabric.Image.filters.Contrast({ contrast: adj.clarity / 200 }));
  }

  if (adj.sharpness > 0) {
    const strength = adj.sharpness / 100;
    const center = 1 + 4 * strength;
    const edge = -strength;
    filters.push(new fabric.Image.filters.Convolve({
      matrix: [0, edge, 0, edge, center, edge, 0, edge, 0],
    }));
  }

  if (adj.noiseReduction > 0) {
    filters.push(new fabric.Image.filters.Blur({ blur: adj.noiseReduction / 500 }));
  }

  return filters;
}

// ── Apply vignette overlay ─────────────────────────────────
function applyVignette(canvas: any, adj: AdjustmentsState) {
  const objects = canvas.getObjects();
  const existing = objects.find((o: any) => o.__vignetteOverlay);
  if (existing) canvas.remove(existing);

  if (adj.vignetteAmount === 0) {
    canvas.renderAll();
    return;
  }

  const w = canvas.getWidth();
  const h = canvas.getHeight();
  const midpoint = adj.vignetteMidpoint / 100;
  const feather = adj.vignetteFeather / 100;
  const amount = Math.abs(adj.vignetteAmount) / 100;
  const isLight = adj.vignetteAmount < 0;
  const baseColor = isLight ? '255,255,255' : '0,0,0';

  const minDim = Math.min(w, h);
  const maxDim = Math.max(w, h);
  const innerR = midpoint * minDim * 0.4;
  const outerR = innerR + feather * maxDim * 0.6 + minDim * 0.1;

  const rect = new fabric.Rect({
    left: 0,
    top: 0,
    width: w,
    height: h,
    originX: 'left',
    originY: 'top',
    fill: new fabric.Gradient({
      type: 'radial',
      coords: {
        r1: innerR,
        r2: outerR,
        x1: w / 2,
        y1: h / 2,
        x2: w / 2,
        y2: h / 2,
      },
      colorStops: [
        { offset: 0, color: `rgba(${baseColor},0)` },
        { offset: 0.5, color: `rgba(${baseColor},0)` },
        { offset: 1, color: `rgba(${baseColor},${amount})` },
      ],
    }),
    selectable: false,
    evented: false,
    excludeFromExport: true,
  } as any);

  (rect as any).__vignetteOverlay = true;
  (rect as any).__layerId = '__vignette';
  canvas.add(rect);
  canvas.bringToFront(rect);
  canvas.renderAll();
}

// ── Component ──────────────────────────────────────────────
export default function AdjustmentsPanel() {
  const adjustments = useEditorStore((s) => s.adjustments);
  const adjustmentTarget = useEditorStore((s) => s.adjustmentTarget);
  const setAdjustment = useEditorStore((s) => s.setAdjustment);
  const resetAdjustments = useEditorStore((s) => s.resetAdjustments);
  const resetAdjustmentSection = useEditorStore((s) => s.resetAdjustmentSection);
  const setAdjustmentTarget = useEditorStore((s) => s.setAdjustmentTarget);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);
  const { canvasRef } = useCanvasContext();

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    tone: false,
    color: true,
    detail: true,
    vignette: true,
  });

  const rafRef = useRef<number | null>(null);

  const toggleSection = useCallback((id: string) => {
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));
  }, []);

  const applyAllFilters = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const adj = useEditorStore.getState().adjustments;
      const target = useEditorStore.getState().adjustmentTarget;
      const activeId = useEditorStore.getState().activeLayerId;
      const filters = buildFilters(adj);

      const objects = canvas.getObjects().filter((o: any) =>
        !o.__vignetteOverlay && o.type === 'image'
      );

      const targets = target === 'all'
        ? objects
        : objects.filter((o: any) => o.__layerId === activeId);

      for (const obj of targets) {
        (obj as any).filters = filters;
        (obj as any).applyFilters();
      }

      applyVignette(canvas, adj);
      canvas.renderAll();
    });
  }, [canvasRef]);

  useEffect(() => {
    applyAllFilters();
  }, [adjustments, adjustmentTarget, activeLayerId, applyAllFilters]);

  const handleSliderChange = useCallback(
    (key: AdjustmentKey, val: number[]) => {
      setAdjustment(key, val[0]);
    },
    [setAdjustment]
  );

  const handleResetAll = useCallback(() => {
    resetAdjustments();
  }, [resetAdjustments]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
          Adjustments
        </span>
        <button
          onClick={handleResetAll}
          className="rounded-lg p-1.5 text-white/25 hover:bg-white/[0.06] hover:text-white/60 transition-all duration-150"
          title="Reset All"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Separator */}
      <div className="h-px bg-metal-sep" />

      {/* Target selector */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-[10px] text-white/30 font-medium">Apply to:</span>
        <select
          value={adjustmentTarget}
          onChange={(e) => setAdjustmentTarget(e.target.value as any)}
          className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-2 py-1 text-[10px] text-white/60 outline-none focus:border-[#e94560]/30 transition-colors"
        >
          <option value="selected" className="bg-metal-600">Selected Layer</option>
          <option value="all" className="bg-metal-600">All Layers</option>
        </select>
      </div>

      <div className="h-px bg-metal-sep" />

      {/* Sections */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col pb-4">
          {SECTIONS.map((section) => {
            const isCollapsed = collapsed[section.id];
            return (
              <div key={section.id}>
                {/* Section header */}
                <div className="flex items-center justify-between px-3 py-2">
                  <button
                    className="flex flex-1 items-center gap-1.5"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className={cn(
                      'flex h-4 w-4 items-center justify-center rounded transition-all duration-150',
                      isCollapsed ? 'text-white/20' : 'text-white/30'
                    )}>
                      {isCollapsed ? (
                        <ChevronRight className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      {section.label}
                    </span>
                  </button>
                  <button
                    onClick={() => resetAdjustmentSection(section.id)}
                    className="rounded-lg p-1 text-white/15 hover:bg-white/[0.06] hover:text-white/50 transition-all duration-150"
                    title={`Reset ${section.label}`}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>

                {/* Sliders */}
                {!isCollapsed && (
                  <div className="flex flex-col gap-3 px-3 pb-3">
                    {section.sliders.map((slider) => (
                      <div key={slider.key} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-white/45 font-medium">
                            {slider.label}
                          </span>
                          <span className="min-w-[28px] text-right text-[10px] tabular-nums text-white/30 font-mono">
                            {adjustments[slider.key]}
                          </span>
                        </div>
                        <Slider
                          value={[adjustments[slider.key]]}
                          onValueChange={(val) =>
                            handleSliderChange(slider.key, val)
                          }
                          min={slider.min}
                          max={slider.max}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Section separator */}
                {!isCollapsed && <div className="h-px bg-metal-sep mx-3" />}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// Simple cn helper for inline use
function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
