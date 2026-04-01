'use client';

import React, { useRef } from 'react';
import {
  MousePointer2,
  Crop,
  Paintbrush,
  Eraser,
  Type,
  Square,
  Circle,
  Minus,
  Pipette,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/useEditorStore';
import { TOOLS } from '@/constants/tools';
import type { ToolType } from '@/types/editor';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

const ICON_MAP: Record<string, React.ElementType> = {
  MousePointer2,
  Crop,
  Paintbrush,
  Eraser,
  Type,
  Square,
  Circle,
  Minus,
  Pipette,
};

export default function Toolbar() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const brushSize = useEditorStore((s) => s.brushSize);
  const brushColor = useEditorStore((s) => s.brushColor);
  const bgColor = useEditorStore((s) => s.bgColor);
  const setBrushColor = useEditorStore((s) => s.setBrushColor);
  const setBgColor = useEditorStore((s) => s.setBgColor);
  const swapColors = useEditorStore((s) => s.swapColors);

  const fgInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full w-14 flex-col items-center border-r border-white/[0.06] bg-[#16213e]">
        {/* ── Tool buttons ────────────────────────────────── */}
        <div className="flex flex-col items-center gap-0.5 py-3">
          {TOOLS.map((tool, idx) => {
            const Icon = ICON_MAP[tool.icon];
            const isActive = activeTool === tool.id;

            return (
              <React.Fragment key={tool.id}>
                {/* Separators between tool groups */}
                {(idx === 2 || idx === 4) && (
                  <Separator className="my-1.5 w-7 bg-white/[0.06]" />
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTool(tool.id as ToolType)}
                      className={cn(
                        'group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150',
                        isActive
                          ? 'bg-[#e94560] text-white shadow-lg shadow-[#e94560]/25'
                          : 'text-white/40 hover:bg-white/[0.06] hover:text-white/80'
                      )}
                    >
                      {Icon && (
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={8}
                    className="border-white/10 bg-[#0f3460] text-xs text-white"
                  >
                    {tool.label}
                    <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">
                      {tool.shortcut}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </React.Fragment>
            );
          })}
        </div>

        {/* ── Spacer ──────────────────────────────────────── */}
        <div className="flex-1" />

        {/* ── Brush size & Color swatches ──────────────────── */}
        <div className="flex flex-col items-center gap-3 pb-4">
          {/* Brush size display */}
          {(activeTool === 'brush' || activeTool === 'eraser') && (
            <div className="flex h-6 items-center justify-center rounded bg-white/[0.04] px-2">
              <span className="text-[10px] tabular-nums text-white/40">
                {brushSize}px
              </span>
            </div>
          )}

          <Separator className="w-7 bg-white/[0.06]" />

          {/* Color swatches */}
          <div className="relative h-12 w-10">
            {/* Background color swatch (behind) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => bgInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-7 w-7 rounded-md border-2 border-[#16213e] shadow-sm transition-transform hover:scale-110"
                  style={{ backgroundColor: bgColor }}
                />
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={8}
                className="border-white/10 bg-[#0f3460] text-xs text-white"
              >
                Background Color
              </TooltipContent>
            </Tooltip>

            {/* Foreground color swatch (in front) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => fgInputRef.current?.click()}
                  className="absolute left-0 top-0 z-10 h-7 w-7 rounded-md border-2 border-[#16213e] shadow-lg transition-transform hover:scale-110"
                  style={{ backgroundColor: brushColor }}
                />
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={8}
                className="border-white/10 bg-[#0f3460] text-xs text-white"
              >
                Foreground Color
              </TooltipContent>
            </Tooltip>

            {/* Hidden color inputs */}
            <input
              ref={fgInputRef}
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="invisible absolute h-0 w-0"
            />
            <input
              ref={bgInputRef}
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="invisible absolute h-0 w-0"
            />
          </div>

          {/* Swap colors button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={swapColors}
                className="flex h-6 w-6 items-center justify-center rounded text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white/50"
              >
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              sideOffset={8}
              className="border-white/10 bg-[#0f3460] text-xs text-white"
            >
              Swap Colors
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
