import { Option } from "effect"

export type Orientation = "horizontal" | "vertical"

export type Step = "next" | "previous" | "first" | "last"

export type TabState = { readonly disabled: boolean }

const enabled = (tab: TabState): boolean => !tab.disabled

const firstEnabledFrom = (tabs: ReadonlyArray<TabState>, start: number): Option.Option<number> => {
  const found = tabs.slice(start).findIndex(enabled)

  return found === -1 ? Option.none() : Option.some(start + found)
}

const lastEnabledBefore = (tabs: ReadonlyArray<TabState>, end: number): Option.Option<number> => {
  const found = tabs.slice(0, Math.max(end, 0)).findLastIndex(enabled)

  return found === -1 ? Option.none() : Option.some(found)
}

const nextIndex = (tabs: ReadonlyArray<TabState>, current: number, loop: boolean): number =>
  Option.getOrElse(
    Option.orElse(firstEnabledFrom(tabs, current + 1), () => (loop ? firstEnabledFrom(tabs, 0) : Option.none())),
    () => current
  )

const previousIndex = (tabs: ReadonlyArray<TabState>, current: number, loop: boolean): number =>
  Option.getOrElse(
    Option.orElse(lastEnabledBefore(tabs, current), () =>
      loop ? lastEnabledBefore(tabs, tabs.length) : Option.none()
    ),
    () => current
  )

const forward = (key: string, orientation: Orientation, rtl: boolean): boolean => {
  if (orientation === "vertical") return key === "ArrowDown"

  return key === (rtl ? "ArrowLeft" : "ArrowRight")
}

const backward = (key: string, orientation: Orientation, rtl: boolean): boolean => {
  if (orientation === "vertical") return key === "ArrowUp"

  return key === (rtl ? "ArrowRight" : "ArrowLeft")
}

export const stepOf = (key: string, orientation: Orientation, rtl: boolean): Option.Option<Step> => {
  if (forward(key, orientation, rtl)) return Option.some("next")
  if (backward(key, orientation, rtl)) return Option.some("previous")
  if (key === "Home") return Option.some("first")

  return key === "End" ? Option.some("last") : Option.none()
}

export const targetIndex = (
  tabs: ReadonlyArray<TabState>,
  current: number,
  step: Step,
  loop: boolean
): Option.Option<number> => {
  if (step === "next") return Option.some(nextIndex(tabs, current, loop))
  if (step === "previous") return Option.some(previousIndex(tabs, current, loop))
  if (step === "first") return firstEnabledFrom(tabs, 0)

  return lastEnabledBefore(tabs, tabs.length)
}
