export type Trapezoid = {
  readonly path: string
  readonly top: number
  readonly bottom: number
  readonly left: number
  readonly right: number
}

const round = (value: number) => Math.round(value * 1000) / 1000

export const trapezoids = (values: ReadonlyArray<number>, size: number, margin = 5): ReadonlyArray<Trapezoid> => {
  const width = size - margin * 2
  const height = size - margin * 2
  const top = Math.max(...values, 0)
  const row = height / Math.max(values.length, 1)
  const widthOf = (value: number) => (top === 0 ? 0 : (value / top) * width)

  return values.map((value, index) => {
    const upper = widthOf(value)
    const lower = widthOf(values[index + 1] ?? 0)
    const y = margin + row * index
    const left = margin + (width - upper) / 2
    const lowerLeft = margin + (width - lower) / 2

    return {
      path: `M${round(left)},${round(y)}L${round(left + upper)},${round(y)}L${round(lowerLeft + lower)},${round(y + row)}L${round(lowerLeft)},${round(y + row)}Z`,
      top: round(y),
      bottom: round(y + row),
      left: round(left),
      right: round(left + upper)
    }
  })
}
