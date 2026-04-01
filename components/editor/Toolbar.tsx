'use client';

import React from 'react';
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

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full w-14 flex-col items-center gap-0.5 border-r border-white/[0.06] bg-[#16213e] py-3">
        {TOOLS.map((tool, idx) => {
          const Icon = ICON_MAP[tool.icon];
          const isActive = activeTool === tool.id;

          return (
            <React.Fragment key={tool.id}>
              {/* Separator after crop (index 1) and after eraser (index 3) */}
              {(idx === 2 || idx === 4) && (
                <Separator className="my-1.5 w-7 bg-white/[0.06]" />
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTool(tool.id as ToolType)}
                    className={cn(
                      'group relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150',
                      isActive
                        ? 'bg-[#e94560] text-white shadow-lg shadow-[#e94560]/25'
                        : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
                    )}
                  >
                    {Icon && <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={8}
                  className="border-white/10 bg-[#0f3460] text-xs text-white"
                >
                  {tool.label}
                  <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono">
                    {tool.shortcut}
                  </span>
                </TooltipContent>
              </Tooltip>
            </React.Fragment>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
