import * as stylex from "@stylexjs/stylex"
import { Effect, Function, Option, Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import { sx } from "@sth-ui/core/styles/StylesApi.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { fontSize, radius, space } from "@sth-ui/core/theme/tokens.stylex.ts"

const styles = stylex.create({
  wrapper: { position: "relative", width: "fit-content" },
  grow: { flexGrow: 1, flexShrink: 1, flexBasis: 0, width: "auto", alignSelf: "stretch" },
  tooltip: {
    position: "absolute",
    zIndex: 300,
    display: "none",
    pointerEvents: "none",
    whiteSpace: "nowrap",
    transform: "translate(-50%, -100%)",
    paddingBlock: `calc(${space.xs} / 2)`,
    paddingInline: space.xs,
    fontSize: fontSize.sm,
    borderRadius: radius.default,
    backgroundColor: `light-dark(${palette.gray9}, ${palette.gray2})`,
    color: `light-dark(${palette.white}, ${palette.black})`
  }
})

const isHtml = (element: Element): element is HTMLElement => element instanceof HTMLElement

const isElement = (target: EventTarget | null): target is Element => target instanceof Element

const follow = (wrapper: HTMLElement) => {
  const tooltip = Option.getOrThrow(Option.fromNullishOr(wrapper.querySelector<HTMLElement>("[data-floating-label]")))
  const onMove = (event: PointerEvent) => {
    const label = Option.flatMap(Option.liftPredicate(event.target, isElement), (target) =>
      Option.fromNullishOr(target.closest("[data-label]")?.getAttribute("data-label"))
    )
    if (Option.isNone(label)) return tooltip.style.setProperty("display", "none")
    const box = wrapper.getBoundingClientRect()
    tooltip.replaceChildren(label.value)
    tooltip.style.setProperty("display", "block")
    tooltip.style.setProperty("left", `${event.clientX - box.left}px`)
    tooltip.style.setProperty("top", `${event.clientY - box.top - 10}px`)
  }
  const onLeave = () => tooltip.style.setProperty("display", "none")
  wrapper.addEventListener("pointermove", onMove)
  wrapper.addEventListener("pointerleave", onLeave)

  return () => {
    wrapper.removeEventListener("pointermove", onMove)
    wrapper.removeEventListener("pointerleave", onLeave)
  }
}

const FloatingLabel = Mount.defineStream("ChartFloatingLabel", {
  messages: [Schema.Never],
  execute: ({ element }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => follow(Option.getOrThrow(Option.liftPredicate(element, isHtml)))),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const withFloatingLabel = <M>(h: HtmlBuilder<M>, child: Html, grow = false): Html =>
  h.div(
    [...sx(h, styles.wrapper, grow && styles.grow), h.OnMount(Mount.mapMessage(FloatingLabel(), Function.absurd<M>))],
    [child, h.div([...sx(h, styles.tooltip), h.DataAttribute("floating-label", "")], [])]
  )
