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

  // Brightness (exposure approximated as extra brightness)
  const totalBrightness = (adj.brightness + adj.exposure) / 100;
  if (totalBrightness !== 0) {
    filters.push(new fabric.Image.filters.Brightness({ brightness: totalBrightness }));
  }

  // Contrast
  if (adj.contrast !== 0) {
    filters.push(new fabric.Image.filters.Contrast({ contrast: adj.contrast / 100 }));
  }

  // Saturation (+ vibrance approximated as partial saturation)
  const totalSat = (adj.saturation + adj.vibrance * 0.5) / 100;
  if (totalSat !== 0) {
    filters.push(new fabric.Image.filters.Saturation({ saturation: totalSat }));
  }

  // Hue rotation
  if (adj.hue !== 0) {
    filters.push(new fabric.Image.filters.HueRotation({ rotation: adj.hue / 360 }));
  }

  // Temperature (warm/cool via ColorMatrix)
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

  // Tint (green/magenta via ColorMatrix)
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

  // Shadows (brighten darks — approximate via brightness + gamma)
  if (adj.shadows !== 0) {
    const s = adj.shadows / 100;
    filters.push(new fabric.Image.filters.Brightness({ brightness: s * 0.15 }));
  }

  // Highlights (darken brights — approximate)
  if (adj.highlights !== 0) {
    const h = adj.highlights / 100;
    filters.push(new fabric.Image.filters.Brightness({ brightness: h * 0.15 }));
  }

  // Clarity (approximate as contrast boost)
  if (adj.clarity !== 0) {
    filters.push(new fabric.Image.filters.Contrast({ contrast: adj.clarity / 200 }));
  }

  // Sharpness (Convolve)
  if (adj.sharpness > 0) {
    const strength = adj.sharpness / 100;
    const center = 1 + 4 * strength;
    const edge = -strength;
    filters.push(new fabric.Image.filters.Convolve({
      matrix: [0, edge, 0, edge, center, edge, 0, edge, 0],
    }));
  }

  // Noise reduction (slight blur)
  if (adj.noiseReduction > 0) {
    filters.push(new fabric.Image.filters.Blur({ blur: adj.noiseReduction / 500 }));
  }

  return filters;
}

// ── Apply vignette overlay ─────────────────────────────────
function applyVignette(canvas: any, adj: AdjustmentsState) {
  // Remove existing vignette
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
  const color = isLight ? 'rgba(255,255,255,' : 'rgba(0,0,0,';

  const innerRadius = midpoint * Math.min(w, h) * 0.5;
  const outerRadius = innerRadius + feather * Math.min(w, h) * 0.5;

  const ellipse = new fabric.Ellipse({
    rx: w * 0.8,
    ry: h * 0.8,
    left: w / 2,
    top: h / 2,
    originX: 'center',
    originY: 'center',
    fill: new fabric.Gradient({
      type: 'radial',
      coords: {
        r1: innerRadius || 1,
        r2: outerRadius || w * 0.6,
        x1: w * 0.8,
        y1: h * 0.8,
        x2: w * 0.8,
        y2: h * 0.8,
      },
      colorStops: [
        { offset: 0, color: color + '0)' },
        { offset: 0.6, color: color + '0)' },
        { offset: 1, color: color + amount + ')' },
      ],
    }),
    selectable: false,
    evented: false,
    excludeFromExport: false,
  } as any);

  (ellipse as any).__vignetteOverlay = true;
  (ellipse as any).__layerId = '__vignette';
  canvas.add(ellipse);
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

  // Apply filters with rAF throttle
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

  // Re-apply when adjustments or target changes
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
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Adjustments
          </span>
        </div>
        <button
          onClick={handleResetAll}
          className="rounded p-1 text-white/30 hover:bg-white/5 hover:text-white/60"
          title="Reset All"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Target selector */}
      <div className="flex items-center gap-2 border-t border-white/[0.06] px-3 py-1.5">
        <span className="text-[10px] text-white/30">Apply to:</span>
        <select
          value={adjustmentTarget}
          onChange={(e) => setAdjustmentTarget(e.target.value as any)}
          className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60 outline-none"
        >
          <option value="selected">Selected Layer</option>
          <option value="all">All Layers</option>
        </select>
      </div>

      {/* Sections */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col pb-4">
          {SECTIONS.map((section) => {
            const isCollapsed = collapsed[section.id];
            return (
              <div key={section.id} className="border-t border-white/[0.06]">
                {/* Section header */}
                <div className="flex items-center justify-between px-3 py-2">
                  <button
                    className="flex flex-1 items-center gap-1.5"
                    onClick={() => toggleSection(section.id)}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3 w-3 text-white/30" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-white/30" />
                    )}
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                      {section.label}
                    </span>
                  </button>
                  <button
                    onClick={() => resetAdjustmentSection(section.id)}
                    className="rounded p-0.5 text-white/20 hover:bg-white/5 hover:text-white/50"
                    title={`Reset ${section.label}`}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>

                {/* Sliders */}
                {!isCollapsed && (
                  <div className="flex flex-col gap-3 px-3 pb-3">
                    {section.sliders.map((slider) => (
                      <div key={slider.key} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-white/50">
                            {slider.label}
                          </span>
                          <span className="min-w-[28px] text-right text-[10px] tabular-nums text-white/30">
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
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
