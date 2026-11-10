export const contrastColor = (color: string): string => `oklch(from ${color} round(1.063 - l) 0 0)`
