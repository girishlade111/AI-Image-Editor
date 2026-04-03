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
  Link,
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
    <div className="flex h-12 w-full items-center justify-between bg-[#0f3460] px-3">
      {/* LEFT Section */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[#e94560]">LS</span>
          <span className="text-sm font-medium text-white">Editor</span>
        </div>

        <Separator orientation="vertical" className="h-5 bg-white/[0.08]" />

        {/* File actions */}
        <div className="flex items-center gap-1">
          {/* New Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewClick}
            className="flex items-center gap-1.5 text-white/70 hover:bg-white/[0.06] hover:text-white"
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs">New</span>
          </Button>

          {/* Open Button with Dropdown */}
          <DropdownMenu open={showOpenMenu} onOpenChange={setShowOpenMenu}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 text-white/70 hover:bg-white/[0.06] hover:text-white"
              >
                <FolderOpen className="h-4 w-4" />
                <span className="text-xs">Open</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 bg-[#16213e] border-white/10">
              <DropdownMenuItem
                onClick={handleOpenImage}
                className="text-white/70 focus:bg-white/10 focus:text-white"
              >
                <Link className="mr-2 h-4 w-4" />
                Open Image
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleOpenProject}
                className="text-white/70 focus:bg-white/10 focus:text-white"
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Open Project (.json)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* CENTER Section */}
      <div className="flex items-center gap-1">
        {/* Undo */}
        <Button
          variant="ghost"
          size="icon"
          onClick={undo}
          disabled={historyIndex <= 0}
          className={cn(
            'h-7 w-7 text-white/50 hover:bg-white/[0.06] hover:text-white/80',
            historyIndex <= 0 && 'cursor-not-allowed opacity-30'
          )}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" strokeWidth={1.6} />
        </Button>

        {/* Redo */}
        <Button
          variant="ghost"
          size="icon"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className={cn(
            'h-7 w-7 text-white/50 hover:bg-white/[0.06] hover:text-white/80',
            historyIndex >= history.length - 1 && 'cursor-not-allowed opacity-30'
          )}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" strokeWidth={1.6} />
        </Button>

        <Separator orientation="vertical" className="mx-1.5 h-5 bg-white/[0.08]" />

        {/* Canvas Size Display */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onResizeCanvas}
          className="flex items-center gap-1 text-white/70 hover:bg-white/[0.06] hover:text-white"
        >
          <span className="text-xs tabular-nums">
            {canvasWidth} × {canvasHeight}
          </span>
        </Button>

        <Separator orientation="vertical" className="mx-1.5 h-5 bg-white/[0.08]" />

        {/* Zoom Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-white/70 hover:bg-white/[0.06] hover:text-white"
            >
              <span className="min-w-[46px] text-center text-xs tabular-nums">
                {formatZoom(zoom)}
              </span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-32 bg-[#16213e] border-white/10">
            {zoomPresets.map((preset) => (
              <DropdownMenuItem
                key={preset.label}
                onClick={() => handleZoomSelect(preset.value)}
                className={cn(
                  'text-xs text-white/70 focus:bg-white/10 focus:text-white',
                  formatZoom(zoom) === preset.label && 'bg-white/5 text-white'
                )}
              >
                {preset.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* RIGHT Section */}
      <div className="flex items-center gap-1">
        {/* Save Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          className="flex items-center gap-1.5 border-white/20 text-white/70 hover:bg-white/[0.06] hover:text-white"
        >
          <Download className="h-4 w-4" />
          <span className="text-xs">Save</span>
        </Button>

        {/* Export Button */}
        <Button
          size="sm"
          onClick={onExport}
          className="flex items-center gap-1.5 bg-[#e94560] text-white hover:bg-[#e94560]/80"
        >
          <Share className="h-4 w-4" />
          <span className="text-xs">Export</span>
        </Button>

        <Separator orientation="vertical" className="mx-1.5 h-5 bg-white/[0.08]" />

        {/* Pro Badge */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.open('#', '_blank');
          }}
          className="flex items-center rounded-full bg-gradient-to-r from-[#e94560] to-[#ff6b6b] px-3 py-1 text-[10px] font-bold text-white shadow-lg shadow-[#e94560]/20 transition-opacity hover:opacity-90"
        >
          PRO
        </a>
      </div>
    </div>
  );
}
