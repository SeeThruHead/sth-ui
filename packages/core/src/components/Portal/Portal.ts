import { portalToContainingRoot } from "@foldkit/ui/anchor"
import { Effect, Function, Option, Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"

export type PortalPart = "root"

export type PortalOptions = {
  readonly target?: string
  readonly reuseTargetNode?: boolean
}

export type PortalProps = PortalOptions & StylesApiProps<PortalPart> & { readonly children: ReadonlyArray<Child> }

export type PortalConfig = ComponentConfig<PortalOptions, PortalPart>

const intoTarget = (element: Element, selector: string): (() => void) =>
  Option.match(Option.fromNullishOr(document.querySelector(selector)), {
    onNone: () => {
      element.remove()

      return () => undefined
    },
    onSome: (target) => {
      target.append(element)

      return () => element.remove()
    }
  })

const intoOwnNode = (element: Element): (() => void) => {
  const node = document.createElement("div")
  node.setAttribute("data-portal", "true")
  document.body.append(node)
  node.append(element)

  return () => node.remove()
}

const place = (element: Element, target: string, reuse: boolean): (() => void) => {
  if (target !== "") return intoTarget(element, target)

  return reuse ? portalToContainingRoot(element) : intoOwnNode(element)
}

const MovePortal = Mount.defineStream("MovePortal", {
  args: { target: Schema.String, reuse: Schema.Boolean },
  messages: [Schema.Never],
  execute: ({ element, target, reuse }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => place(element, target, reuse)),
        (cleanup) => Effect.sync(cleanup)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const Portal =
  (config: { readonly Portal?: PortalConfig }) =>
  <M>(h: HtmlBuilder<M>, input: PortalProps): Html => {
    const props = withDefaults(config.Portal, input)
    const getStyles = stylesApi<M, PortalPart>(h, props, config.Portal, "root")

    return h.div(
      [
        ...getStyles("root"),
        h.DataAttribute("portal", "true"),
        h.OnMount(
          Mount.mapMessage(
            MovePortal({ target: props.target ?? "", reuse: props.reuseTargetNode ?? true }),
            Function.absurd<M>
          )
        )
      ],
      props.children
    )
  }
