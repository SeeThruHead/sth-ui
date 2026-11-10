export const bubbleDiameter = (
  value: number,
  domain: readonly [number, number],
  range: readonly [number, number]
): number => {
  const [low, high] = domain
  const share = high === low ? 1 : (value - low) / (high - low)
  const area = range[0] + share * (range[1] - range[0])

  return 2 * Math.sqrt(area / Math.PI)
}

export const domainOf = (values: ReadonlyArray<number>): readonly [number, number] => [
  Math.min(...values),
  Math.max(...values)
]
