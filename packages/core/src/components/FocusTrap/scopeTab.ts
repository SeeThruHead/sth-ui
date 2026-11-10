import { findTabbableDescendants } from "./tabbable.ts"

const NATIVE_TAB_STOPS_INPUT_TYPES = ["date", "time", "datetime-local", "month", "week"]

const NATIVE_TAB_STOPS_NODES = ["audio", "video", "iframe", "object", "embed"]

const isRadio = (element: Element): element is HTMLInputElement =>
  element instanceof HTMLInputElement && element.type === "radio"

const sameRadioGroup = (a: HTMLInputElement, b: HTMLInputElement): boolean =>
  a.name !== "" && a.name === b.name && a.form === b.form

const hasNativeTabStops = (element: Element): boolean => {
  if (element instanceof HTMLInputElement) return NATIVE_TAB_STOPS_INPUT_TYPES.includes(element.type)

  return NATIVE_TAB_STOPS_NODES.includes(element.nodeName.toLowerCase())
}

const keepsRadio = (element: HTMLInputElement, active: Element, all: ReadonlyArray<HTMLElement>): boolean => {
  if (isRadio(active) && sameRadioGroup(element, active)) return false
  if (element.checked) return true

  return !all.some((item) => isRadio(item) && item.checked && sameRadioGroup(item, element))
}

const tabSequence = (node: Element, active: Element): ReadonlyArray<HTMLElement> => {
  const all = findTabbableDescendants(node)

  return all.filter((element) => element === active || !isRadio(element) || keepsRadio(element, active, all))
}

const startIndex = (
  sequence: ReadonlyArray<HTMLElement>,
  active: Element,
  node: Element,
  backwards: boolean
): number => {
  const activeIndex = sequence.findIndex((element) => element === active)
  if (activeIndex !== -1) return activeIndex + 1
  if (active === node) return 0
  const position = backwards ? Node.DOCUMENT_POSITION_PRECEDING : Node.DOCUMENT_POSITION_FOLLOWING
  const next = sequence.findIndex((element) => (active.compareDocumentPosition(element) & position) !== 0)

  return Math.max(next, 0)
}

const candidates = (node: Element, active: Element, backwards: boolean): ReadonlyArray<HTMLElement> => {
  const forwards = tabSequence(node, active)
  const sequence = backwards ? forwards.toReversed() : forwards
  const start = startIndex(sequence, active, node, backwards)

  return [...sequence.slice(start), ...sequence.slice(0, start)].filter((element) => element !== active)
}

const focusFirstAvailable = (list: ReadonlyArray<HTMLElement>): void => {
  list.find((candidate) => {
    candidate.focus()

    return document.activeElement === candidate
  })
}

const inside = (node: Element, active: Element | null): active is Element =>
  active !== null && (active === node || node.contains(active))

export const scopeTab = (node: Element, event: KeyboardEvent): void => {
  const active = document.activeElement
  if (!inside(node, active)) return
  const list = candidates(node, active, event.shiftKey)
  if (!hasNativeTabStops(active)) {
    event.preventDefault()
    focusFirstAvailable(list)

    return
  }
  requestAnimationFrame(() => {
    if (node.contains(document.activeElement)) return
    focusFirstAvailable([...list, active].filter((item): item is HTMLElement => item instanceof HTMLElement))
  })
}
