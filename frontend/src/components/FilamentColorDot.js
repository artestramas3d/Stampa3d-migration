/**
 * FilamentColorDot - Shows a circle with one or two colors (diagonal split)
 * @param {string} color - Primary hex color
 * @param {string} color2 - Secondary hex color (optional, for bicolor)
 * @param {string} size - CSS size (default "w-5 h-5")
 */
export function FilamentColorDot({ color = '#FFFFFF', color2 = '', size = 'w-5 h-5' }) {
  if (color2) {
    return (
      <div
        className={`${size} rounded-full border border-border/60 shrink-0`}
        style={{
          background: `linear-gradient(135deg, ${color} 50%, ${color2} 50%)`
        }}
        title={`${color} / ${color2}`}
        data-testid="filament-color-dot"
      />
    );
  }
  return (
    <div
      className={`${size} rounded-full border border-border/60 shrink-0`}
      style={{ backgroundColor: color }}
      title={color}
      data-testid="filament-color-dot"
    />
  );
}
