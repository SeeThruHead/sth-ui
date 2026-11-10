export type Alignment = "start" | "end" | "center"

export const easeInOutQuad = (t: number): number => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)

export const scrollChange = (
  target: { readonly start: number; readonly size: number },
  viewSize: number,
  alignment: Alignment,
  offset: number
): number => {
  if (alignment === "end") return target.start + target.size - viewSize + offset
  if (alignment === "center") return target.start - viewSize / 2 + target.size / 2

  return target.start - offset
}

export const scrollAt = (
  start: number,
  change: number,
  progress: number,
  easing: (t: number) => number = easeInOutQuad
) => start + change * easing(Math.min(Math.max(progress, 0), 1))
