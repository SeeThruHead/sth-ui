import { MutableRef, Option } from "effect"
import type { HtmlBuilder } from "foldkit/html"

export type KeyboardSteps = {
  readonly count: () => number
  readonly show: (index: Option.Option<number>) => void
}

type Active = { readonly index: number; readonly open: boolean }

const moves: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowLeft: -1 }

const inRange = (index: number, count: number) => index >= 0 && index < count

export const keyboardSteps = (element: HTMLElement, steps: KeyboardSteps) => {
  const active = MutableRef.make<Active>({ index: 0, open: false })
  const set = (next: Active) => {
    MutableRef.set(active, next)
    steps.show(next.open ? Option.some(next.index) : Option.none())
  }
  const onFocus = () => set({ ...MutableRef.get(active), open: true })
  const onBlur = () => set({ ...MutableRef.get(active), open: false })
  const onKey = (event: KeyboardEvent) => {
    const current = MutableRef.get(active)
    if (event.key === "Enter") return set({ ...current, open: !current.open })
    const move = moves[event.key]
    if (move === undefined) return
    event.preventDefault()
    const index = current.index + move
    if (!inRange(index, steps.count())) return
    set({ index, open: true })
  }
  element.addEventListener("focus", onFocus)
  element.addEventListener("blur", onBlur)
  element.addEventListener("keydown", onKey)

  return () => {
    element.removeEventListener("focus", onFocus)
    element.removeEventListener("blur", onBlur)
    element.removeEventListener("keydown", onKey)
  }
}

export const keyboardOn = (props: { readonly withTooltip?: boolean; readonly accessibilityLayer?: boolean }) =>
  props.withTooltip !== false && props.accessibilityLayer !== false

export const focusable = <M>(h: HtmlBuilder<M>, on: boolean) => (on ? [h.Tabindex(0)] : [])
