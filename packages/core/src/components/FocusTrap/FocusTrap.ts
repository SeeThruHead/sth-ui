import { Effect, Function, MutableRef, Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { shared } from "../../styles/shared.ts"
import { stylesApi, sx } from "../../styles/StylesApi.ts"
import type { StylesApiProps } from "../../styles/StylesApi.ts"
import { scopeTab } from "./scopeTab.ts"
import { focusTarget } from "./tabbable.ts"

export type FocusTrapProps = StylesApiProps<"root"> & {
  readonly active?: boolean
  readonly returnFocus?: boolean
  readonly children: ReadonlyArray<Child>
}

const trapAttribute = "data-focus-trap"

const isActive = (element: Element): boolean => element.getAttribute(trapAttribute) === "active"

const focusIn = (node: Element): void => focusTarget(node)?.focus({ preventScroll: true })

const nestedActiveTrap = (node: Element): boolean =>
  [...node.querySelectorAll(`[${trapAttribute}="active"]`)].some(
    (nested) => nested !== node && nested.contains(document.activeElement)
  )

const ignores = (node: Element, event: KeyboardEvent): boolean => {
  if (event.key !== "Tab" || event.defaultPrevented) return true

  return !isActive(node) || nestedActiveTrap(node)
}

const returnsFocus = (node: Element): boolean => node.getAttribute("data-return-focus") === "true"

const outsideFocus = (node: Element): Element | null => {
  const active = document.activeElement
  if (active === null || node.contains(active)) return null

  return active
}

const trap = (node: Element) => {
  const opener = MutableRef.make<Element | null>(null)
  const enter = (): void => {
    const outside = outsideFocus(node)
    if (outside === null) return
    MutableRef.set(opener, outside)
    focusIn(node)
  }
  const leave = (): void => {
    const previous = MutableRef.get(opener)
    MutableRef.set(opener, null)
    if (previous instanceof HTMLElement && returnsFocus(node)) previous.focus({ preventScroll: true })
  }
  const onKeyDown = (event: KeyboardEvent): void => {
    if (ignores(node, event)) return
    scopeTab(node, event)
  }
  const observer = new MutationObserver(() => (isActive(node) ? enter() : leave()))
  const frame = requestAnimationFrame(() => {
    if (isActive(node)) enter()
  })
  observer.observe(node, { attributes: true, attributeFilter: [trapAttribute] })
  document.addEventListener("keydown", onKeyDown)

  return () => {
    cancelAnimationFrame(frame)
    observer.disconnect()
    document.removeEventListener("keydown", onKeyDown)
    leave()
  }
}

const TrapFocus = Mount.defineStream("TrapFocus", {
  messages: [Schema.Never],
  execute: ({ element }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => trap(element)),
        (release) => Effect.sync(release)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const focusTrapAttributes = <M>(
  h: HtmlBuilder<M>,
  options: { readonly active?: boolean; readonly returnFocus?: boolean }
) => [
  h.Attribute(trapAttribute, options.active === false ? "inactive" : "active"),
  h.Attribute("data-return-focus", options.returnFocus === true ? "true" : "false"),
  h.OnMount(Mount.mapMessage(TrapFocus(), Function.absurd<M>))
]

export const FocusTrap = <M>(h: HtmlBuilder<M>, props: FocusTrapProps): Html => {
  const getStyles = stylesApi<M, "root">(h, props, undefined, "root")

  return h.div([...getStyles("root"), ...focusTrapAttributes(h, props)], props.children)
}

export const FocusTrapInitialFocus = <M>(h: HtmlBuilder<M>): Html =>
  h.span([...sx(h, shared.visuallyHidden), h.Tabindex(-1), h.DataAttribute("autofocus", "")], [])
