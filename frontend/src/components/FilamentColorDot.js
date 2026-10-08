/**
 * FilamentColorDot - Shows a circle with one or two colors (diagonal split).
 * Supports visual "finish" presets: normale | silk | metallic | marble | sparkle | galaxy | rainbow
 */
import './FilamentColorDot.css';

export const FINISH_PRESETS = [
  { value: 'normale', label: 'Normale' },
  { value: 'silk', label: 'Silk (lucido)' },
  { value: 'metallic', label: 'Metallic' },
  { value: 'marble', label: 'Marmo' },
  { value: 'sparkle', label: 'Sparkle (glitter)' },
  { value: 'galaxy', label: 'Galaxy (stellato)' },
  { value: 'rainbow', label: 'Rainbow (arcobaleno)' },
];

export const FINISH_LABEL = Object.fromEntries(FINISH_PRESETS.map(p => [p.value, p.label]));

/** Compute inline background style for a given finish + colors */
function getFinishStyle(color, color2, finish) {
  const c1 = color || '#FFFFFF';
  const c2 = color2 || c1;
  switch (finish) {
    case 'silk':
      return {
        background: color2
          ? `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), rgba(255,255,255,0) 55%), linear-gradient(135deg, ${c1} 50%, ${c2} 50%)`
          : `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), rgba(255,255,255,0) 55%), ${c1}`,
      };
    case 'metallic':
      return {
        background: color2
          ? `linear-gradient(135deg, ${c1} 0%, #ffffff 50%, ${c2} 100%)`
          : `linear-gradient(135deg, ${c1} 0%, rgba(255,255,255,0.85) 50%, ${c1} 100%)`,
      };
    case 'marble':
      return {
        background: `conic-gradient(from 45deg at 50% 50%, ${c1}, ${c2 !== c1 ? c2 : '#ffffff'}, ${c1}, ${c2 !== c1 ? c2 : '#dddddd'}, ${c1})`,
      };
    case 'sparkle':
      return {
        background: `radial-gradient(circle at 20% 25%, white 0.5px, transparent 1px), radial-gradient(circle at 70% 60%, white 0.5px, transparent 1px), radial-gradient(circle at 40% 80%, white 0.5px, transparent 1px), radial-gradient(circle at 85% 20%, white 0.5px, transparent 1px), radial-gradient(circle at 15% 70%, white 0.5px, transparent 1px), ${color2 ? `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)` : c1}`,
      };
    case 'galaxy':
      return {
        background: `radial-gradient(circle at 25% 30%, white 0.3px, transparent 0.8px), radial-gradient(circle at 65% 70%, white 0.3px, transparent 0.8px), radial-gradient(circle at 80% 40%, white 0.3px, transparent 0.8px), radial-gradient(circle at 20% 80%, white 0.3px, transparent 0.8px), radial-gradient(circle at 50% 50%, ${c2 !== c1 ? c2 : '#4b1a7a'} 0%, ${c1} 70%, #000 100%)`,
      };
    case 'rainbow':
      return {
        background: `conic-gradient(from 0deg, #ff0000, #ff9900, #ffee00, #00e676, #00c6ff, #5e35ff, #ff00e6, #ff0000)`,
      };
    case 'normale':
    default:
      return color2
        ? { background: `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)` }
        : { backgroundColor: c1 };
  }
}

export function FilamentColorDot({
  color = '#FFFFFF',
  color2 = '',
  finish = 'normale',
  size = 'w-5 h-5',
  showEffectBadge = false,
}) {
  const style = getFinishStyle(color, color2, finish);
  const title = `${color}${color2 ? ' / ' + color2 : ''}${finish && finish !== 'normale' ? ' · ' + FINISH_LABEL[finish] : ''}`;
  const effectClass = finish && finish !== 'normale' ? `filament-finish filament-finish-${finish}` : '';
  return (
    <span className="inline-flex items-center gap-1 shrink-0">
      <span
        className={`${size} rounded-full border border-border/60 shrink-0 ${effectClass}`}
        style={style}
        title={title}
        data-testid="filament-color-dot"
        data-finish={finish}
      />
      {showEffectBadge && finish && finish !== 'normale' && (
        <span className="text-[9px] uppercase tracking-wider px-1 rounded bg-muted text-muted-foreground font-mono">
          {finish}
        </span>
      )}
    </span>
  );
}
