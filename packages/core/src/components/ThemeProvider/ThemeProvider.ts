import * as stylex from "@stylexjs/stylex"
import type { CompiledStyles } from "@stylexjs/stylex"
import { Effect, Function, MutableRef, Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { stylesApi } from "../../styles/StylesApi.ts"
import type { StylesApiProps } from "../../styles/StylesApi.ts"
import { stylexClass } from "../../styles/stylexClass.ts"
import { accents } from "../../theme/accents.ts"
import type { AccentName } from "../../theme/accents.ts"
import { colors, font, fontSize, lineHeight } from "../../theme/tokens.stylex.ts"

export type ColorSchemeChoice = "light" | "dark" | "auto"

export type ThemeScope = "document" | "element"

export type ThemeProviderProps = StylesApiProps<"root"> & {
  readonly themes?: ReadonlyArray<CompiledStyles>
  readonly primaryColor?: AccentName
  readonly colorScheme?: ColorSchemeChoice
  readonly scope?: ThemeScope
  readonly children: ReadonlyArray<Child>
}

const styles = stylex.create({
  root: {
    fontFamily: font.body,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    color: colors.text,
    backgroundColor: colors.body,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale"
  }
})

const schemes = stylex.create({
  light: { colorScheme: "light" },
  dark: { colorScheme: "dark" },
  auto: { colorScheme: "light dark" }
})

const mirrored = "data-sth-theme"

const themeClasses = "data-theme-classes"

const themeScope = "data-theme-scope"

const tokensOf = (classes: string | null): ReadonlyArray<string> =>
  (classes ?? "").split(" ").filter((token) => token !== "")

const unmirror = (): void => {
  const root = document.documentElement
  root.classList.remove(...tokensOf(root.getAttribute(mirrored)))
  root.removeAttribute(mirrored)
}

const mirror = (classes: string): void => {
  unmirror()
  document.documentElement.classList.add(...tokensOf(classes))
  document.documentElement.setAttribute(mirrored, classes)
}

const ownsDocument = (classes: string): boolean => document.documentElement.getAttribute(mirrored) === classes

const mirrorAs = (classes: string, owned: MutableRef.MutableRef<string>): void => {
  mirror(classes)
  MutableRef.set(owned, classes)
}

const release = (owned: MutableRef.MutableRef<string>): void => {
  if (ownsDocument(MutableRef.get(owned))) unmirror()
}

const follow = (element: Element, owned: MutableRef.MutableRef<string>): void => {
  const classes = tokensOf(element.getAttribute(themeClasses)).join(" ")
  if (element.getAttribute(themeScope) === "document") return mirrorAs(classes, owned)
  release(owned)
  MutableRef.set(owned, "")
}

const ThemeDocument = Mount.defineStream("ThemeDocument", {
  messages: [Schema.Never],
  execute: ({ element }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const owned = MutableRef.make("")
          const observer = new MutationObserver(() => follow(element, owned))
          follow(element, owned)
          observer.observe(element, { attributes: true, attributeFilter: [themeClasses, themeScope] })

          return () => {
            observer.disconnect()
            release(owned)
          }
        }),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const ThemeProvider = <M>(h: HtmlBuilder<M>, props: ThemeProviderProps): Html => {
  const scheme = props.colorScheme ?? "light"
  const getStyles = stylesApi<M, "root">(h, props, undefined, "root")
  const theme = [
    props.primaryColor === undefined ? null : accents[props.primaryColor],
    ...(props.themes ?? []),
    styles.root,
    schemes[scheme]
  ]

  return h.div(
    [
      ...getStyles("root", ...theme),
      h.DataAttribute("color-scheme", scheme),
      h.Attribute(themeClasses, stylexClass(...theme)),
      h.Attribute(themeScope, props.scope ?? "document"),
      h.OnMount(Mount.mapMessage(ThemeDocument(), Function.absurd<M>))
    ],
    props.children
  )
}
