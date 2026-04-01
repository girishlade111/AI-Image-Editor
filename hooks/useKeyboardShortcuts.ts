'use client';

import { useEffect, useCallback } from 'react';
import { fabric } from 'fabric';
import { useEditorStore } from '@/store/useEditorStore';
import { TOOLS } from '@/constants/tools';
import type { ToolType } from '@/types/editor';

/**
 * Global keyboard shortcut handler for the editor.
 * Accepts a ref to the current Fabric canvas so it can
 * dispatch canvas-level commands (delete, select all, etc.).
 */
export function useKeyboardShortcuts(
  canvasRef: React.MutableRefObject<fabric.Canvas | null>,
  options?: {
    onOpenFile?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onResetZoom?: () => void;
  }
) {
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const setBrushSize = useEditorStore((s) => s.setBrushSize);
  const brushSize = useEditorStore((s) => s.brushSize);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      // ── Ctrl / Cmd shortcuts ──────────────────────────
      if (ctrl) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            return;

          case 'y':
            e.preventDefault();
            redo();
            return;

          case 'o':
            e.preventDefault();
            options?.onOpenFile?.();
            return;

          case 'a':
            e.preventDefault();
            {
              const canvas = canvasRef.current;
              if (canvas) {
                canvas.discardActiveObject();
                const sel = new fabric.ActiveSelection(canvas.getObjects(), {
                  canvas,
                });
                canvas.setActiveObject(sel);
                canvas.requestRenderAll();
              }
            }
            return;

          case '=':
          case '+':
            e.preventDefault();
            options?.onZoomIn?.();
            return;

          case '-':
            e.preventDefault();
            options?.onZoomOut?.();
            return;

          case '0':
            e.preventDefault();
            options?.onResetZoom?.();
            return;

          case 'b': {
            const canvas = canvasRef.current;
            if (canvas) {
              const active = canvas.getActiveObject();
              if (active && active.type === 'i-text') {
                e.preventDefault();
                const txt = active as fabric.IText;
                const isBold = txt.fontWeight === 'bold';
                txt.set('fontWeight', isBold ? 'normal' : 'bold');
                canvas.requestRenderAll();
              }
            }
            return;
          }

          case 'i': {
            const canvas = canvasRef.current;
            if (canvas) {
              const active = canvas.getActiveObject();
              if (active && active.type === 'i-text') {
                e.preventDefault();
                const txt = active as fabric.IText;
                const isItalic = txt.fontStyle === 'italic';
                txt.set('fontStyle', isItalic ? 'normal' : 'italic');
                canvas.requestRenderAll();
              }
            }
            return;
          }

          case 'u': {
            const canvas = canvasRef.current;
            if (canvas) {
              const active = canvas.getActiveObject();
              if (active && active.type === 'i-text') {
                e.preventDefault();
                const txt = active as fabric.IText;
                const isUnderline = txt.underline;
                txt.set('underline', !isUnderline);
                canvas.requestRenderAll();
              }
            }
            return;
          }
        }
        return;
      }

      // ── No-modifier shortcuts ─────────────────────────
      if (!e.altKey) {
        // Escape → deselect
        if (e.key === 'Escape') {
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.discardActiveObject();
            canvas.requestRenderAll();
          }
          return;
        }

        // Delete / Backspace → delete selected objects
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const canvas = canvasRef.current;
          if (canvas) {
            const active = canvas.getActiveObjects();
            if (active.length > 0) {
              e.preventDefault();
              active.forEach((obj: any) => canvas.remove(obj));
              canvas.discardActiveObject();
              canvas.requestRenderAll();
            }
          }
          return;
        }

        // [ → decrease brush size
        if (e.key === '[') {
          e.preventDefault();
          setBrushSize(Math.max(1, brushSize - 5));
          return;
        }

        // ] → increase brush size
        if (e.key === ']') {
          e.preventDefault();
          setBrushSize(Math.min(200, brushSize + 5));
          return;
        }

        // Single-key tool shortcuts
        const key = e.key.toUpperCase();
        const tool = TOOLS.find((t) => t.shortcut === key);
        if (tool) {
          e.preventDefault();
          setActiveTool(tool.id as ToolType);
        }
      }
    },
    [setActiveTool, undo, redo, setBrushSize, brushSize, canvasRef, options]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
