'use client';

import React from 'react';
import { Eye, EyeOff, Lock, Unlock, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/useEditorStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function LayersPanel() {
  const layers = useEditorStore((s) => s.layers);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);
  const setActiveLayer = useEditorStore((s) => s.setActiveLayer);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const removeLayer = useEditorStore((s) => s.removeLayer);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
          Layers
        </span>
        <button className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <Separator className="bg-white/[0.06]" />

      {/* Layer list */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-px p-1.5">
          {layers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.03]">
                <Plus className="h-4 w-4 text-white/15" />
              </div>
              <span className="text-[11px] text-white/20">No layers yet</span>
              <span className="mt-0.5 text-[10px] text-white/10">
                Open an image to get started
              </span>
            </div>
          )}

          {layers.map((layer) => {
            const isActive = layer.id === activeLayerId;
            return (
              <div
                key={layer.id}
                onClick={() => setActiveLayer(layer.id)}
                className={cn(
                  'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
                  isActive
                    ? 'bg-[#e94560]/10 ring-1 ring-[#e94560]/30'
                    : 'hover:bg-white/[0.04]'
                )}
              >
                {/* Visibility toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { visible: !layer.visible });
                  }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center text-white/30 hover:text-white/60"
                >
                  {layer.visible ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </button>

                {/* Layer name */}
                <span className="flex-1 truncate text-[11px] text-white/60">
                  {layer.name}
                </span>

                {/* Lock toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { locked: !layer.locked });
                  }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center text-white/20 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  {layer.locked ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Unlock className="h-3 w-3" />
                  )}
                </button>

                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLayer(layer.id);
                  }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center text-white/20 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
