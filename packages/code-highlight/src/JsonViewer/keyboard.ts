const rowOf = (target: EventTarget | null): HTMLElement | null =>
  target instanceof HTMLElement && target.matches("[data-jv-node]") ? target : null

const wrapperOf = (row: HTMLElement) => row.closest<HTMLElement>("[data-jv-node-wrapper]")

const focusParent = (row: HTMLElement) =>
  wrapperOf(row)
    ?.parentElement?.closest("[data-jv-node-wrapper]")
    ?.querySelector<HTMLElement>("[data-jv-node]")
    ?.focus()

const focusFirstChild = (row: HTMLElement) =>
  row.nextElementSibling?.querySelector<HTMLElement>("[data-jv-node]")?.focus()

const focusSibling = (root: Element, row: HTMLElement, direction: 1 | -1) => {
  const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-jv-node]"))
  rows[rows.indexOf(row) + direction]?.focus()
}

type Pressed = {
  readonly key: string
  readonly code: string
  readonly ctrl: boolean
  readonly meta: boolean
  readonly shift: boolean
  readonly alt: boolean
}

const pressedOf = (event: Event): Pressed => ({
  key: String(Reflect.get(event, "key")),
  code: String(Reflect.get(event, "code")),
  ctrl: Reflect.get(event, "ctrlKey") === true,
  meta: Reflect.get(event, "metaKey") === true,
  shift: Reflect.get(event, "shiftKey") === true,
  alt: Reflect.get(event, "altKey") === true
})

const copyShortcut = (pressed: Pressed) => {
  if (pressed.code !== "KeyC" || pressed.shift || pressed.alt) return false

  return pressed.ctrl || pressed.meta
}

const opened = (row: HTMLElement) => row.getAttribute("aria-expanded") === "true"

const collapsible = (row: HTMLElement) => row.hasAttribute("data-jv-collapsible")

const selecting = () => String(window.getSelection()) !== ""

const copy = (row: HTMLElement, event: Event) => {
  const control = row.querySelector<HTMLElement>("[data-jv-copy]")
  if (control === null) return
  if (selecting()) return
  event.preventDefault()
  control.click()
}

const navigate = (root: Element, row: HTMLElement, event: Event, pressed: Pressed) => {
  if (pressed.key === "ArrowDown" || pressed.key === "ArrowUp") {
    event.preventDefault()
    focusSibling(root, row, pressed.key === "ArrowDown" ? 1 : -1)
    return
  }
  if (pressed.key === "ArrowRight" && opened(row)) {
    event.preventDefault()
    focusFirstChild(row)
    return
  }
  if (pressed.key === "ArrowLeft" && !(opened(row) && collapsible(row))) {
    event.preventDefault()
    focusParent(row)
  }
}

export const focusMove = (root: Element, event: Event) => {
  const row = rowOf(event.target)
  if (row === null) return
  const pressed = pressedOf(event)
  if (copyShortcut(pressed)) {
    copy(row, event)
    return
  }
  navigate(root, row, event, pressed)
}

const lineOf = (height: number, index: number) => {
  const line = document.createElement("div")
  line.style.setProperty("height", `${height}px`)
  line.append(String(index + 1))

  return line
}

const fill = (wrapper: Element) => {
  const heights = Array.from(
    wrapper.querySelectorAll<HTMLElement>("[data-jv-content] [data-jv-row]"),
    (row) => row.getBoundingClientRect().height
  )
  wrapper
    .querySelectorAll("[data-jv-line-numbers]")
    .forEach((numbers) => numbers.replaceChildren(...heights.map(lineOf)))
}

export const numberLines = (wrapper: Element) => {
  fill(wrapper)
  const observer = new ResizeObserver(() => fill(wrapper))
  observer.observe(wrapper)

  return () => observer.disconnect()
}
