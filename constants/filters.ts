// ============================================================
// Image filter / adjustment presets
// ============================================================

export interface FilterDefinition {
  id: string;
  label: string;
  icon: string;
  defaults: Record<string, number>;
}

export const ADJUSTMENT_FILTERS: FilterDefinition[] = [
  {
    id: 'brightness',
    label: 'Brightness',
    icon: 'Sun',
    defaults: { value: 0 },
  },
  {
    id: 'contrast',
    label: 'Contrast',
    icon: 'Contrast',
    defaults: { value: 0 },
  },
  {
    id: 'saturation',
    label: 'Saturation',
    icon: 'Droplets',
    defaults: { value: 0 },
  },
  {
    id: 'hue',
    label: 'Hue Rotation',
    icon: 'Palette',
    defaults: { value: 0 },
  },
  {
    id: 'blur',
    label: 'Blur',
    icon: 'CloudFog',
    defaults: { value: 0 },
  },
  {
    id: 'noise',
    label: 'Noise',
    icon: 'Sparkles',
    defaults: { value: 0 },
  },
  {
    id: 'pixelate',
    label: 'Pixelate',
    icon: 'Grid3X3',
    defaults: { value: 1 },
  },
];
