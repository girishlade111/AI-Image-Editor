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
  { id: 'brightness', label: 'Brightness', icon: 'Sun', defaults: { value: 0 } },
  { id: 'contrast', label: 'Contrast', icon: 'Contrast', defaults: { value: 0 } },
  { id: 'saturation', label: 'Saturation', icon: 'Droplets', defaults: { value: 0 } },
  { id: 'hue', label: 'Hue Rotation', icon: 'Palette', defaults: { value: 0 } },
  { id: 'blur', label: 'Blur', icon: 'CloudFog', defaults: { value: 0 } },
  { id: 'noise', label: 'Noise', icon: 'Sparkles', defaults: { value: 0 } },
  { id: 'pixelate', label: 'Pixelate', icon: 'Grid3X3', defaults: { value: 1 } },
];

// ============================================================
// Instagram-style preset filters
// ============================================================

export interface FilterPreset {
  id: string;
  name: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  sepia?: number;
  blur?: number;
  noise?: number;
  matrix?: number[];
}

export const FILTER_PRESETS: FilterPreset[] = [
  // 1. None
  { id: 'none', name: 'None' },

  // 2. Vivid
  { id: 'vivid', name: 'Vivid', saturation: 0.5, contrast: 0.15 },

  // 3. Cool
  {
    id: 'cool', name: 'Cool', saturation: -0.15,
    matrix: [
      0.9, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0, 0, 1.15, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },

  // 4. Warm
  {
    id: 'warm', name: 'Warm', saturation: 0.2,
    matrix: [
      1.15, 0, 0, 0, 0,
      0, 1.05, 0, 0, 0,
      0, 0, 0.85, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },

  // 5. Dramatic
  { id: 'dramatic', name: 'Dramatic', contrast: 0.45, saturation: -0.3, brightness: -0.1 },

  // 6. Fade
  { id: 'fade', name: 'Fade', contrast: -0.2, saturation: -0.25, brightness: 0.1 },

  // 7. Matte
  {
    id: 'matte', name: 'Matte', contrast: -0.15, brightness: 0.05, noise: 15,
    matrix: [
      1.05, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0, 0, 0.95, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },

  // 8. Chrome
  {
    id: 'chrome', name: 'Chrome', contrast: 0.3,
    matrix: [
      1.1, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0, 0, 1.1, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },

  // 9. Noir
  { id: 'noir', name: 'Noir', saturation: -0.9, contrast: 0.4, brightness: -0.05 },

  // 10. Vintage
  {
    id: 'vintage', name: 'Vintage', saturation: -0.2, contrast: -0.1, brightness: 0.05,
    matrix: [
      1.1, 0.05, 0, 0, 0,
      0, 1.0, 0.05, 0, 0,
      0, 0, 0.85, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },

  // 11. Lomo
  {
    id: 'lomo', name: 'Lomo', saturation: 0.4, contrast: 0.25,
    matrix: [
      1.1, 0, 0, 0, 0,
      0, 1.05, 0.05, 0, 0,
      0, 0.1, 1.0, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },

  // 12. Sepia
  {
    id: 'sepia', name: 'Sepia',
    matrix: [
      0.393, 0.769, 0.189, 0, 0,
      0.349, 0.686, 0.168, 0, 0,
      0.272, 0.534, 0.131, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },

  // 13. Blueprint
  {
    id: 'blueprint', name: 'Blueprint', contrast: -0.15,
    matrix: [
      0.3, 0.3, 0.3, 0, 0,
      0.3, 0.4, 0.3, 0, 0,
      0.4, 0.5, 0.8, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },

  // 14. Golden Hour
  {
    id: 'golden-hour', name: 'Golden Hour', brightness: 0.08, saturation: 0.15,
    matrix: [
      1.2, 0.05, 0, 0, 0,
      0, 1.1, 0, 0, 0,
      0, 0, 0.8, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },

  // 15. Moonlight
  {
    id: 'moonlight', name: 'Moonlight', saturation: -0.35, brightness: -0.05,
    matrix: [
      0.85, 0, 0.05, 0, 0,
      0, 0.9, 0.1, 0, 0,
      0.05, 0.1, 1.1, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },

  // 16. Punch
  { id: 'punch', name: 'Punch', saturation: 0.6, contrast: 0.35 },

  // 17. Soft Glow
  { id: 'soft-glow', name: 'Soft Glow', brightness: 0.15, blur: 0.03, contrast: -0.1 },

  // 18. Clarity
  {
    id: 'clarity', name: 'Clarity', contrast: 0.25, saturation: -0.1,
    matrix: [
      0.95, 0, 0.05, 0, 0,
      0, 1.0, 0.05, 0, 0,
      0, 0, 1.1, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },

  // 19. Film
  {
    id: 'film', name: 'Film', brightness: 0.05, noise: 20,
    matrix: [
      1.1, 0.03, 0, 0, 0,
      0, 1.05, 0.03, 0, 0,
      0, 0, 0.9, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },

  // 20. Midnight
  {
    id: 'midnight', name: 'Midnight', brightness: -0.15, saturation: -0.2,
    matrix: [
      0.7, 0, 0.1, 0, 0,
      0, 0.7, 0.15, 0, 0,
      0.1, 0.15, 1.0, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
];
