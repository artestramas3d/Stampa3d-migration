export const VARIANTS_BY_MATERIAL = {
  PLA: ['Basic', 'Matte', 'Silk', 'Silk Dual', 'Metal', 'Galaxy', 'Sparkle', 'Marble', 'Wood', 'Glow', 'Translucent', 'Rainbow', 'Tough', 'HF', 'CF'],
  'PLA+': ['Basic', 'Matte', 'Silk', 'HF'],
  PETG: ['Basic', 'HF', 'Matte', 'Translucent', 'Galaxy', 'Tough', 'CF'],
  ABS: ['Basic', 'Matte', 'GF', 'CF'],
  ASA: ['Basic', 'Matte', 'Aero', 'CF'],
  TPU: ['95A', '90A', '85A', '68D', 'for AMS'],
  Nylon: ['PA6', 'PA12', 'CF', 'GF'],
  'PETG-CF': ['Basic'],
};

const VARIANT_FINISH = {
  silk: 'silk', 'silk dual': 'silk', metal: 'metallic', metallic: 'metallic',
  galaxy: 'galaxy', sparkle: 'sparkle', glitter: 'sparkle', marble: 'marble', rainbow: 'rainbow',
};

export const finishForVariant = (variant) => VARIANT_FINISH[(variant || '').trim().toLowerCase()];

export const filamentName = (f) => `${f.material_type || ''}${f.variant ? ` ${f.variant}` : ''}`;

export function variantOptions(material, ...sources) {
  const mat = (material || '').trim().toLowerCase();
  const key = Object.keys(VARIANTS_BY_MATERIAL).find(k => k.toLowerCase() === mat);
  const out = [...(key ? VARIANTS_BY_MATERIAL[key] : [])];
  sources.flat().forEach(item => {
    const v = (item?.variant || '').trim();
    if (v && (item.material_type || '').trim().toLowerCase() === mat && !out.some(o => o.toLowerCase() === v.toLowerCase())) out.push(v);
  });
  return out;
}
