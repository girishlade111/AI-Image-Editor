// ============================================================
// Fabric.js v5 — Type Declarations for LadeStack Editor
// ============================================================
// Fabric v5 CJS exports { fabric } — a namespace containing all classes.
// We declare both the module exports and a global namespace for type usage.

/* eslint-disable @typescript-eslint/no-namespace */

declare module 'fabric' {
  export const fabric: typeof import('fabric').fabric;

  namespace fabric {
    class Canvas {
      constructor(el: HTMLCanvasElement | string, options?: any);
      isDrawingMode: boolean;
      selection: boolean;
      freeDrawingBrush: BaseBrush;
      defaultCursor: string;
      hoverCursor: string;
      backgroundColor: string | any;
      viewportTransform: number[] | null;
      clipPath: Object | null;
      renderOnAddRemove: boolean;
      preserveObjectStacking: boolean;

      add(...objects: Object[]): Canvas;
      remove(...objects: Object[]): Canvas;
      renderAll(): Canvas;
      requestRenderAll(): void;
      dispose(): void;
      getObjects(): Object[];
      getActiveObject(): Object | null;
      getActiveObjects(): Object[];
      setActiveObject(object: Object): Canvas;
      discardActiveObject(): Canvas;
      getContext(): CanvasRenderingContext2D;
      getPointer(e: Event): { x: number; y: number };
      getCenter(): { top: number; left: number };
      getZoom(): number;
      setZoom(value: number): Canvas;
      zoomToPoint(point: Point, value: number): Canvas;
      viewportCenterObject(object: Object): Canvas;
      setViewportTransform(vpt: number[]): Canvas;
      getWidth(): number;
      getHeight(): number;
      setWidth(value: number): Canvas;
      setHeight(value: number): Canvas;
      setCursor(value: string): void;
      toJSON(propertiesToInclude?: string[]): any;
      toDataURL(options?: any): string;
      loadFromJSON(json: any, callback: () => void): Canvas;
      forEachObject(callback: (obj: Object) => void): void;
      on(eventName: string, handler: (...args: any[]) => void): Canvas;
      off(eventName: string, handler?: (...args: any[]) => void): Canvas;
    }

    class Point {
      constructor(x: number, y: number);
      x: number;
      y: number;
    }

    class Object {
      type?: string;
      left?: number;
      top?: number;
      width?: number;
      height?: number;
      scaleX?: number;
      scaleY?: number;
      angle?: number;
      opacity?: number;
      fill?: string | null;
      stroke?: string | null;
      strokeWidth?: number;
      strokeUniform?: boolean;
      strokeDashArray?: number[];
      selectable: boolean;
      evented: boolean;
      visible?: boolean;
      originX?: string;
      originY?: string;
      absolutePositioned?: boolean;
      excludeFromExport?: boolean;
      fontWeight?: string | number;
      fontStyle?: string;
      underline?: boolean;
      text?: string;

      set(key: string | Record<string, any>, value?: any): Object;
      setCoords(): Object;
      getBoundingRect(): { left: number; top: number; width: number; height: number };
      scale(value: number): Object;
      on(eventName: string, handler: (...args: any[]) => void): void;
      off(eventName: string, handler?: (...args: any[]) => void): void;

      [key: string]: any;
    }

    class Rect extends Object {
      constructor(options?: any);
    }

    class Ellipse extends Object {
      rx?: number;
      ry?: number;
      constructor(options?: any);
    }

    class Line extends Object {
      x1?: number;
      y1?: number;
      x2?: number;
      y2?: number;
      constructor(points?: number[], options?: any);
    }

    class Image extends Object {
      constructor(element: HTMLImageElement | HTMLCanvasElement, options?: any);
      static fromURL(url: string, callback: (img: Image) => void, imgOptions?: any): void;
    }

    class IText extends Object {
      text: string;
      fontFamily?: string;
      fontSize?: number;
      fontWeight?: string | number;
      fontStyle?: string;
      underline?: boolean;
      editable?: boolean;
      constructor(text: string, options?: any);
      enterEditing(): IText;
      exitEditing(): IText;
      selectAll(): IText;
    }

    class ActiveSelection extends Object {
      constructor(objects?: Object[], options?: any);
    }

    class PencilBrush extends BaseBrush {
      constructor(canvas: Canvas);
    }

    class BaseBrush {
      color: string;
      width: number;
      shadow: any;
      strokeLineCap: string;
      strokeLineJoin: string;
      strokeDashArray: number[] | null;
    }

    interface IEvent<E extends Event = Event> {
      e: E;
      target?: Object | null;
      [key: string]: any;
    }
  }
}
