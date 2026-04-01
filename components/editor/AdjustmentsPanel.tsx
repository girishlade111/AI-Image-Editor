'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ADJUSTMENT_FILTERS } from '@/constants/filters';
import {
  Sun,
  Contrast,
  Droplets,
  Palette,
  CloudFog,
  Sparkles,
  Grid3X3,
} from 'lucide-react';

const FILTER_ICON_MAP: Record<string, React.ElementType> = {
  Sun,
  Contrast,
  Droplets,
  Palette,
  CloudFog,
  Sparkles,
  Grid3X3,
};

export default function AdjustmentsPanel() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center px-3 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
          Adjustments
        </span>
      </div>
      <Separator className="bg-white/[0.06]" />

      {/* Adjustment sliders */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-3">
          {ADJUSTMENT_FILTERS.map((filter) => {
            const Icon = FILTER_ICON_MAP[filter.icon];
            return (
              <div key={filter.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {Icon && (
                      <Icon className="h-3.5 w-3.5 text-white/30" strokeWidth={1.8} />
                    )}
                    <span className="text-[11px] font-medium text-white/50">
                      {filter.label}
                    </span>
                  </div>
                  <span className="text-[10px] tabular-nums text-white/25">
                    {Object.values(filter.defaults)[0]}
                  </span>
                </div>
                <Slider
                  defaultValue={[Object.values(filter.defaults)[0]]}
                  min={filter.id === 'pixelate' ? 1 : -100}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
