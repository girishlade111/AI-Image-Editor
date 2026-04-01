'use client';

import { useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import { useEditorStore } from '@/store/useEditorStore';
import { serializeCanvas, generateLayerId } from '@/lib/fabricHelpers';
import type { ToolType } from '@/types/editor';

/**
 * Manages all drawing-tool behaviours on the Fabric canvas.
 * Must be called from a component that has access to the canvas ref.
 */
export function useToolHandler(
  canvasRef: React.MutableRefObject<fabric.Canvas | null>
) {
  const activeTool = useEditorStore((s) => s.activeTool);
  const previousTool = useEditorStore((s) => s.previousTool);
  const brushSize = useEditorStore((s) => s.brushSize);
  const brushColor = useEditorStore((s) => s.brushColor);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const setBrushColor = useEditorStore((s) => s.setBrushColor);
  const addLayer = useEditorStore((s) => s.addLayer);
  const pushHistory = useEditorStore((s) => s.pushHistory);
  const setActiveLayer = useEditorStore((s) => s.setActiveLayer);
  const isCropping = useEditorStore((s) => s.isCropping);
  const setIsCropping = useEditorStore((s) => s.setIsCropping);
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);

  // Refs for shape-drawing state
  const isDrawingShape = useRef(false);
  const shapeStartPoint = useRef<{ x: number; y: number } | null>(null);
  const activeShape = useRef<fabric.Object | null>(null);

  // Refs for crop
  const cropRect = useRef<fabric.Rect | null>(null);
  const cropOverlay = useRef<fabric.Rect | null>(null);

  // ── Apply tool mode whenever activeTool changes ─────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Reset drawing mode first
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';
    isDrawingShape.current = false;

    // Remove any shape-drawing listeners (re-attached below if needed)
    canvas.off('mouse:down', handleShapeMouseDown);
    canvas.off('mouse:move', handleShapeMouseMove);
    canvas.off('mouse:up', handleShapeMouseUp);
    canvas.off('mouse:down', handleTextClick);
    canvas.off('mouse:down', handleEyedropperClick);
    canvas.off('mouse:down', handleCropMouseDown);
    canvas.off('mouse:move', handleCropMouseMove);
    canvas.off('mouse:up', handleCropMouseUp);

    switch (activeTool) {
      case 'select':
        applySelectTool(canvas);
        break;
      case 'brush':
        applyBrushTool(canvas);
        break;
      case 'eraser':
        applyEraserTool(canvas);
        break;
      case 'text':
        applyTextTool(canvas);
        break;
      case 'rectangle':
      case 'circle':
      case 'line':
        applyShapeTool(canvas);
        break;
      case 'eyedropper':
        applyEyedropperTool(canvas);
        break;
      case 'crop':
        applyCropTool(canvas);
        break;
    }

    return () => {
      // Cleanup on tool change
      canvas.off('mouse:down', handleShapeMouseDown);
      canvas.off('mouse:move', handleShapeMouseMove);
      canvas.off('mouse:up', handleShapeMouseUp);
      canvas.off('mouse:down', handleTextClick);
      canvas.off('mouse:down', handleEyedropperClick);
      canvas.off('mouse:down', handleCropMouseDown);
      canvas.off('mouse:move', handleCropMouseMove);
      canvas.off('mouse:up', handleCropMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

  // ── Live updates: brush size & color ────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.freeDrawingBrush) return;
    canvas.freeDrawingBrush.width = brushSize;
  }, [brushSize, canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.freeDrawingBrush) return;
    if (activeTool === 'brush') {
      canvas.freeDrawingBrush.color = brushColor;
    }
    // Eraser keeps white — don't update its color
  }, [brushColor, activeTool, canvasRef]);

  // ── Track object selection → activeLayerId ──────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onSelection = () => {
      const active = canvas.getActiveObject();
      if (active && (active as any).__layerId) {
        setActiveLayer((active as any).__layerId);
      }
    };
    canvas.on('selection:created', onSelection);
    canvas.on('selection:updated', onSelection);

    return () => {
      canvas.off('selection:created', onSelection);
      canvas.off('selection:updated', onSelection);
    };
  }, [canvasRef, setActiveLayer]);

  // ──────────────────────────────────────────────────────────
  // SELECT TOOL
  // ──────────────────────────────────────────────────────────
  function applySelectTool(canvas: fabric.Canvas) {
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';
    canvas.forEachObject((obj: fabric.Object) => {
      obj.selectable = true;
      obj.evented = true;
    });
  }

  // ──────────────────────────────────────────────────────────
  // BRUSH TOOL
  // ──────────────────────────────────────────────────────────
  function applyBrushTool(canvas: fabric.Canvas) {
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.width = brushSize;
    canvas.freeDrawingBrush.color = brushColor;
    (canvas.freeDrawingBrush as any).strokeLineCap = 'round';
    (canvas.freeDrawingBrush as any).strokeLineJoin = 'round';
    canvas.selection = false;
  }

  // ──────────────────────────────────────────────────────────
  // ERASER TOOL
  // ──────────────────────────────────────────────────────────
  function applyEraserTool(canvas: fabric.Canvas) {
    canvas.isDrawingMode = true;
    // Use EraserBrush if available, otherwise white PencilBrush
    if ((fabric as any).EraserBrush) {
      canvas.freeDrawingBrush = new (fabric as any).EraserBrush(canvas);
    } else {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      // Match canvas background for visual erasing
      const bg = canvas.backgroundColor;
      canvas.freeDrawingBrush.color =
        typeof bg === 'string' && bg ? bg : '#ffffff';
    }
    canvas.freeDrawingBrush.width = brushSize;
    canvas.selection = false;
  }

  // ──────────────────────────────────────────────────────────
  // TEXT TOOL
  // ──────────────────────────────────────────────────────────
  const handleTextClick = useCallback(
    (opt: fabric.IEvent<MouseEvent>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Don't create new text if clicking on existing object
      if (opt.target) return;

      const pointer = canvas.getPointer(opt.e);
      const color = useEditorStore.getState().brushColor;

      const text = new fabric.IText('Type here', {
        left: pointer.x,
        top: pointer.y,
        fontFamily: 'Inter, sans-serif',
        fontSize: 32,
        fill: color,
        editable: true,
      });

      const layerId = generateLayerId();
      (text as any).__layerId = layerId;

      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
      text.selectAll();

      addLayer({
        id: layerId,
        name: 'Text',
        visible: true,
        locked: false,
        opacity: 1,
        type: 'text',
      });

      // Handle empty text removal
      text.on('editing:exited', () => {
        if (!text.text || text.text.trim() === '' || text.text === 'Type here') {
          canvas.remove(text);
        } else {
          const snapshot = serializeCanvas(canvas);
          pushHistory(snapshot);
        }
      });

      canvas.renderAll();
    },
    [canvasRef, addLayer, pushHistory]
  );

  function applyTextTool(canvas: fabric.Canvas) {
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'text';
    canvas.hoverCursor = 'text';
    canvas.on('mouse:down', handleTextClick);
    canvas.forEachObject((obj: fabric.Object) => {
      obj.selectable = true;
      obj.evented = true;
    });
  }

  // ──────────────────────────────────────────────────────────
  // SHAPE TOOLS (Rectangle, Circle, Line)
  // ──────────────────────────────────────────────────────────
  const handleShapeMouseDown = useCallback(
    (opt: fabric.IEvent<MouseEvent>) => {
      const canvas = canvasRef.current;
      if (!canvas || opt.target) return;

      const pointer = canvas.getPointer(opt.e);
      shapeStartPoint.current = { x: pointer.x, y: pointer.y };
      isDrawingShape.current = true;

      const tool = useEditorStore.getState().activeTool;
      const color = useEditorStore.getState().brushColor;
      const sw = Math.max(1, useEditorStore.getState().brushSize / 3);

      let shape: fabric.Object;

      if (tool === 'rectangle') {
        shape = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: 'transparent',
          stroke: color,
          strokeWidth: sw,
          strokeUniform: true,
        });
      } else if (tool === 'circle') {
        shape = new fabric.Ellipse({
          left: pointer.x,
          top: pointer.y,
          rx: 0,
          ry: 0,
          fill: 'transparent',
          stroke: color,
          strokeWidth: sw,
          strokeUniform: true,
        });
      } else {
        // line
        shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: color,
          strokeWidth: sw,
          strokeUniform: true,
        });
      }

      shape.selectable = false;
      shape.evented = false;
      activeShape.current = shape;
      canvas.add(shape);
      canvas.renderAll();
    },
    [canvasRef]
  );

  const handleShapeMouseMove = useCallback(
    (opt: fabric.IEvent<MouseEvent>) => {
      const canvas = canvasRef.current;
      if (
        !canvas ||
        !isDrawingShape.current ||
        !shapeStartPoint.current ||
        !activeShape.current
      )
        return;

      const pointer = canvas.getPointer(opt.e);
      const start = shapeStartPoint.current;
      const shift = opt.e.shiftKey;
      const tool = useEditorStore.getState().activeTool;
      const shape = activeShape.current;

      if (tool === 'rectangle') {
        let w = pointer.x - start.x;
        let h = pointer.y - start.y;
        if (shift) {
          const size = Math.max(Math.abs(w), Math.abs(h));
          w = w < 0 ? -size : size;
          h = h < 0 ? -size : size;
        }
        (shape as fabric.Rect).set({
          left: w < 0 ? start.x + w : start.x,
          top: h < 0 ? start.y + h : start.y,
          width: Math.abs(w),
          height: Math.abs(h),
        });
      } else if (tool === 'circle') {
        let rx = Math.abs(pointer.x - start.x) / 2;
        let ry = Math.abs(pointer.y - start.y) / 2;
        if (shift) {
          const r = Math.max(rx, ry);
          rx = r;
          ry = r;
        }
        const cx = Math.min(start.x, pointer.x);
        const cy = Math.min(start.y, pointer.y);
        (shape as fabric.Ellipse).set({
          left: cx,
          top: cy,
          rx,
          ry,
        });
      } else if (tool === 'line') {
        let x2 = pointer.x;
        let y2 = pointer.y;
        if (shift) {
          const dx = pointer.x - start.x;
          const dy = pointer.y - start.y;
          const angle = Math.atan2(dy, dx);
          const snapped =
            Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
          const dist = Math.sqrt(dx * dx + dy * dy);
          x2 = start.x + dist * Math.cos(snapped);
          y2 = start.y + dist * Math.sin(snapped);
        }
        (shape as fabric.Line).set({ x2, y2 });
      }

      shape.setCoords();
      canvas.renderAll();
    },
    [canvasRef]
  );

  const handleShapeMouseUp = useCallback(
    () => {
      const canvas = canvasRef.current;
      const shape = activeShape.current;
      if (!canvas || !shape) return;

      isDrawingShape.current = false;
      shapeStartPoint.current = null;

      // Remove tiny accidental shapes
      const bounds = shape.getBoundingRect();
      if (bounds.width < 3 && bounds.height < 3) {
        canvas.remove(shape);
        activeShape.current = null;
        return;
      }

      shape.selectable = true;
      shape.evented = true;

      const tool = useEditorStore.getState().activeTool;
      const layerId = generateLayerId();
      (shape as any).__layerId = layerId;

      addLayer({
        id: layerId,
        name: tool === 'rectangle' ? 'Rectangle' : tool === 'circle' ? 'Ellipse' : 'Line',
        visible: true,
        locked: false,
        opacity: 1,
        type: tool,
      });

      activeShape.current = null;

      // shape reference may be invalidated by history system, use try-catch
      try {
        canvas.setActiveObject(shape);
        canvas.renderAll();
      } catch {
        // If shape was invalidated, try selecting the last object
        const objects = canvas.getObjects();
        if (objects.length > 0) {
          try {
            canvas.setActiveObject(objects[objects.length - 1]);
            canvas.renderAll();
          } catch {
            canvas.requestRenderAll();
          }
        }
      }
    },
    [canvasRef, addLayer]
  );

  function applyShapeTool(canvas: fabric.Canvas) {
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'crosshair';
    canvas.hoverCursor = 'crosshair';
    canvas.forEachObject((obj: fabric.Object) => {
      obj.selectable = false;
      obj.evented = false;
    });
    canvas.on('mouse:down', handleShapeMouseDown);
    canvas.on('mouse:move', handleShapeMouseMove);
    canvas.on('mouse:up', handleShapeMouseUp);
  }

  // ──────────────────────────────────────────────────────────
  // EYEDROPPER TOOL
  // ──────────────────────────────────────────────────────────
  const handleEyedropperClick = useCallback(
    (opt: fabric.IEvent<MouseEvent>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const pointer = canvas.getPointer(opt.e);
      const zoom = canvas.getZoom();
      const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

      // Calculate actual pixel position on the canvas element
      const x = pointer.x * zoom + vpt[4];
      const y = pointer.y * zoom + vpt[5];

      const ctx = canvas.getContext();
      if (!ctx) return;

      const pixel = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
      const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1]
        .toString(16)
        .padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;

      setBrushColor(hex);
      // Switch back to previous tool
      const prev = useEditorStore.getState().previousTool;
      setActiveTool(prev === 'eyedropper' ? 'select' : prev);
    },
    [canvasRef, setBrushColor, setActiveTool]
  );

  function applyEyedropperTool(canvas: fabric.Canvas) {
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'crosshair';
    canvas.hoverCursor = 'crosshair';
    canvas.forEachObject((obj: fabric.Object) => {
      obj.selectable = false;
      obj.evented = false;
    });
    canvas.on('mouse:down', handleEyedropperClick);
  }

  // ──────────────────────────────────────────────────────────
  // CROP TOOL (basic)
  // ──────────────────────────────────────────────────────────
  const handleCropMouseDown = useCallback(
    (opt: fabric.IEvent<MouseEvent>) => {
      const canvas = canvasRef.current;
      if (!canvas || isCropping) return;

      const pointer = canvas.getPointer(opt.e);
      shapeStartPoint.current = { x: pointer.x, y: pointer.y };
      isDrawingShape.current = true;

      const rect = new fabric.Rect({
        left: pointer.x,
        top: pointer.y,
        width: 0,
        height: 0,
        fill: 'rgba(233,69,96,0.08)',
        stroke: '#e94560',
        strokeWidth: 1.5,
        strokeDashArray: [6, 4],
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      cropRect.current = rect;
      canvas.add(rect);
      canvas.renderAll();
    },
    [canvasRef, isCropping]
  );

  const handleCropMouseMove = useCallback(
    (opt: fabric.IEvent<MouseEvent>) => {
      const canvas = canvasRef.current;
      if (!canvas || !isDrawingShape.current || !shapeStartPoint.current || !cropRect.current)
        return;

      const pointer = canvas.getPointer(opt.e);
      const start = shapeStartPoint.current;
      const w = pointer.x - start.x;
      const h = pointer.y - start.y;

      cropRect.current.set({
        left: w < 0 ? start.x + w : start.x,
        top: h < 0 ? start.y + h : start.y,
        width: Math.abs(w),
        height: Math.abs(h),
      });
      cropRect.current.setCoords();
      canvas.renderAll();
    },
    [canvasRef]
  );

  const handleCropMouseUp = useCallback(
    () => {
      const canvas = canvasRef.current;
      if (!canvas || !cropRect.current) return;

      isDrawingShape.current = false;
      const rect = cropRect.current;
      const bounds = rect.getBoundingRect();

      if (bounds.width < 10 || bounds.height < 10) {
        canvas.remove(rect);
        cropRect.current = null;
        return;
      }

      setIsCropping(true);
    },
    [canvasRef, setIsCropping]
  );

  function applyCropTool(canvas: fabric.Canvas) {
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'crosshair';
    canvas.hoverCursor = 'crosshair';
    canvas.forEachObject((obj: fabric.Object) => {
      obj.selectable = false;
      obj.evented = false;
    });
    canvas.on('mouse:down', handleCropMouseDown);
    canvas.on('mouse:move', handleCropMouseMove);
    canvas.on('mouse:up', handleCropMouseUp);
  }

  // ── Public crop actions ─────────────────────────────────
  const applyCrop = useCallback(() => {
    const canvas = canvasRef.current;
    const rect = cropRect.current;
    if (!canvas || !rect) return;

    const left = rect.left || 0;
    const top = rect.top || 0;
    const width = (rect.width || 0) * (rect.scaleX || 1);
    const height = (rect.height || 0) * (rect.scaleY || 1);

    // Remove crop rect from canvas
    canvas.remove(rect);
    cropRect.current = null;

    // Clip all objects to the crop area
    const clipPath = new fabric.Rect({
      left,
      top,
      width,
      height,
      absolutePositioned: true,
    });
    canvas.clipPath = clipPath;

    // Update canvas dimensions
    canvas.setWidth(width);
    canvas.setHeight(height);

    // Shift viewport to crop origin
    const vpt = canvas.viewportTransform;
    if (vpt) {
      vpt[4] = -left;
      vpt[5] = -top;
    }

    setCanvasSize(Math.round(width), Math.round(height));
    setIsCropping(false);
    setActiveTool('select');

    const snapshot = serializeCanvas(canvas);
    pushHistory(snapshot);
    canvas.renderAll();
  }, [canvasRef, setCanvasSize, setIsCropping, setActiveTool, pushHistory]);

  const cancelCrop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (cropRect.current) {
      canvas.remove(cropRect.current);
      cropRect.current = null;
    }

    setIsCropping(false);
    setActiveTool('select');
    canvas.renderAll();
  }, [canvasRef, setIsCropping, setActiveTool]);

  return { applyCrop, cancelCrop };
}
