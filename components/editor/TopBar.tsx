'use client';

import React from 'react';
import {
  Download,
  Upload,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Settings,
  Sparkles,
  FilePlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/useEditorStore';
import { formatZoom } from '@/lib/fabricHelpers';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function TopBar() {
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const historyIndex = useEditorStore((s) => s.historyIndex);
  const history = useEditorStore((s) => s.history);
  const setShowNewCanvasDialog = useEditorStore((s) => s.setShowNewCanvasDialog);

  return (
    <div className="flex h-12 w-full items-center justify-between border-b border-white/[0.06] bg-[#0f3460] px-3">
      {/* Left — Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e94560] shadow-lg shadow-[#e94560]/20">
            <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">
            LadeStack
          </span>
          <Badge
            variant="secondary"
            className="h-4 border-0 bg-white/10 px-1.5 text-[9px] font-medium text-white/60"
          >
            BETA
          </Badge>
        </div>
        <Separator orientation="vertical" className="h-5 bg-white/[0.08]" />

        {/* File actions */}
        <div className="flex items-center gap-0.5">
          <TopBarButton
            icon={FilePlus}
            label="New Canvas"
            onClick={() => setShowNewCanvasDialog(true)}
          />
          <TopBarButton icon={Upload} label="Open (Ctrl+O)" />
          <TopBarButton icon={Download} label="Export" />
        </div>
      </div>

      {/* Center — History & Zoom */}
      <div className="flex items-center gap-1">
        <TopBarButton
          icon={Undo2}
          label="Undo (Ctrl+Z)"
          disabled={historyIndex <= 0}
          onClick={undo}
        />
        <TopBarButton
          icon={Redo2}
          label="Redo (Ctrl+Shift+Z)"
          disabled={historyIndex >= history.length - 1}
          onClick={redo}
        />
        <Separator orientation="vertical" className="mx-1.5 h-5 bg-white/[0.08]" />
        <TopBarButton
          icon={ZoomOut}
          label="Zoom out (Ctrl+-)"
          onClick={() => setZoom(zoom * 0.8)}
        />
        <span className="min-w-[46px] text-center text-[11px] tabular-nums text-white/50">
          {formatZoom(zoom)}
        </span>
        <TopBarButton
          icon={ZoomIn}
          label="Zoom in (Ctrl+=)"
          onClick={() => setZoom(zoom * 1.2)}
        />
      </div>

      {/* Right — Settings */}
      <div className="flex items-center gap-1">
        <TopBarButton icon={Settings} label="Settings" />
      </div>
    </div>
  );
}

function TopBarButton({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-7 w-7 text-white/50 hover:bg-white/[0.06] hover:text-white/80',
        disabled && 'cursor-not-allowed opacity-30'
      )}
      title={label}
    >
      <Icon className="h-4 w-4" strokeWidth={1.6} />
    </Button>
  );
}
