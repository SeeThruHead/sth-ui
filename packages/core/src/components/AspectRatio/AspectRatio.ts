import * as stylex from "@stylexjs/stylex"
import { Effect, Function, Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { aspectRatioVars } from "./AspectRatio.stylex.ts"

export type AspectRatioPart = "root"

export type AspectRatioOptions = { readonly ratio?: number }

export type AspectRatioProps = AspectRatioOptions &
  StylesApiProps<AspectRatioPart> & { readonly children: ReadonlyArray<Child> }

export type AspectRatioConfig = ComponentConfig<AspectRatioOptions, AspectRatioPart>

const styles = stylex.create({
  root: { [aspectRatioVars.ratio]: "1", maxWidth: "100%" }
})

const isHtmlElement = (element: Element): element is HTMLElement => element instanceof HTMLElement

const media: ReadonlySet<string> = new Set(["IMG", "VIDEO"])

const fit = (child: HTMLElement) => {
  child.style.setProperty("aspect-ratio", aspectRatioVars.ratio)
  child.style.setProperty("width", "100%")
  if (media.has(child.tagName)) child.style.setProperty("object-fit", "cover")
}

const fitChildren = (root: Element) => () =>
  Array.from(root.children)
    .filter(isHtmlElement)
    .filter((child) => child.tagName !== "STYLE")
    .forEach(fit)

const FitChildren = Mount.defineStream("AspectRatioFitChildren", {
  messages: [Schema.Never],
  execute: ({ element }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const refit = fitChildren(element)
          const observer = new MutationObserver(refit)
          refit()
          observer.observe(element, { childList: true })

          return () => observer.disconnect()
        }),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const AspectRatio =
  (config: { readonly AspectRatio?: AspectRatioConfig }) =>
  <M>(h: HtmlBuilder<M>, input: AspectRatioProps): Html => {
    const props = withDefaults(config.AspectRatio, input)
    const getStyles = stylesApi<M, AspectRatioPart>(h, props, config.AspectRatio, "root")

    return h.div(
      [
        ...getStyles("root", styles.root, setDefinedVars([aspectRatioVars.ratio, mapDefined(props.ratio, String)])),
        h.OnMount(Mount.mapMessage(FitChildren(), Function.absurd<M>))
      ],
      props.children
    )
  }
