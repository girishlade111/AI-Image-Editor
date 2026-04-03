'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEditorStore } from '@/store/useEditorStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { FILTER_PRESETS, type FilterPreset } from '@/constants/filters';
import type { EffectsState } from '@/types/editor';
import { fabric } from 'fabric';
import {
  Eye,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

// ── 16x16 gradient fallback as base64 PNG ──────────────────
const FALLBACK_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABhUlEQVR4nO2ZwQ6DIBBEN7b//8v0YA+mCLiAO4Qhk3gx6j4YFlFLKYQQQgghhBBCCCGEEEIIIYSQf+Tc+4B/wI4LcPb8sR0X4Oz5Y7sBOLsAOz4DnF2AHZ8Bzi7Ajs8AZxdgx2eAswuw4zPA2QXY8Rng7ALs+AxwdgF2fAY4uwA7PgOcXYAdnwHOLsCOzwBnF2DHZ4CzC7DjM8DZBdjxGeDsAuz4DHB2AXZ8Bji7ADs+A5xdgB2fAc4uwI7PAGcXYMdngLMLsOMzwNkF2PEZ4OwC7PgMcHYBdnwGOLsAOz4DnF2AHZ8Bzi7Ajs8AZxdg1w==';

// ── Build fabric filters from a preset ─────────────────────
function buildPresetFilters(preset: FilterPreset, intensity: number): any[] {
  if (preset.id === 'none') return [];
  const t = intensity / 100;
  const filters: any[] = [];

  if (preset.brightness) {
    filters.push(new fabric.Image.filters.Brightness({ brightness: preset.brightness * t }));
  }
  if (preset.contrast) {
    filters.push(new fabric.Image.filters.Contrast({ contrast: preset.contrast * t }));
  }
  if (preset.saturation) {
    filters.push(new fabric.Image.filters.Saturation({ saturation: preset.saturation * t }));
  }
  if (preset.hue) {
    filters.push(new fabric.Image.filters.HueRotation({ rotation: (preset.hue * t) / 360 }));
  }
  if (preset.matrix) {
    // Blend matrix toward identity based on intensity
    const identity = [1,0,0,0,0, 0,1,0,0,0, 0,0,1,0,0, 0,0,0,1,0];
    const blended = preset.matrix.map((v, i) => identity[i] + (v - identity[i]) * t);
    filters.push(new fabric.Image.filters.ColorMatrix({ matrix: blended }));
  }
  if (preset.blur && preset.blur > 0) {
    filters.push(new fabric.Image.filters.Blur({ blur: preset.blur * t }));
  }
  if (preset.noise && preset.noise > 0) {
    filters.push(new fabric.Image.filters.Noise({ noise: preset.noise * t }));
  }

  return filters;
}

// ── Build effects filters ──────────────────────────────────
function buildEffectFilters(fx: EffectsState): any[] {
  const filters: any[] = [];

  if (fx.blur.enabled && fx.blur.value > 0) {
    filters.push(new fabric.Image.filters.Blur({ blur: fx.blur.value / 100 }));
  }
  if (fx.pixelate.enabled && fx.pixelate.value > 1) {
    filters.push(new fabric.Image.filters.Pixelate({ blocksize: fx.pixelate.value }));
  }
  if (fx.grain.enabled && fx.grain.value > 0) {
    filters.push(new fabric.Image.filters.Noise({ noise: fx.grain.value * 2 }));
  }
  if (fx.glitch) {
    filters.push(new fabric.Image.filters.ColorMatrix({
      matrix: [
        1.2, 0, 0.3, 0, 0,
        0, 0.9, 0, 0, 0,
        0.1, 0, 1.3, 0, 0,
        0, 0, 0, 1, 0,
      ],
    }));
  }
  if (fx.duotone.enabled) {
    const s = hexToRgb(fx.duotone.shadow);
    const h = hexToRgb(fx.duotone.highlight);
    if (s && h) {
      const dr = (h.r - s.r) / 255;
      const dg = (h.g - s.g) / 255;
      const db = (h.b - s.b) / 255;
      filters.push(new fabric.Image.filters.ColorMatrix({
        matrix: [
          dr * 0.33, dr * 0.33, dr * 0.33, 0, s.r / 255,
          dg * 0.33, dg * 0.33, dg * 0.33, 0, s.g / 255,
          db * 0.33, db * 0.33, db * 0.33, 0, s.b / 255,
          0, 0, 0, 1, 0,
        ],
      }));
    }
  }

  return filters;
}

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

// ── Component ──────────────────────────────────────────────
export default function FiltersPanel() {
  const activeFilterId = useEditorStore((s) => s.activeFilterId);
  const filterIntensity = useEditorStore((s) => s.filterIntensity);
  const effects = useEditorStore((s) => s.effects);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);
  const setActiveFilter = useEditorStore((s) => s.setActiveFilter);
  const setFilterIntensity = useEditorStore((s) => s.setFilterIntensity);
  const setEffect = useEditorStore((s) => s.setEffect);
  const resetEffects = useEditorStore((s) => s.resetEffects);
  const { canvasRef } = useCanvasContext();

  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [effectsOpen, setEffectsOpen] = useState(false);
  const [comparing, setComparing] = useState(false);
  const rafRef = useRef<number | null>(null);
  const savedFiltersRef = useRef<any[] | null>(null);

  // ── Generate thumbnails ────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    let sampleUrl = FALLBACK_IMAGE;

    if (canvas) {
      const img = canvas.getObjects().find((o: any) => o.type === 'image');
      if (img) {
        try {
          const origFilters = (img as any).filters;
          (img as any).filters = [];
          (img as any).applyFilters();
          sampleUrl = (img as any).toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 64 / ((img as any).width || 64) });
          (img as any).filters = origFilters;
          (img as any).applyFilters();
        } catch {
          // fallback
        }
      }
    }

    // Generate thumbnails one by one via rAF
    const thumbs: Record<string, string> = {};
    let idx = 0;

    function generateNext() {
      if (idx >= FILTER_PRESETS.length) {
        setThumbnails({ ...thumbs });
        return;
      }
      const preset = FILTER_PRESETS[idx];
      idx++;

      if (preset.id === 'none') {
        thumbs[preset.id] = sampleUrl;
        requestAnimationFrame(generateNext);
        return;
      }

      // Use offscreen canvas to apply filter
      const offCanvas = document.createElement('canvas');
      offCanvas.width = 64;
      offCanvas.height = 64;
      const offCtx = offCanvas.getContext('2d');
      if (!offCtx) {
        thumbs[preset.id] = sampleUrl;
        requestAnimationFrame(generateNext);
        return;
      }

      const imgEl = new Image();
      imgEl.crossOrigin = 'anonymous';
      imgEl.onload = () => {
        offCtx.drawImage(imgEl, 0, 0, 64, 64);

        // Apply CSS-like filter string for thumbnail preview
        const cssFilters: string[] = [];
        if (preset.brightness) cssFilters.push(`brightness(${1 + preset.brightness})`);
        if (preset.contrast) cssFilters.push(`contrast(${1 + preset.contrast})`);
        if (preset.saturation) cssFilters.push(`saturate(${1 + preset.saturation})`);
        if (preset.hue) cssFilters.push(`hue-rotate(${preset.hue}deg)`);
        if (preset.sepia) cssFilters.push(`sepia(${preset.sepia})`);

        if (cssFilters.length > 0) {
          offCtx.filter = cssFilters.join(' ');
          offCtx.drawImage(offCanvas, 0, 0);
          offCtx.filter = 'none';
        }

        // For matrix-based filters, apply as color transform on pixel data
        if (preset.matrix) {
          const imageData = offCtx.getImageData(0, 0, 64, 64);
          const d = imageData.data;
          const m = preset.matrix;
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
            d[i]     = Math.min(255, Math.max(0, m[0]*r + m[1]*g + m[2]*b + m[3]*a + m[4]*255));
            d[i + 1] = Math.min(255, Math.max(0, m[5]*r + m[6]*g + m[7]*b + m[8]*a + m[9]*255));
            d[i + 2] = Math.min(255, Math.max(0, m[10]*r + m[11]*g + m[12]*b + m[13]*a + m[14]*255));
          }
          offCtx.putImageData(imageData, 0, 0);
        }

        thumbs[preset.id] = offCanvas.toDataURL('image/jpeg', 0.7);
        requestAnimationFrame(generateNext);
      };
      imgEl.onerror = () => {
        thumbs[preset.id] = sampleUrl;
        requestAnimationFrame(generateNext);
      };
      imgEl.src = sampleUrl;
    }

    requestAnimationFrame(generateNext);
  }, [canvasRef]);

  // ── Apply filters to canvas ────────────────────────────
  const applyToCanvas = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const state = useEditorStore.getState();
      const preset = FILTER_PRESETS.find((p) => p.id === state.activeFilterId) || FILTER_PRESETS[0];
      const presetFilters = buildPresetFilters(preset, state.filterIntensity);
      const effectFilters = buildEffectFilters(state.effects);
      const combined = [...presetFilters, ...effectFilters];

      const objects = canvas.getObjects().filter((o: any) =>
        !o.__vignetteOverlay && o.type === 'image'
      );

      // Apply to active image (preset filters are separate from adjustment filters)
      const targets = objects.filter((o: any) => o.__layerId === state.activeLayerId);
      for (const obj of targets) {
        // Keep adjustment filters (tagged with __isAdjustment) and replace preset/effect filters
        const adjFilters = ((obj as any).filters || []).filter((f: any) => f.__isAdjustment);
        (obj as any).filters = [...adjFilters, ...combined];
        (obj as any).applyFilters();
      }

      canvas.renderAll();
    });
  }, [canvasRef]);

  useEffect(() => {
    applyToCanvas();
  }, [activeFilterId, filterIntensity, effects, activeLayerId, applyToCanvas]);

  // ── Compare (hold to see original) ─────────────────────
  const handleCompareDown = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects().find(
      (o: any) => o.__layerId === useEditorStore.getState().activeLayerId && o.type === 'image'
    );
    if (!obj) return;
    savedFiltersRef.current = (obj as any).filters || [];
    (obj as any).filters = [];
    (obj as any).applyFilters();
    canvas.renderAll();
    setComparing(true);
  }, [canvasRef]);

  const handleCompareUp = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !savedFiltersRef.current) return;
    const obj = canvas.getObjects().find(
      (o: any) => o.__layerId === useEditorStore.getState().activeLayerId && o.type === 'image'
    );
    if (!obj) return;
    (obj as any).filters = savedFiltersRef.current;
    (obj as any).applyFilters();
    canvas.renderAll();
    savedFiltersRef.current = null;
    setComparing(false);
  }, [canvasRef]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
          Filters
        </span>
        <div className="flex items-center gap-1">
          <button
            onMouseDown={handleCompareDown}
            onMouseUp={handleCompareUp}
            onMouseLeave={handleCompareUp}
            className={`rounded p-1 transition-colors ${
              comparing ? 'bg-[#e94560]/20 text-[#e94560]' : 'text-white/30 hover:bg-white/5 hover:text-white/60'
            }`}
            title="Hold to see original"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={resetEffects}
            className="rounded p-1 text-white/30 hover:bg-white/5 hover:text-white/60"
            title="Reset All Filters"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 px-3 pb-4">
          {/* Filter grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {FILTER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setActiveFilter(preset.id)}
                className={`group flex flex-col items-center gap-1 rounded-md p-1 transition-all hover:scale-105 ${
                  activeFilterId === preset.id
                    ? 'ring-2 ring-[#e94560] bg-white/5'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="h-[52px] w-[52px] overflow-hidden rounded bg-white/5">
                  {thumbnails[preset.id] ? (
                    <img
                      src={thumbnails[preset.id]}
                      alt={preset.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-white/10" />
                  )}
                </div>
                <span className="max-w-[56px] truncate text-[9px] text-white/50 group-hover:text-white/70">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>

          {/* Intensity slider */}
          {activeFilterId !== 'none' && (
            <div className="flex flex-col gap-1 border-t border-white/[0.06] pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/50">Intensity</span>
                <span className="text-[10px] tabular-nums text-white/30">{filterIntensity}%</span>
              </div>
              <Slider
                value={[filterIntensity]}
                onValueChange={(v) => setFilterIntensity(v[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          )}

          {/* Effects section */}
          <div className="border-t border-white/[0.06] pt-2">
            <button
              className="flex w-full items-center gap-1.5 py-1"
              onClick={() => setEffectsOpen(!effectsOpen)}
            >
              {effectsOpen ? (
                <ChevronDown className="h-3 w-3 text-white/30" />
              ) : (
                <ChevronRight className="h-3 w-3 text-white/30" />
              )}
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                Effects
              </span>
            </button>

            {effectsOpen && (
              <div className="mt-2 flex flex-col gap-3">
                {/* Blur */}
                <EffectRow
                  label="Blur"
                  enabled={effects.blur.enabled}
                  value={effects.blur.value}
                  min={0} max={20}
                  onToggle={(v) => setEffect('blur', { enabled: v })}
                  onChange={(v) => setEffect('blur', { value: v })}
                />
                {/* Pixelate */}
                <EffectRow
                  label="Pixelate"
                  enabled={effects.pixelate.enabled}
                  value={effects.pixelate.value}
                  min={1} max={30}
                  onToggle={(v) => setEffect('pixelate', { enabled: v })}
                  onChange={(v) => setEffect('pixelate', { value: v })}
                />
                {/* Grain */}
                <EffectRow
                  label="Grain"
                  enabled={effects.grain.enabled}
                  value={effects.grain.value}
                  min={0} max={100}
                  onToggle={(v) => setEffect('grain', { enabled: v })}
                  onChange={(v) => setEffect('grain', { value: v })}
                />
                {/* Glitch */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-white/50">Glitch</span>
                  <button
                    onClick={() => setEffect('glitch', !effects.glitch)}
                    className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      effects.glitch
                        ? 'bg-[#e94560] text-white'
                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {effects.glitch ? 'ON' : 'OFF'}
                  </button>
                </div>
                {/* Duotone */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/50">Duotone</span>
                    <button
                      onClick={() => setEffect('duotone', { enabled: !effects.duotone.enabled })}
                      className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        effects.duotone.enabled
                          ? 'bg-[#e94560] text-white'
                          : 'bg-white/5 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      {effects.duotone.enabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {effects.duotone.enabled && (
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1">
                        <span className="text-[9px] text-white/30">Shadow</span>
                        <input
                          type="color"
                          value={effects.duotone.shadow}
                          onChange={(e) => setEffect('duotone', { shadow: e.target.value })}
                          className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent"
                        />
                      </label>
                      <label className="flex items-center gap-1">
                        <span className="text-[9px] text-white/30">Highlight</span>
                        <input
                          type="color"
                          value={effects.duotone.highlight}
                          onChange={(e) => setEffect('duotone', { highlight: e.target.value })}
                          className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Effect row with toggle + slider ────────────────────────
function EffectRow({
  label, enabled, value, min, max, onToggle, onChange,
}: {
  label: string;
  enabled: boolean;
  value: number;
  min: number;
  max: number;
  onToggle: (v: boolean) => void;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/50">{label}</span>
        <div className="flex items-center gap-2">
          {enabled && (
            <span className="text-[10px] tabular-nums text-white/30">{value}</span>
          )}
          <button
            onClick={() => onToggle(!enabled)}
            className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
              enabled
                ? 'bg-[#e94560] text-white'
                : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
          >
            {enabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      {enabled && (
        <Slider
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
          min={min}
          max={max}
          step={1}
          className="w-full"
        />
      )}
    </div>
  );
}
