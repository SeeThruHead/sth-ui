import { Option } from "effect"

export type SpinBounds = { readonly min: number; readonly max: number; readonly step: number }

export type Typed = { readonly value: number; readonly advance: boolean }

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const maxDigit = (max: number) => (Number.isFinite(max) ? Number(max.toFixed(0)[0]) : Number.POSITIVE_INFINITY)

export const typedSpin = (
  text: string,
  bounds: Omit<SpinBounds, "step"> & { readonly allowTemporaryZero?: boolean; readonly disableAutoAdvance?: boolean }
): Option.Option<Typed> => {
  const digits = text.replaceAll(/\D/gu, "")
  if (digits === "") return Option.none()
  const parsed = Array.from(digits).reduce((current, character) => {
    const next = current * 10 + Number(character)

    return next > bounds.max ? Number(character) : next
  }, 0)
  const value =
    bounds.allowTemporaryZero === true && parsed === 0 && bounds.min > 0 ? 0 : clamp(parsed, bounds.min, bounds.max)
  const advance = bounds.disableAutoAdvance !== true && (value > maxDigit(bounds.max) || text.startsWith("00"))

  return Option.some({ value, advance })
}

export type SpinAction =
  | { readonly _tag: "Set"; readonly value: number | null }
  | { readonly _tag: "Next" }
  | { readonly _tag: "Previous" }

const set = (next: number | null): Option.Option<SpinAction> => Option.some({ _tag: "Set", value: next })

export const spinKey = (
  key: string,
  value: number | null,
  bounds: SpinBounds,
  wholeSelected = false
): Option.Option<SpinAction> => {
  const finite = Number.isFinite(bounds.max)
  const arrowsMax = finite ? bounds.max + 1 - bounds.step : bounds.max
  const downFrom = finite ? arrowsMax : bounds.min
  if (key === "0" && value === 0 && !wholeSelected) return Option.some({ _tag: "Next" })
  if (key === "Home") return set(bounds.min)
  if (key === "End") return finite ? set(bounds.max) : Option.none()
  if (key === "Backspace" || key === "Delete") return value === null ? Option.some({ _tag: "Previous" }) : set(null)
  if (key === "ArrowRight") return Option.some({ _tag: "Next" })
  if (key === "ArrowLeft") return Option.some({ _tag: "Previous" })
  if (key === "ArrowUp") return set(value === null ? bounds.min : clamp(value + bounds.step, bounds.min, arrowsMax))
  if (key === "ArrowDown") return set(value === null ? downFrom : clamp(value - bounds.step, bounds.min, arrowsMax))

  return Option.none()
}
