'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Plus,
  Copy,
  Layers,
  GripVertical,
  ChevronDown,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/useEditorStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { BlendMode, LayerItem } from '@/types/editor';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Blend mode map ───────────────────────────────────────
const BLEND_MODES: { label: string; value: BlendMode; composite: string }[] = [
  { label: 'Normal', value: 'normal', composite: 'source-over' },
  { label: 'Multiply', value: 'multiply', composite: 'multiply' },
  { label: 'Screen', value: 'screen', composite: 'screen' },
  { label: 'Overlay', value: 'overlay', composite: 'overlay' },
  { label: 'Darken', value: 'darken', composite: 'darken' },
  { label: 'Lighten', value: 'lighten', composite: 'lighten' },
  { label: 'Color Dodge', value: 'color-dodge', composite: 'color-dodge' },
  { label: 'Color Burn', value: 'color-burn', composite: 'color-burn' },
  { label: 'Hard Light', value: 'hard-light', composite: 'hard-light' },
  { label: 'Soft Light', value: 'soft-light', composite: 'soft-light' },
  { label: 'Difference', value: 'difference', composite: 'difference' },
  { label: 'Exclusion', value: 'exclusion', composite: 'exclusion' },
];

// ── Helpers ──────────────────────────────────────────────

function findFabricObject(canvas: any, layerId: string): any | undefined {
  return canvas.getObjects().find((obj: any) => obj.__layerId === layerId);
}

function generateThumbnail(canvas: any, layerId: string): string | null {
  const obj = findFabricObject(canvas, layerId);
  if (!obj) return null;

  try {
    const bounds = obj.getBoundingRect();
    if (bounds.width < 1 || bounds.height < 1) return null;

    const offscreen = document.createElement('canvas');
    offscreen.width = 32;
    offscreen.height = 32;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return null;

    // Checkerboard background for transparency
    ctx.fillStyle = '#1e2237';
    ctx.fillRect(0, 0, 32, 32);
    for (let y = 0; y < 32; y += 4) {
      for (let x = 0; x < 32; x += 4) {
        if ((x + y) % 8 === 0) {
          ctx.fillStyle = '#262b44';
          ctx.fillRect(x, y, 4, 4);
        }
      }
    }

    const wasVisible = obj.visible;
    obj.set('visible', true);

    const objDataUrl = obj.toDataURL({
      format: 'png',
      multiplier: Math.min(32 / bounds.width, 32 / bounds.height, 1),
    });

    obj.set('visible', wasVisible);

    if (objDataUrl) {
      const img = new Image();
      img.src = objDataUrl;
      try {
        const scale = Math.min(32 / bounds.width, 32 / bounds.height);
        const sw = bounds.width * scale;
        const sh = bounds.height * scale;
        const sx = (32 - sw) / 2;
        const sy = (32 - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh);
      } catch {
        // Fallback
      }
    }

    return offscreen.toDataURL();
  } catch {
    return null;
  }
}

// ── Main Component ───────────────────────────────────────

export default function LayersPanel() {
  const layers = useEditorStore((s) => s.layers);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);
  const setActiveLayer = useEditorStore((s) => s.setActiveLayer);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const removeLayer = useEditorStore((s) => s.removeLayer);
  const addLayer = useEditorStore((s) => s.addLayer);
  const reorderLayers = useEditorStore((s) => s.reorderLayers);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);

  const { canvasRef } = useCanvasContext();

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string | null>>({});

  const activeLayer = layers.find((l) => l.id === activeLayerId) || null;

  // ── Thumbnail generation ──────────────────────────────
  const regenerateThumbnails = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    requestAnimationFrame(() => {
      const newThumbs: Record<string, string | null> = {};
      for (const layer of useEditorStore.getState().layers) {
        newThumbs[layer.id] = generateThumbnail(canvas, layer.id);
      }
      setThumbnails(newThumbs);
    });
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handler = () => regenerateThumbnails();
    canvas.on('object:modified', handler);
    canvas.on('object:added', handler);
    canvas.on('object:removed', handler);
    const timer = setTimeout(handler, 200);

    return () => {
      canvas.off('object:modified', handler);
      canvas.off('object:added', handler);
      canvas.off('object:removed', handler);
      clearTimeout(timer);
    };
  }, [canvasRef, regenerateThumbnails]);

  useEffect(() => {
    regenerateThumbnails();
  }, [layers.length, regenerateThumbnails]);

  // ── Canvas sync helpers ───────────────────────────────

  const syncVisibility = useCallback(
    (layerId: string, visible: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const obj = findFabricObject(canvas, layerId);
      if (obj) {
        obj.set('visible', visible);
        canvas.renderAll();
      }
    },
    [canvasRef]
  );

  const syncLock = useCallback(
    (layerId: string, locked: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const obj = findFabricObject(canvas, layerId);
      if (obj) {
        if (locked) {
          obj.set({
            selectable: false,
            evented: false,
            lockMovementX: true,
            lockMovementY: true,
            lockScalingX: true,
            lockScalingY: true,
            lockRotation: true,
          });
          if (canvas.getActiveObject() === obj) {
            canvas.discardActiveObject();
          }
        } else {
          obj.set({
            selectable: true,
            evented: true,
            lockMovementX: false,
            lockMovementY: false,
            lockScalingX: false,
            lockScalingY: false,
            lockRotation: false,
          });
        }
        canvas.renderAll();
      }
    },
    [canvasRef]
  );

  const syncOpacity = useCallback(
    (layerId: string, opacity: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const obj = findFabricObject(canvas, layerId);
      if (obj) {
        obj.set('opacity', opacity);
        canvas.renderAll();
      }
    },
    [canvasRef]
  );

  const syncBlendMode = useCallback(
    (layerId: string, blendMode: BlendMode) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const obj = findFabricObject(canvas, layerId);
      if (!obj) return;
      const mode = BLEND_MODES.find((m) => m.value === blendMode);
      if (mode) {
        obj.globalCompositeOperation = mode.composite;
        canvas.renderAll();
      }
    },
    [canvasRef]
  );

  const selectLayerOnCanvas = useCallback(
    (layerId: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const obj = findFabricObject(canvas, layerId);
      if (obj && obj.selectable) {
        canvas.setActiveObject(obj);
        canvas.renderAll();
      }
    },
    [canvasRef]
  );

  // ── Layer operations ──────────────────────────────────

  const handleAddLayer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const id = nanoid();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fab = require('fabric').fabric;
    const rect = new fab.Rect({
      left: 0,
      top: 0,
      width: canvasWidth,
      height: canvasHeight,
      fill: 'transparent',
      stroke: '',
      strokeWidth: 0,
      selectable: true,
      evented: true,
    });
    rect.__layerId = id;

    canvas.add(rect);
    canvas.renderAll();

    const layerNum = layers.length + 1;
    addLayer({
      id,
      name: `Layer ${layerNum}`,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal',
      type: 'layer',
    });
  }, [canvasRef, canvasWidth, canvasHeight, layers.length, addLayer]);

  const handleDuplicateLayer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeLayerId) return;

    const obj = findFabricObject(canvas, activeLayerId);
    if (!obj) return;

    obj.clone((cloned: any) => {
      const id = nanoid();
      cloned.__layerId = id;
      cloned.set({
        left: (cloned.left || 0) + 10,
        top: (cloned.top || 0) + 10,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();

      const srcLayer = layers.find((l: LayerItem) => l.id === activeLayerId);
      addLayer({
        id,
        name: `${srcLayer?.name || 'Layer'} copy`,
        visible: true,
        locked: false,
        opacity: srcLayer?.opacity ?? 1,
        blendMode: srcLayer?.blendMode ?? 'normal',
        type: srcLayer?.type || 'layer',
      });
    });
  }, [canvasRef, activeLayerId, layers, addLayer]);

  const handleDeleteLayer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeLayerId) return;

    const obj = findFabricObject(canvas, activeLayerId);
    if (obj) {
      canvas.remove(obj);
      canvas.renderAll();
    }
    removeLayer(activeLayerId);
  }, [canvasRef, activeLayerId, removeLayer]);

  const handleMergeDown = useCallback(() => {
    alert('Merge Down available in Pro — Coming Soon');
  }, []);

  // ── Visibility toggle ─────────────────────────────────

  const handleToggleVisibility = useCallback(
    (layer: LayerItem) => {
      const newVisible = !layer.visible;
      updateLayer(layer.id, { visible: newVisible });
      syncVisibility(layer.id, newVisible);
    },
    [updateLayer, syncVisibility]
  );

  // ── Lock toggle ───────────────────────────────────────

  const handleToggleLock = useCallback(
    (layer: LayerItem) => {
      const newLocked = !layer.locked;
      updateLayer(layer.id, { locked: newLocked });
      syncLock(layer.id, newLocked);
    },
    [updateLayer, syncLock]
  );

  // ── Layer click (select) ──────────────────────────────

  const handleLayerClick = useCallback(
    (layerId: string) => {
      setActiveLayer(layerId);
      selectLayerOnCanvas(layerId);
    },
    [setActiveLayer, selectLayerOnCanvas]
  );

  // ── Rename (double-click) ─────────────────────────────

  const handleStartRename = useCallback((layer: LayerItem) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  }, []);

  const handleFinishRename = useCallback(() => {
    if (editingLayerId && editingName.trim()) {
      updateLayer(editingLayerId, { name: editingName.trim() });
    }
    setEditingLayerId(null);
  }, [editingLayerId, editingName, updateLayer]);

  // ── Drag & Drop reorder ───────────────────────────────

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      dragIndexRef.current = index;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.opacity = '0.5';
      }
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    },
    []
  );

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDragOverIndex(null);
    dragIndexRef.current = null;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      const fromIndex = dragIndexRef.current;
      if (fromIndex === null || fromIndex === toIndex) {
        setDragOverIndex(null);
        return;
      }

      reorderLayers(fromIndex, toIndex);

      // Sync fabric z-order
      const canvas = canvasRef.current;
      if (canvas) {
        const currentLayers = useEditorStore.getState().layers;
        currentLayers.forEach((layer: LayerItem, idx: number) => {
          const obj = findFabricObject(canvas, layer.id);
          if (obj) {
            canvas.moveTo(obj, idx);
          }
        });
        canvas.renderAll();
      }

      setDragOverIndex(null);
      dragIndexRef.current = null;
    },
    [reorderLayers, canvasRef]
  );

  // ── Opacity change ────────────────────────────────────

  const handleOpacityChange = useCallback(
    (values: number[]) => {
      if (!activeLayerId) return;
      const opacity = values[0] / 100;
      updateLayer(activeLayerId, { opacity });
      syncOpacity(activeLayerId, opacity);
    },
    [activeLayerId, updateLayer, syncOpacity]
  );

  // ── Blend mode change ─────────────────────────────────

  const handleBlendModeChange = useCallback(
    (mode: BlendMode) => {
      if (!activeLayerId) return;
      updateLayer(activeLayerId, { blendMode: mode });
      syncBlendMode(activeLayerId, mode);
    },
    [activeLayerId, updateLayer, syncBlendMode]
  );

  // ── Render ────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">
      {/* Header — 40px */}
      <div className="flex h-10 shrink-0 items-center justify-between px-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
          Layers
        </span>
        <button
          onClick={handleAddLayer}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-white/30 transition-all duration-150 hover:bg-white/[0.06] hover:text-white/70"
          title="Add layer"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Separator */}
      <div className="h-px bg-metal-sep" />

      {/* Layer list */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-0.5 p-1.5">
          {layers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <Layers className="h-4 w-4 text-white/15" />
              </div>
              <span className="text-[11px] text-white/20">No layers yet</span>
              <span className="mt-0.5 text-[10px] text-white/10">
                Open an image to get started
              </span>
            </div>
          )}

          {/* Render layers in reverse (top layer = first in list) */}
          {[...layers].reverse().map((layer, visualIndex) => {
            const realIndex = layers.length - 1 - visualIndex;
            const isActive = layer.id === activeLayerId;
            const isDragTarget = dragOverIndex === realIndex;

            return (
              <div
                key={layer.id}
                draggable
                onDragStart={(e) => handleDragStart(e, realIndex)}
                onDragOver={(e) => handleDragOver(e, realIndex)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, realIndex)}
                onClick={() => handleLayerClick(layer.id)}
                className={cn(
                  'group flex h-11 cursor-pointer items-center gap-1.5 rounded-lg px-1.5 transition-all duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-[#e94560]/10 to-transparent border-l-[3px] border-l-[#e94560] shadow-[inset_0_1px_0_rgba(233,69,96,0.08)]'
                    : 'border-l-[3px] border-l-transparent hover:bg-white/[0.03]',
                  isDragTarget && 'ring-1 ring-[#e94560]/40',
                  !layer.visible && 'opacity-40'
                )}
              >
                {/* Drag handle */}
                <div className="flex h-5 w-4 shrink-0 cursor-grab items-center justify-center text-white/10 opacity-0 transition-opacity group-hover:opacity-100">
                  <GripVertical className="h-3 w-3" />
                </div>

                {/* Visibility toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleVisibility(layer);
                  }}
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors',
                    layer.visible
                      ? 'text-white/30 hover:text-white/60'
                      : 'text-white/15'
                  )}
                >
                  {layer.visible ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </button>

                {/* Thumbnail */}
                <div className="h-7 w-7 shrink-0 overflow-hidden rounded-md border border-white/[0.06] bg-white/[0.02]">
                  {thumbnails[layer.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbnails[layer.id]!}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        backgroundImage: `
                          linear-gradient(45deg, #262b44 25%, transparent 25%),
                          linear-gradient(-45deg, #262b44 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #262b44 75%),
                          linear-gradient(-45deg, transparent 75%, #262b44 75%)
                        `,
                        backgroundSize: '6px 6px',
                        backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                      }}
                    />
                  )}
                </div>

                {/* Layer name (double-click to rename) */}
                {editingLayerId === layer.id ? (
                  <input
                    autoFocus
                    className="flex-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] text-white/80 outline-none border border-[#e94560]/30"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleFinishRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename();
                      if (e.key === 'Escape') setEditingLayerId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className={cn(
                      'flex-1 truncate text-[11px] transition-colors',
                      isActive ? 'text-white/75 font-medium' : 'text-white/50'
                    )}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(layer);
                    }}
                  >
                    {layer.name}
                  </span>
                )}

                {/* Lock toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLock(layer);
                  }}
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded transition-all',
                    layer.locked
                      ? 'text-[#e94560]/70'
                      : 'text-white/10 opacity-0 group-hover:opacity-100 hover:text-white/40'
                  )}
                >
                  {layer.locked ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Unlock className="h-3 w-3" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Active layer details (opacity + blend mode) */}
      {activeLayer && (
        <>
          <div className="h-px bg-metal-sep" />
          <div className="shrink-0 space-y-2 px-3 py-2.5">
            {/* Opacity */}
            <div className="flex items-center gap-2">
              <span className="w-14 text-[10px] font-medium uppercase tracking-wider text-white/30">
                Opacity
              </span>
              <Slider
                className="flex-1"
                min={0}
                max={100}
                step={1}
                value={[Math.round(activeLayer.opacity * 100)]}
                onValueChange={handleOpacityChange}
              />
              <span className="w-8 text-right text-[10px] tabular-nums text-white/40 font-medium">
                {Math.round(activeLayer.opacity * 100)}%
              </span>
            </div>

            {/* Blend Mode */}
            <div className="flex items-center gap-2">
              <span className="w-14 text-[10px] font-medium uppercase tracking-wider text-white/30">
                Blend
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-1 items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-white/50 transition-all duration-150 hover:bg-white/[0.04] hover:border-white/[0.1]">
                    {BLEND_MODES.find((m) => m.value === activeLayer.blendMode)
                      ?.label || 'Normal'}
                    <ChevronDown className="h-3 w-3 text-white/20" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="max-h-64 overflow-y-auto bg-metal-card border-white/[0.08] shadow-metal-lg rounded-xl"
                >
                  {BLEND_MODES.map((mode) => (
                    <DropdownMenuItem
                      key={mode.value}
                      onClick={() => handleBlendModeChange(mode.value)}
                      className={cn(
                        'text-xs text-white/60 px-3 py-1.5 cursor-pointer',
                        activeLayer.blendMode === mode.value &&
                          'bg-[#e94560]/10 text-[#e94560]'
                      )}
                    >
                      {mode.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </>
      )}

      {/* Footer — operations bar */}
      <div className="h-px bg-metal-sep" />
      <div className="flex h-10 shrink-0 items-center justify-center gap-1 px-2">
        <button
          onClick={handleDeleteLayer}
          disabled={!activeLayerId}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 transition-all duration-150 hover:bg-white/[0.06] hover:text-red-400 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-white/20"
          title="Delete layer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDuplicateLayer}
          disabled={!activeLayerId}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 transition-all duration-150 hover:bg-white/[0.06] hover:text-white/60 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-white/20"
          title="Duplicate layer"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleMergeDown}
          disabled={!activeLayerId || layers.length < 2}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 transition-all duration-150 hover:bg-white/[0.06] hover:text-white/60 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-white/20"
          title="Merge down"
        >
          <Layers className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
