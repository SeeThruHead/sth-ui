import { Option } from "effect"

export const tabTarget = (key: string, index: number, count: number, rtl: boolean): Option.Option<number> => {
  const next = rtl ? "ArrowLeft" : "ArrowRight"
  const previous = rtl ? "ArrowRight" : "ArrowLeft"
  if (key === next) return Option.some((index + 1) % count)
  if (key === previous) return Option.some((index - 1 + count) % count)
  if (key === "Home") return Option.some(0)

  return key === "End" ? Option.some(count - 1) : Option.none()
}
