'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useEditorStore } from '@/store/useEditorStore';
import { fabric } from 'fabric';
import {
  Bold, Italic, Underline, Strikethrough, CaseSensitive,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ChevronDown, ChevronRight, FlipHorizontal, FlipVertical,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  Replace, Group, Ungroup,
} from 'lucide-react';

// ── Google Fonts list ──────────────────────────────────────
const FONT_LIST = [
  'Inter', 'Roboto', 'Poppins', 'Montserrat', 'Playfair Display',
  'Lato', 'Open Sans', 'Oswald', 'Raleway', 'Merriweather',
  'Bebas Neue', 'Dancing Script', 'Pacifico', 'Anton',
  'Source Code Pro', 'Courier New', 'Georgia', 'Times New Roman',
];

const FONT_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

const loadedFonts = new Set<string>();

async function loadGoogleFont(fontName: string) {
  if (loadedFonts.has(fontName)) return;
  const systemFonts = ['Courier New', 'Georgia', 'Times New Roman'];
  if (systemFonts.includes(fontName)) { loadedFonts.add(fontName); return; }
  try {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@100..900&display=swap`;
    document.head.appendChild(link);
    await document.fonts.ready;
    loadedFonts.add(fontName);
  } catch { /* ignore */ }
}

// ── Types ──────────────────────────────────────────────────
type SelectionType = 'none' | 'text' | 'image' | 'shape' | 'multi';

interface ObjProps {
  left: number; top: number; width: number; height: number;
  angle: number; opacity: number; scaleX: number; scaleY: number;
  // text
  fontFamily?: string; fontSize?: number; fontWeight?: number | string;
  fontStyle?: string; underline?: boolean; linethrough?: boolean;
  textAlign?: string; charSpacing?: number; lineHeight?: number;
  fill?: string; textBackgroundColor?: string;
  shadow?: { color: string; blur: number; offsetX: number; offsetY: number } | null;
  stroke?: string | null; strokeWidth?: number;
  // shape
  rx?: number; ry?: number; strokeDashArray?: number[] | null;
  flipX?: boolean; flipY?: boolean;
}

function getObjProps(obj: any): ObjProps {
  const sX = obj.scaleX || 1;
  const sY = obj.scaleY || 1;
  return {
    left: Math.round(obj.left || 0),
    top: Math.round(obj.top || 0),
    width: Math.round((obj.width || 0) * sX),
    height: Math.round((obj.height || 0) * sY),
    angle: Math.round(obj.angle || 0),
    opacity: Math.round((obj.opacity ?? 1) * 100),
    scaleX: sX, scaleY: sY,
    fontFamily: obj.fontFamily, fontSize: obj.fontSize,
    fontWeight: obj.fontWeight, fontStyle: obj.fontStyle,
    underline: obj.underline, linethrough: obj.linethrough,
    textAlign: obj.textAlign, charSpacing: obj.charSpacing ?? 0,
    lineHeight: obj.lineHeight ?? 1.16,
    fill: typeof obj.fill === 'string' ? obj.fill : '#000000',
    textBackgroundColor: obj.textBackgroundColor || '',
    shadow: obj.shadow ? {
      color: obj.shadow.color || '#000000',
      blur: obj.shadow.blur || 0,
      offsetX: obj.shadow.offsetX || 0,
      offsetY: obj.shadow.offsetY || 0,
    } : null,
    stroke: obj.stroke || null,
    strokeWidth: obj.strokeWidth || 0,
    rx: obj.rx || 0, ry: obj.ry || 0,
    strokeDashArray: obj.strokeDashArray || null,
    flipX: obj.flipX || false,
    flipY: obj.flipY || false,
  };
}

// ── Shared UI helpers ──────────────────────────────────────
function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button className="flex w-full items-center gap-1.5 py-1.5" onClick={onToggle}>
      {open ? <ChevronDown className="h-3 w-3 text-white/30" /> : <ChevronRight className="h-3 w-3 text-white/30" />}
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{label}</span>
    </button>
  );
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="shrink-0 text-[11px] text-white/40">{label}</span>
      {children}
    </div>
  );
}

function NumberInput({ value, onChange, min, max, step = 1, className = '' }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; className?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min} max={max} step={step}
      className={`w-16 rounded bg-white/5 px-1.5 py-0.5 text-right text-[11px] tabular-nums text-white/70 outline-none focus:bg-white/10 ${className}`}
    />
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-[68px] rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60 outline-none focus:bg-white/10" />
    </div>
  );
}

function ToggleBtn({ active, onClick, children, title }: {
  active: boolean; onClick: () => void; children: React.ReactNode; title?: string;
}) {
  return (
    <button onClick={onClick} title={title}
      className={`rounded p-1.5 text-[11px] transition-colors ${
        active ? 'bg-[#e94560]/20 text-[#e94560]' : 'text-white/40 hover:bg-white/5 hover:text-white/60'
      }`}>
      {children}
    </button>
  );
}

// ── Transform section (shared) ─────────────────────────────
function TransformSection({ props, onUpdate }: { props: ObjProps; onUpdate: (k: string, v: any) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Transform</span>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <PropRow label="X"><NumberInput value={props.left} onChange={(v) => onUpdate('left', v)} /></PropRow>
        <PropRow label="Y"><NumberInput value={props.top} onChange={(v) => onUpdate('top', v)} /></PropRow>
        <PropRow label="W"><NumberInput value={props.width} min={1} onChange={(v) => {
          const s = v / (props.width / (props.scaleX || 1));
          onUpdate('scaleX', s);
        }} /></PropRow>
        <PropRow label="H"><NumberInput value={props.height} min={1} onChange={(v) => {
          const s = v / (props.height / (props.scaleY || 1));
          onUpdate('scaleY', s);
        }} /></PropRow>
        <PropRow label="R"><NumberInput value={props.angle} min={0} max={360} onChange={(v) => onUpdate('angle', v)} /></PropRow>
      </div>
      <div className="flex gap-1">
        <ToggleBtn active={props.flipX || false} onClick={() => onUpdate('flipX', !props.flipX)} title="Flip H">
          <FlipHorizontal className="h-3.5 w-3.5" />
        </ToggleBtn>
        <ToggleBtn active={props.flipY || false} onClick={() => onUpdate('flipY', !props.flipY)} title="Flip V">
          <FlipVertical className="h-3.5 w-3.5" />
        </ToggleBtn>
      </div>
    </div>
  );
}

// ── Opacity section (shared) ───────────────────────────────
function OpacitySection({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/40">Opacity</span>
        <span className="text-[10px] tabular-nums text-white/30">{value}%</span>
      </div>
      <Slider value={[value]} onValueChange={(v) => onChange(v[0])} min={0} max={100} step={1} className="w-full" />
    </div>
  );
}

// ── TEXT PROPERTIES ────────────────────────────────────────
function TextProperties({ canvas }: { canvas: any }) {
  const [props, setProps] = useState<ObjProps | null>(null);
  const [shadowOpen, setShadowOpen] = useState(false);
  const [strokeOpen, setStrokeOpen] = useState(false);

  const refresh = useCallback(() => {
    const obj = canvas.getActiveObject();
    if (obj && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
      setProps(getObjProps(obj));
    }
  }, [canvas]);

  useEffect(() => {
    refresh();
    canvas.on('object:modified', refresh);
    canvas.on('selection:updated', refresh);
    return () => {
      canvas.off('object:modified', refresh);
      canvas.off('selection:updated', refresh);
    };
  }, [canvas, refresh]);

  const update = useCallback((key: string, value: any) => {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    if (key === 'opacity') {
      obj.set('opacity', value / 100);
    } else if (key === 'shadow') {
      obj.set('shadow', value ? new fabric.Shadow(value) : null);
    } else {
      obj.set(key as any, value);
    }
    canvas.renderAll();
    refresh();
  }, [canvas, refresh]);

  const handleFontChange = useCallback(async (font: string) => {
    await loadGoogleFont(font);
    update('fontFamily', font);
  }, [update]);

  if (!props) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Font */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Font</span>
        <select value={props.fontFamily || 'Inter'} onChange={(e) => handleFontChange(e.target.value)}
          className="rounded bg-white/5 px-2 py-1 text-[11px] text-white/70 outline-none">
          {FONT_LIST.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <div className="flex gap-2">
          <NumberInput value={props.fontSize || 32} min={8} max={400} onChange={(v) => update('fontSize', v)} className="flex-1" />
          <select value={String(props.fontWeight || 400)} onChange={(e) => update('fontWeight', Number(e.target.value))}
            className="flex-1 rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-white/70 outline-none">
            {FONT_WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
      </div>

      {/* Style toggles */}
      <div className="flex gap-0.5">
        <ToggleBtn active={props.fontWeight === 'bold' || (props.fontWeight as number) >= 700} onClick={() => {
          const isBold = props.fontWeight === 'bold' || (props.fontWeight as number) >= 700;
          update('fontWeight', isBold ? 400 : 'bold');
        }}><Bold className="h-3.5 w-3.5" /></ToggleBtn>
        <ToggleBtn active={props.fontStyle === 'italic'} onClick={() => update('fontStyle', props.fontStyle === 'italic' ? 'normal' : 'italic')}>
          <Italic className="h-3.5 w-3.5" />
        </ToggleBtn>
        <ToggleBtn active={!!props.underline} onClick={() => update('underline', !props.underline)}>
          <Underline className="h-3.5 w-3.5" />
        </ToggleBtn>
        <ToggleBtn active={!!props.linethrough} onClick={() => update('linethrough', !props.linethrough)}>
          <Strikethrough className="h-3.5 w-3.5" />
        </ToggleBtn>
        <ToggleBtn active={false} onClick={() => {
          const obj = canvas.getActiveObject();
          if (obj && obj.text) {
            const isUpper = obj.text === obj.text.toUpperCase();
            obj.set('text', isUpper ? obj.text.toLowerCase() : obj.text.toUpperCase());
            canvas.renderAll();
            refresh();
          }
        }} title="Uppercase"><CaseSensitive className="h-3.5 w-3.5" /></ToggleBtn>
      </div>

      {/* Alignment */}
      <div className="flex gap-0.5">
        {(['left', 'center', 'right', 'justify'] as const).map((a) => {
          const Icon = { left: AlignLeft, center: AlignCenter, right: AlignRight, justify: AlignJustify }[a];
          return (
            <ToggleBtn key={a} active={props.textAlign === a} onClick={() => update('textAlign', a)}>
              <Icon className="h-3.5 w-3.5" />
            </ToggleBtn>
          );
        })}
      </div>

      {/* Spacing */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Spacing</span>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/40">Letter</span>
            <span className="text-[10px] tabular-nums text-white/30">{Math.round((props.charSpacing || 0) / 10)}</span>
          </div>
          <Slider value={[(props.charSpacing || 0) / 10]} onValueChange={(v) => update('charSpacing', v[0] * 10)}
            min={-10} max={20} step={0.5} className="w-full" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/40">Line Height</span>
            <span className="text-[10px] tabular-nums text-white/30">{(props.lineHeight || 1.16).toFixed(2)}</span>
          </div>
          <Slider value={[props.lineHeight || 1.16]} onValueChange={(v) => update('lineHeight', v[0])}
            min={0.5} max={3} step={0.05} className="w-full" />
        </div>
      </div>

      {/* Color */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Color</span>
        <PropRow label="Text"><ColorInput value={props.fill || '#000000'} onChange={(v) => update('fill', v)} /></PropRow>
        <div className="flex items-center gap-2">
          <PropRow label="Bg">
            <ColorInput value={props.textBackgroundColor || '#ffffff'} onChange={(v) => update('textBackgroundColor', v)} />
          </PropRow>
          <button onClick={() => update('textBackgroundColor', '')}
            className="rounded px-1.5 py-0.5 text-[9px] text-white/30 hover:bg-white/5">None</button>
        </div>
      </div>

      {/* Shadow */}
      <div className="border-t border-white/[0.06] pt-2">
        <SectionHeader label="Shadow" open={shadowOpen} onToggle={() => setShadowOpen(!shadowOpen)} />
        {shadowOpen && (
          <div className="mt-1 flex flex-col gap-1.5">
            <ToggleBtn active={!!props.shadow} onClick={() => {
              update('shadow', props.shadow ? null : { color: '#000000', blur: 5, offsetX: 2, offsetY: 2 });
            }}>
              <span className="text-[10px]">{props.shadow ? 'Enabled' : 'Disabled'}</span>
            </ToggleBtn>
            {props.shadow && (
              <>
                <PropRow label="Color"><ColorInput value={props.shadow.color} onChange={(v) => update('shadow', { ...props.shadow, color: v })} /></PropRow>
                <PropRow label="Blur">
                  <Slider value={[props.shadow.blur]} onValueChange={(v) => update('shadow', { ...props.shadow, blur: v[0] })}
                    min={0} max={50} step={1} className="w-24" />
                </PropRow>
                <PropRow label="X">
                  <Slider value={[props.shadow.offsetX]} onValueChange={(v) => update('shadow', { ...props.shadow, offsetX: v[0] })}
                    min={-50} max={50} step={1} className="w-24" />
                </PropRow>
                <PropRow label="Y">
                  <Slider value={[props.shadow.offsetY]} onValueChange={(v) => update('shadow', { ...props.shadow, offsetY: v[0] })}
                    min={-50} max={50} step={1} className="w-24" />
                </PropRow>
              </>
            )}
          </div>
        )}
      </div>

      {/* Stroke */}
      <div className="border-t border-white/[0.06] pt-2">
        <SectionHeader label="Stroke" open={strokeOpen} onToggle={() => setStrokeOpen(!strokeOpen)} />
        {strokeOpen && (
          <div className="mt-1 flex flex-col gap-1.5">
            <ToggleBtn active={!!props.stroke} onClick={() => {
              update('stroke', props.stroke ? null : '#000000');
              if (!props.stroke) update('strokeWidth', 1);
            }}>
              <span className="text-[10px]">{props.stroke ? 'Enabled' : 'Disabled'}</span>
            </ToggleBtn>
            {props.stroke && (
              <>
                <PropRow label="Color"><ColorInput value={props.stroke} onChange={(v) => update('stroke', v)} /></PropRow>
                <PropRow label="Width">
                  <Slider value={[props.strokeWidth || 0]} onValueChange={(v) => update('strokeWidth', v[0])}
                    min={0} max={20} step={1} className="w-24" />
                </PropRow>
              </>
            )}
          </div>
        )}
      </div>

      {/* Transform + Opacity */}
      <div className="border-t border-white/[0.06] pt-2">
        <TransformSection props={props} onUpdate={update} />
      </div>
      <OpacitySection value={props.opacity} onChange={(v) => update('opacity', v)} />
    </div>
  );
}

// ── SHAPE PROPERTIES ───────────────────────────────────────
function ShapeProperties({ canvas }: { canvas: any }) {
  const [props, setProps] = useState<ObjProps | null>(null);
  const [fillType, setFillType] = useState<'solid' | 'gradient' | 'none'>('solid');
  const [gradColors, setGradColors] = useState({ from: '#e94560', to: '#0f3460' });
  const [gradDir, setGradDir] = useState<'horizontal' | 'vertical' | 'diagonal'>('horizontal');

  const refresh = useCallback(() => {
    const obj = canvas.getActiveObject();
    if (obj) {
      setProps(getObjProps(obj));
      if (!obj.fill || obj.fill === 'transparent') setFillType('none');
      else if (typeof obj.fill === 'object') setFillType('gradient');
      else setFillType('solid');
    }
  }, [canvas]);

  useEffect(() => {
    refresh();
    canvas.on('object:modified', refresh);
    canvas.on('selection:updated', refresh);
    return () => { canvas.off('object:modified', refresh); canvas.off('selection:updated', refresh); };
  }, [canvas, refresh]);

  const update = useCallback((key: string, value: any) => {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    if (key === 'opacity') obj.set('opacity', value / 100);
    else obj.set(key as any, value);
    canvas.renderAll();
    refresh();
  }, [canvas, refresh]);

  const applyGradient = useCallback((from: string, to: string, dir: string) => {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    const w = obj.width || 100, h = obj.height || 100;
    const coords = dir === 'horizontal' ? { x1: 0, y1: 0, x2: w, y2: 0 }
      : dir === 'vertical' ? { x1: 0, y1: 0, x2: 0, y2: h }
      : { x1: 0, y1: 0, x2: w, y2: h };
    obj.set('fill', new fabric.Gradient({
      type: 'linear', coords,
      colorStops: [{ offset: 0, color: from }, { offset: 1, color: to }],
    }));
    canvas.renderAll();
    refresh();
  }, [canvas, refresh]);

  const getStrokeStyle = (): string => {
    if (!props?.strokeDashArray || props.strokeDashArray.length === 0) return 'solid';
    if (props.strokeDashArray[0] >= 5) return 'dashed';
    return 'dotted';
  };

  if (!props) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Fill */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Fill</span>
        <div className="flex gap-1">
          {(['solid', 'gradient', 'none'] as const).map((t) => (
            <button key={t} onClick={() => {
              setFillType(t);
              if (t === 'none') update('fill', 'transparent');
              else if (t === 'solid') update('fill', props.fill || '#000000');
              else applyGradient(gradColors.from, gradColors.to, gradDir);
            }} className={`rounded px-2 py-0.5 text-[10px] capitalize transition-colors ${
              fillType === t ? 'bg-[#e94560]/20 text-[#e94560]' : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}>{t}</button>
          ))}
        </div>
        {fillType === 'solid' && (
          <ColorInput value={props.fill || '#000000'} onChange={(v) => update('fill', v)} />
        )}
        {fillType === 'gradient' && (
          <div className="flex flex-col gap-1.5">
            <PropRow label="From"><ColorInput value={gradColors.from} onChange={(v) => {
              setGradColors((c) => ({ ...c, from: v }));
              applyGradient(v, gradColors.to, gradDir);
            }} /></PropRow>
            <PropRow label="To"><ColorInput value={gradColors.to} onChange={(v) => {
              setGradColors((c) => ({ ...c, to: v }));
              applyGradient(gradColors.from, v, gradDir);
            }} /></PropRow>
            <select value={gradDir} onChange={(e) => {
              const d = e.target.value;
              setGradDir(d as any);
              applyGradient(gradColors.from, gradColors.to, d);
            }} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60 outline-none">
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
              <option value="diagonal">Diagonal</option>
            </select>
          </div>
        )}
      </div>

      {/* Stroke */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Stroke</span>
        <ColorInput value={props.stroke || '#000000'} onChange={(v) => update('stroke', v)} />
        <PropRow label="Width">
          <Slider value={[props.strokeWidth || 0]} onValueChange={(v) => update('strokeWidth', v[0])}
            min={0} max={50} step={1} className="w-24" />
        </PropRow>
        <PropRow label="Style">
          <select value={getStrokeStyle()} onChange={(e) => {
            const map: Record<string, number[]> = { solid: [], dashed: [10, 5], dotted: [2, 5] };
            update('strokeDashArray', map[e.target.value]);
          }} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60 outline-none">
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </PropRow>
      </div>

      {/* Corner radius (rect only) */}
      {(canvas.getActiveObject()?.type === 'rect') && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/40">Corner Radius</span>
            <span className="text-[10px] tabular-nums text-white/30">{props.rx || 0}</span>
          </div>
          <Slider value={[props.rx || 0]} onValueChange={(v) => { update('rx', v[0]); update('ry', v[0]); }}
            min={0} max={100} step={1} className="w-full" />
        </div>
      )}

      {/* Transform + Opacity */}
      <div className="border-t border-white/[0.06] pt-2">
        <TransformSection props={props} onUpdate={update} />
      </div>
      <OpacitySection value={props.opacity} onChange={(v) => update('opacity', v)} />
    </div>
  );
}

// ── IMAGE PROPERTIES ───────────────────────────────────────
function ImageProperties({ canvas }: { canvas: any }) {
  const [props, setProps] = useState<ObjProps | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    const obj = canvas.getActiveObject();
    if (obj) setProps(getObjProps(obj));
  }, [canvas]);

  useEffect(() => {
    refresh();
    canvas.on('object:modified', refresh);
    canvas.on('selection:updated', refresh);
    return () => { canvas.off('object:modified', refresh); canvas.off('selection:updated', refresh); };
  }, [canvas, refresh]);

  const update = useCallback((key: string, value: any) => {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    if (key === 'opacity') obj.set('opacity', value / 100);
    else obj.set(key as any, value);
    canvas.renderAll();
    refresh();
  }, [canvas, refresh]);

  const handleReplace = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const obj = canvas.getActiveObject();
      if (!obj || obj.type !== 'image') return;
      fabric.Image.fromURL(url, (newImg: any) => {
        obj.setElement(newImg.getElement());
        obj.set({ width: newImg.width, height: newImg.height });
        canvas.renderAll();
        refresh();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [canvas, refresh]);

  if (!props) return null;

  return (
    <div className="flex flex-col gap-3">
      <button onClick={handleReplace}
        className="flex items-center gap-1.5 rounded bg-white/5 px-2.5 py-1.5 text-[11px] text-white/60 hover:bg-white/10">
        <Replace className="h-3.5 w-3.5" /> Replace Image
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      <TransformSection props={props} onUpdate={update} />
      <OpacitySection value={props.opacity} onChange={(v) => update('opacity', v)} />
    </div>
  );
}

// ── MULTI-SELECTION PROPERTIES ─────────────────────────────
function MultiProperties({ canvas }: { canvas: any }) {
  const align = useCallback((dir: string) => {
    const sel = canvas.getActiveObject();
    if (!sel || sel.type !== 'activeSelection') return;
    const objects = (sel as any)._objects as any[];
    if (!objects || objects.length < 2) return;

    const bounds = sel.getBoundingRect();

    objects.forEach((obj: any) => {
      const objBounds = obj.getBoundingRect(true);
      switch (dir) {
        case 'left': obj.set('left', obj.left! - (objBounds.left - bounds.left)); break;
        case 'centerH': obj.set('left', obj.left! - (objBounds.left + objBounds.width / 2 - bounds.left - bounds.width / 2)); break;
        case 'right': obj.set('left', obj.left! - (objBounds.left + objBounds.width - bounds.left - bounds.width)); break;
        case 'top': obj.set('top', obj.top! - (objBounds.top - bounds.top)); break;
        case 'centerV': obj.set('top', obj.top! - (objBounds.top + objBounds.height / 2 - bounds.top - bounds.height / 2)); break;
        case 'bottom': obj.set('top', obj.top! - (objBounds.top + objBounds.height - bounds.top - bounds.height)); break;
      }
      obj.setCoords();
    });
    canvas.renderAll();
  }, [canvas]);

  const distribute = useCallback((axis: 'h' | 'v') => {
    const sel = canvas.getActiveObject();
    if (!sel || sel.type !== 'activeSelection') return;
    const objects = [...(sel as any)._objects] as any[];
    if (objects.length < 3) return;

    if (axis === 'h') {
      objects.sort((a: any, b: any) => a.left - b.left);
      const first = objects[0].getBoundingRect(true);
      const last = objects[objects.length - 1].getBoundingRect(true);
      const totalWidth = objects.reduce((s: number, o: any) => s + o.getBoundingRect(true).width, 0);
      const gap = (last.left + last.width - first.left - totalWidth) / (objects.length - 1);
      let x = first.left;
      objects.forEach((obj: any) => {
        const b = obj.getBoundingRect(true);
        obj.set('left', obj.left! + (x - b.left));
        obj.setCoords();
        x += b.width + gap;
      });
    } else {
      objects.sort((a: any, b: any) => a.top - b.top);
      const first = objects[0].getBoundingRect(true);
      const last = objects[objects.length - 1].getBoundingRect(true);
      const totalHeight = objects.reduce((s: number, o: any) => s + o.getBoundingRect(true).height, 0);
      const gap = (last.top + last.height - first.top - totalHeight) / (objects.length - 1);
      let y = first.top;
      objects.forEach((obj: any) => {
        const b = obj.getBoundingRect(true);
        obj.set('top', obj.top! + (y - b.top));
        obj.setCoords();
        y += b.height + gap;
      });
    }
    canvas.renderAll();
  }, [canvas]);

  const groupObjects = useCallback(() => {
    const sel = canvas.getActiveObject();
    if (!sel || sel.type !== 'activeSelection') return;
    (sel as any).toGroup();
    canvas.renderAll();
  }, [canvas]);

  const ungroupObjects = useCallback(() => {
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'group') return;
    (obj as any).toActiveSelection();
    canvas.renderAll();
  }, [canvas]);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[11px] text-white/40">Multiple objects selected</span>

      {/* Align */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Align</span>
        <div className="flex gap-0.5">
          <ToggleBtn active={false} onClick={() => align('left')} title="Align Left"><AlignStartVertical className="h-3.5 w-3.5" /></ToggleBtn>
          <ToggleBtn active={false} onClick={() => align('centerH')} title="Align Center H"><AlignCenterVertical className="h-3.5 w-3.5" /></ToggleBtn>
          <ToggleBtn active={false} onClick={() => align('right')} title="Align Right"><AlignEndVertical className="h-3.5 w-3.5" /></ToggleBtn>
          <ToggleBtn active={false} onClick={() => align('top')} title="Align Top"><AlignStartHorizontal className="h-3.5 w-3.5" /></ToggleBtn>
          <ToggleBtn active={false} onClick={() => align('centerV')} title="Align Middle"><AlignCenterHorizontal className="h-3.5 w-3.5" /></ToggleBtn>
          <ToggleBtn active={false} onClick={() => align('bottom')} title="Align Bottom"><AlignEndHorizontal className="h-3.5 w-3.5" /></ToggleBtn>
        </div>
      </div>

      {/* Distribute */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Distribute</span>
        <div className="flex gap-1">
          <button onClick={() => distribute('h')}
            className="rounded bg-white/5 px-2.5 py-1 text-[10px] text-white/50 hover:bg-white/10">Horizontal</button>
          <button onClick={() => distribute('v')}
            className="rounded bg-white/5 px-2.5 py-1 text-[10px] text-white/50 hover:bg-white/10">Vertical</button>
        </div>
      </div>

      {/* Group/Ungroup */}
      <div className="flex gap-1">
        <button onClick={groupObjects}
          className="flex items-center gap-1 rounded bg-white/5 px-2.5 py-1 text-[10px] text-white/50 hover:bg-white/10">
          <Group className="h-3 w-3" /> Group
        </button>
        <button onClick={ungroupObjects}
          className="flex items-center gap-1 rounded bg-white/5 px-2.5 py-1 text-[10px] text-white/50 hover:bg-white/10">
          <Ungroup className="h-3 w-3" /> Ungroup
        </button>
      </div>
    </div>
  );
}

// ── MAIN PROPERTIES PANEL ──────────────────────────────────
export default function PropertiesPanel() {
  const { canvasRef } = useCanvasContext();
  const [selectionType, setSelectionType] = useState<SelectionType>('none');

  const detectSelection = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) { setSelectionType('none'); return; }

    const active = canvas.getActiveObject();
    if (!active) { setSelectionType('none'); return; }

    const actives = canvas.getActiveObjects();
    if (actives.length > 1) { setSelectionType('multi'); return; }

    const t = active.type;
    if (t === 'i-text' || t === 'text' || t === 'textbox') setSelectionType('text');
    else if (t === 'image') setSelectionType('image');
    else if (t === 'rect' || t === 'circle' || t === 'ellipse' || t === 'line' || t === 'polygon' || t === 'path') setSelectionType('shape');
    else setSelectionType('shape'); // default to shape for unknown
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    detectSelection();
    canvas.on('selection:created', detectSelection);
    canvas.on('selection:updated', detectSelection);
    canvas.on('selection:cleared', detectSelection);
    canvas.on('object:modified', detectSelection);

    return () => {
      canvas.off('selection:created', detectSelection);
      canvas.off('selection:updated', detectSelection);
      canvas.off('selection:cleared', detectSelection);
      canvas.off('object:modified', detectSelection);
    };
  }, [canvasRef, detectSelection]);

  const canvas = canvasRef.current;

  if (!canvas || selectionType === 'none') {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-[11px] text-white/20">Select an object to see properties</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Properties</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-3 pb-4">
          {selectionType === 'text' && <TextProperties canvas={canvas} />}
          {selectionType === 'image' && <ImageProperties canvas={canvas} />}
          {selectionType === 'shape' && <ShapeProperties canvas={canvas} />}
          {selectionType === 'multi' && <MultiProperties canvas={canvas} />}
        </div>
      </ScrollArea>
    </div>
  );
}
