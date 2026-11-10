import * as stylex from "@stylexjs/stylex"
import { Effect, Function, Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import { radiusValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedStyle, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"

export type ImagePart = "root"

export type ImageOptions = {
  readonly radius?: string | number
  readonly fit?: "cover" | "contain" | "fill" | "none" | "scale-down"
  readonly fallbackSrc?: string
}

export type ImageProps<M> = ImageOptions &
  StylesApiProps<ImagePart> & {
    readonly src?: string
    readonly alt?: string
    readonly onError?: M
  }

export type ImageConfig = ComponentConfig<ImageOptions, ImagePart>

const styles = stylex.create({
  root: { display: "block", objectFit: "cover", width: "100%", borderRadius: 0 }
})

const sourceAttribute = "data-src"

const fallbackAttribute = "data-fallback-src"

const fallBack = (image: Element): void => {
  const fallback = image.getAttribute(fallbackAttribute)
  if (fallback === null || image.getAttribute("src") === fallback) return
  image.setAttribute("data-fallback", "")
  image.setAttribute("src", fallback)
}

const load = (image: Element): void => {
  const source = image.getAttribute(sourceAttribute)
  image.removeAttribute("data-fallback")
  image.removeAttribute("src")
  if (source === null) return fallBack(image)
  image.setAttribute("src", source)
}

const LoadImage = Mount.defineStream("LoadImage", {
  messages: [Schema.Never],
  execute: ({ element }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const failed = (): void => fallBack(element)
          const observer = new MutationObserver(() => load(element))
          element.addEventListener("error", failed)
          observer.observe(element, { attributes: true, attributeFilter: [sourceAttribute] })
          load(element)

          return () => {
            element.removeEventListener("error", failed)
            observer.disconnect()
          }
        }),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const Image =
  (config: { readonly Image?: ImageConfig }) =>
  <M>(h: HtmlBuilder<M>, input: ImageProps<M>): Html => {
    const props = withDefaults(config.Image, input)
    const getStyles = stylesApi<M, ImagePart>(h, props, config.Image, "root")
    const source = props.src === "" ? undefined : props.src

    return h.img([
      ...getStyles(
        "root",
        styles.root,
        setDefinedStyle(["objectFit", props.fit], ["borderRadius", mapDefined(props.radius, radiusValue)])
      ),
      ...(source === undefined ? [] : [h.Attribute(sourceAttribute, source)]),
      ...(props.alt === undefined ? [] : [h.Alt(props.alt)]),
      ...(props.fallbackSrc === undefined ? [] : [h.Attribute(fallbackAttribute, props.fallbackSrc)]),
      ...(props.onError === undefined ? [] : [h.OnError(props.onError)]),
      h.OnMount(Mount.mapMessage(LoadImage(), Function.absurd<M>))
    ])
  }
