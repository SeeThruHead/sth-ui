export type ScrollPosition = { readonly x: number; readonly y: number }

export const scrollOptions = (position: {
  readonly x?: number | undefined
  readonly y?: number | undefined
}): ScrollToOptions => ({
  behavior: "smooth",
  ...(position.x === undefined ? {} : { left: position.x }),
  ...(position.y === undefined ? {} : { top: position.y })
})
