'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  FolderOpen,
  Download,
  Share,
  Undo2,
  Redo2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/useEditorStore';
import { formatZoom } from '@/lib/fabricHelpers';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopBarProps {
  onOpenImage: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onExport: () => void;
  onResizeCanvas: () => void;
}

export default function TopBar({
  onOpenImage,
  onOpenProject,
  onSaveProject,
  onExport,
  onResizeCanvas,
}: TopBarProps) {
  const {
    zoom,
    setZoom,
    canvasWidth,
    canvasHeight,
    historyIndex,
    history,
    undo,
    redo,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    setShowNewCanvasDialog,
  } = useEditorStore();

  const [showOpenMenu, setShowOpenMenu] = useState(false);

  const handleNewClick = useCallback(() => {
    if (hasUnsavedChanges) {
      if (window.confirm('Discard unsaved changes?')) {
        setShowNewCanvasDialog(true);
      }
    } else {
      setShowNewCanvasDialog(true);
    }
  }, [hasUnsavedChanges, setShowNewCanvasDialog]);

  const handleOpenImage = useCallback(() => {
    setShowOpenMenu(false);
    onOpenImage();
  }, [onOpenImage]);

  const handleOpenProject = useCallback(() => {
    setShowOpenMenu(false);
    onOpenProject();
  }, [onOpenProject]);

  const handleSave = useCallback(() => {
    onSaveProject();
    setHasUnsavedChanges(false);
  }, [onSaveProject, setHasUnsavedChanges]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const zoomPresets = [
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '100%', value: 1 },
    { label: '150%', value: 1.5 },
    { label: '200%', value: 2 },
    { label: 'Fit to Screen', value: -1 },
    { label: 'Fill Screen', value: -2 },
  ];

  const handleZoomSelect = useCallback(
    (value: number) => {
      if (value === -1 || value === -2) {
        const canvasEl = document.querySelector('.canvas-container') as HTMLElement;
        if (canvasEl) {
          const containerWidth = canvasEl.parentElement?.clientWidth || 800;
          const containerHeight = canvasEl.parentElement?.clientHeight || 600;
          if (value === -1) {
            const scaleX = (containerWidth - 40) / canvasWidth;
            const scaleY = (containerHeight - 40) / canvasHeight;
            setZoom(Math.min(scaleX, scaleY, 1));
          } else {
            const scaleX = (containerWidth - 40) / canvasWidth;
            const scaleY = (containerHeight - 40) / canvasHeight;
            setZoom(Math.max(scaleX, scaleY));
          }
        }
      } else {
        setZoom(value);
      }
    },
    [canvasWidth, canvasHeight, setZoom]
  );

  return (
    <div className="flex h-12 w-full items-center justify-between bg-metal-topbar border-b border-white/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
      {/* LEFT Section */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#e94560] to-[#ff6b6b] shadow-[0_2px_8px_rgba(233,69,96,0.3)]">
            <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-white/90 tracking-tight">LadeStack</span>
        </div>

        <Separator orientation="vertical" className="h-5 bg-white/[0.06]" />

        {/* File actions */}
        <div className="flex items-center gap-0.5">
          {/* New Button */}
          <button
            onClick={handleNewClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/60 hover:text-white/90 hover:bg-white/[0.06] transition-all duration-150"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">New</span>
          </button>

          {/* Open Button with Dropdown */}
          <DropdownMenu open={showOpenMenu} onOpenChange={setShowOpenMenu}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/60 hover:text-white/90 hover:bg-white/[0.06] transition-all duration-150">
                <FolderOpen className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium">Open</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-metal-card border-white/[0.08] shadow-metal-lg rounded-xl overflow-hidden">
              <DropdownMenuItem
                onClick={handleOpenImage}
                className="text-white/70 focus:bg-white/[0.06] focus:text-white px-3 py-2 text-xs cursor-pointer"
              >
                <FolderOpen className="mr-2.5 h-3.5 w-3.5 text-white/40" />
                Open Image
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleOpenProject}
                className="text-white/70 focus:bg-white/[0.06] focus:text-white px-3 py-2 text-xs cursor-pointer"
              >
                <FolderOpen className="mr-2.5 h-3.5 w-3.5 text-white/40" />
                Open Project (.json)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* CENTER Section */}
      <div className="flex items-center gap-1">
        {/* Undo */}
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150',
            historyIndex <= 0
              ? 'text-white/15 cursor-not-allowed'
              : 'text-white/40 hover:bg-white/[0.06] hover:text-white/80'
          )}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150',
            historyIndex >= history.length - 1
              ? 'text-white/15 cursor-not-allowed'
              : 'text-white/40 hover:bg-white/[0.06] hover:text-white/80'
          )}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>

        <Separator orientation="vertical" className="mx-1.5 h-5 bg-white/[0.06]" />

        {/* Canvas Size Display */}
        <button
          onClick={onResizeCanvas}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-white/50 hover:bg-white/[0.06] hover:text-white/80 transition-all duration-150"
        >
          <span className="text-[11px] tabular-nums font-medium">
            {canvasWidth} × {canvasHeight}
          </span>
        </button>

        <Separator orientation="vertical" className="mx-1.5 h-5 bg-white/[0.06]" />

        {/* Zoom Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-white/50 hover:bg-white/[0.06] hover:text-white/80 transition-all duration-150">
              <span className="min-w-[46px] text-center text-[11px] tabular-nums font-medium">
                {formatZoom(zoom)}
              </span>
              <ChevronDown className="h-3 w-3 text-white/30" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-36 bg-metal-card border-white/[0.08] shadow-metal-lg rounded-xl overflow-hidden">
            {zoomPresets.map((preset) => (
              <DropdownMenuItem
                key={preset.label}
                onClick={() => handleZoomSelect(preset.value)}
                className={cn(
                  'text-xs text-white/70 focus:bg-white/[0.06] focus:text-white px-3 py-1.5 cursor-pointer',
                  formatZoom(zoom) === preset.label && 'text-white bg-white/[0.04]'
                )}
              >
                {preset.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* RIGHT Section */}
      <div className="flex items-center gap-1.5">
        {/* Save Button */}
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white/90 hover:border-white/[0.12] transition-all duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="text-[11px] font-medium">Save</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white text-[11px] font-medium shadow-[0_2px_8px_rgba(233,69,96,0.25)] hover:shadow-[0_4px_16px_rgba(233,69,96,0.35)] hover:from-[#f05a73] hover:to-[#ff8080] transition-all duration-150"
        >
          <Share className="h-3.5 w-3.5" />
          <span>Export</span>
        </button>

        <Separator orientation="vertical" className="mx-1 h-5 bg-white/[0.06]" />

        {/* Pro Badge */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.open('#', '_blank');
          }}
          className="flex items-center rounded-full bg-gradient-to-r from-[#e94560] to-[#ff6b6b] px-2.5 py-0.5 text-[9px] font-bold text-white shadow-[0_2px_8px_rgba(233,69,96,0.3)] transition-all duration-150 hover:shadow-[0_4px_16px_rgba(233,69,96,0.4)] hover:scale-105"
        >
          PRO
        </a>
      </div>
    </div>
  );
}
