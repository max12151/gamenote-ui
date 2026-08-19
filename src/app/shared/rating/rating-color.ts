export function ratingColor(note: number): string {
  const t = (note - 1) / 9;
  const hue = 120 * t;
  const saturation = 100 + t * 6;
  const lightness = 25 + t * 25;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
