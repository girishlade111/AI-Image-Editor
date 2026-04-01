import type { ToolType } from '@/types/editor';

export interface ToolDefinition {
  id: ToolType;
  label: string;
  icon: string; // lucide icon name
  shortcut: string;
}

export const TOOLS: ToolDefinition[] = [
  { id: 'select', label: 'Select', icon: 'MousePointer2', shortcut: 'V' },
  { id: 'crop', label: 'Crop', icon: 'Crop', shortcut: 'C' },
  { id: 'brush', label: 'Brush', icon: 'Paintbrush', shortcut: 'B' },
  { id: 'eraser', label: 'Eraser', icon: 'Eraser', shortcut: 'E' },
  { id: 'text', label: 'Text', icon: 'Type', shortcut: 'T' },
  { id: 'rectangle', label: 'Rectangle', icon: 'Square', shortcut: 'R' },
  { id: 'circle', label: 'Circle', icon: 'Circle', shortcut: 'O' },
  { id: 'line', label: 'Line', icon: 'Minus', shortcut: 'L' },
  { id: 'eyedropper', label: 'Eyedropper', icon: 'Pipette', shortcut: 'I' },
];
