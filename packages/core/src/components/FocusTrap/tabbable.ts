const TABBABLE_NODES = /input|select|textarea|button|object|summary|iframe/

export const FOCUS_SELECTOR =
  "a, input, select, textarea, button, object, summary, iframe, audio[controls], video[controls], [contenteditable], [tabindex]"

const isContentEditable = (element: HTMLElement): boolean => {
  const value = element.getAttribute("contenteditable")

  return value !== null && value !== "false"
}

const hasMediaControls = (element: HTMLElement): boolean => {
  const nodeName = element.nodeName.toLowerCase()

  return (nodeName === "audio" || nodeName === "video") && element.hasAttribute("controls")
}

const markedHidden = (element: HTMLElement): boolean =>
  element.hasAttribute("aria-hidden") || element.hasAttribute("hidden") || element.getAttribute("type") === "hidden"

const shownUpTo = (element: Node | null): boolean => {
  if (element === null || element === document.body) return true
  if (element instanceof HTMLElement && element.style.display === "none") return false

  return shownUpTo(element.parentNode)
}

const visible = (element: HTMLElement): boolean => !markedHidden(element) && shownUpTo(element)

export const tabIndexOf = (element: HTMLElement): number => Number.parseInt(element.getAttribute("tabindex") ?? "", 10)

const disabled = (element: HTMLElement): boolean => element.hasAttribute("disabled")

const reachable = (element: HTMLElement): boolean => {
  const hasTabIndex = !Number.isNaN(tabIndexOf(element))
  if (TABBABLE_NODES.test(element.nodeName.toLowerCase()) && !disabled(element)) return true
  if (isContentEditable(element) || hasMediaControls(element)) return true
  if (element instanceof HTMLAnchorElement) return element.hasAttribute("href") || hasTabIndex

  return hasTabIndex
}

export const focusable = (element: HTMLElement): boolean => reachable(element) && visible(element)

export const tabbable = (element: HTMLElement): boolean => {
  const tabIndex = tabIndexOf(element)

  return (Number.isNaN(tabIndex) || tabIndex >= 0) && focusable(element)
}

const descendants = (element: Element): ReadonlyArray<HTMLElement> =>
  [...element.querySelectorAll(FOCUS_SELECTOR)].filter((found): found is HTMLElement => found instanceof HTMLElement)

export const findTabbableDescendants = (element: Element): ReadonlyArray<HTMLElement> => {
  const elements = descendants(element).filter(tabbable)
  const positive = elements.filter((item) => tabIndexOf(item) > 0).toSorted((a, b) => tabIndexOf(a) - tabIndexOf(b))

  return [...positive, ...elements.filter((item) => !(tabIndexOf(item) > 0))]
}

export const focusTarget = (node: Element): HTMLElement | undefined => {
  const marked = node.querySelector("[data-autofocus]")
  if (marked instanceof HTMLElement) return marked
  const children = descendants(node)

  return (
    children.find(tabbable) ??
    children.find(focusable) ??
    (node instanceof HTMLElement && focusable(node) ? node : undefined)
  )
}
