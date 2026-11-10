import * as stylex from "@stylexjs/stylex"
import { Effect, Option, Predicate, Queue, Schema, Stream } from "effect"
import type { Cause } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { radiusValue, sizeValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, fontSize } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { activeIndex, defaultSelector, Message, update } from "./model.ts"
import type { Heading, Model, ScrollSpyOptions } from "./model.ts"
import { tocVars } from "./TableOfContents.stylex.ts"

export { activeIndex, Heading, init, Message, Model } from "./model.ts"

export type TableOfContentsPart = "root" | "control"

export type TableOfContentsVariant = "filled" | "light" | "none"

export type { ScrollSpyOptions } from "./model.ts"

export type TableOfContentsOptions = {
  readonly variant?: TableOfContentsVariant
  readonly color?: string
  readonly size?: StyleValue
  readonly radius?: StyleValue
  readonly autoContrast?: boolean
  readonly minDepthToOffset?: number
  readonly depthOffset?: number | string
}

export type TableOfContentsControl<M> = {
  readonly children?: Child
  readonly href?: string
  readonly onClick?: M
}

export type TableOfContentsProps<M> = TableOfContentsOptions &
  StylesApiProps<TableOfContentsPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly scrollSpyOptions?: ScrollSpyOptions
    readonly initialData?: ReadonlyArray<Heading>
    readonly getControlProps?: (payload: {
      readonly active: boolean
      readonly data: Heading
      readonly index: number
    }) => TableOfContentsControl<M>
  }

export type TableOfContentsConfig = ComponentConfig<TableOfContentsOptions, TableOfContentsPart>

export { update }

const headingOf = (element: Element): Heading => ({
  depth: Number(element.tagName.slice(1)),
  value: element.textContent,
  id: element.id
})

const topsOf = (selector: string): ReadonlyArray<number> =>
  Array.from(document.querySelectorAll(selector)).map((element) => element.getBoundingClientRect().y)

const SpyMessage = Schema.Union([Message.Scanned, Message.Scrolled])

type SpyMessage = typeof SpyMessage.Type

const fontSizes: Readonly<Record<string, string>> = {
  xs: fontSize.xs,
  sm: fontSize.sm,
  md: fontSize.md,
  lg: fontSize.lg,
  xl: fontSize.xl
}

const sizeOf = (size: StyleValue): string =>
  Predicate.isString(size) && Object.hasOwn(fontSizes, size) ? String(fontSizes[size]) : sizeValue(size)

const spying = (queue: Queue.Queue<SpyMessage, Cause.Done>, selector: string, offset: number) => (): void => {
  Queue.offerUnsafe(queue, Message.Scrolled({ active: activeIndex(topsOf(selector), offset) }))
}

const ScrollSpy = Mount.defineStream("TableOfContentsScrollSpy", {
  args: { selector: Schema.String, offset: Schema.Finite, scrollHost: Schema.String },
  messages: [Message.Scanned, Message.Scrolled],
  execute: ({ selector, offset, scrollHost }) =>
    Stream.callback<SpyMessage>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const host = Option.getOrElse(
            Option.fromNullishOr(scrollHost === "" ? null : document.querySelector(scrollHost)),
            (): EventTarget => window
          )
          const spy = spying(queue, selector, offset)
          Queue.offerUnsafe(
            queue,
            Message.Scanned({
              headings: Array.from(document.querySelectorAll(selector)).map(headingOf),
              active: activeIndex(topsOf(selector), offset)
            })
          )
          host.addEventListener("scroll", spy, { passive: true })

          return () => host.removeEventListener("scroll", spy)
        }),
        (release) => Effect.sync(release)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const scrollSpy = (options: {
  readonly selector?: string
  readonly offset?: number
  readonly scrollHost?: string
}) => ScrollSpy({ selector: defaultSelector, offset: 0, scrollHost: "", ...options })

const variants = stylex.create({
  filled: { backgroundColor: accent.filled, color: colors.white },
  light: { backgroundColor: accent.light, color: accent.lightColor },
  contrast: { color: accent.contrast }
})

const styles = stylex.create({
  root: { display: "flex", flexDirection: "column" },
  control: {
    display: "block",
    paddingBlock: "0.3em",
    paddingInlineEnd: "0.8em",
    paddingInlineStart: `max(calc(${tocVars.depth} * ${tocVars.depthOffset}), 0.8em)`,
    fontSize: tocVars.size,
    borderRadius: tocVars.radius,
    color: "inherit",
    textDecoration: "none",
    backgroundColor: "transparent",
    borderWidth: 0,
    textAlign: "start",
    font: "inherit",
    lineHeight: "inherit",
    cursor: "pointer"
  },
  hover: {
    backgroundColor: { default: "transparent", ":hover": `light-dark(${palette.gray1}, ${palette.dark5})` }
  }
})

export const TableOfContents =
  (config: { readonly TableOfContents?: TableOfContentsConfig }) =>
  <M>(h: HtmlBuilder<M>, input: TableOfContentsProps<M>): Html => {
    const props = withDefaults(config.TableOfContents, input)
    const getStyles = stylesApi<M, TableOfContentsPart>(h, props, config.TableOfContents, "root")
    const model = props.model
    const variant = props.variant ?? "filled"
    const spy = props.scrollSpyOptions ?? {}
    const headings = model.initialized ? model.headings : (props.initialData ?? [])
    const control = (heading: Heading, index: number): Html => {
      const active = index === model.active
      const custom = props.getControlProps?.({ active, data: heading, index }) ?? {}
      const tag = custom.href === undefined ? "button" : "a"

      return h[tag](
        [
          ...getStyles(
            "control",
            styles.control,
            variant !== "none" && styles.hover,
            active && variant !== "none" && variants[variant],
            active && variant === "filled" && props.autoContrast === true && variants.contrast,
            setVars([tocVars.depth, String(heading.depth - (props.minDepthToOffset ?? 1))])
          ),
          h.DataAttribute("variant", variant),
          ...(active ? [h.DataAttribute("active", "")] : []),
          ...(custom.href === undefined ? [h.Type("button")] : [h.Href(custom.href)]),
          ...(custom.onClick === undefined ? [] : [h.OnClick(custom.onClick)])
        ],
        [custom.children ?? heading.value]
      )
    }

    return h.keyed("div")(
      `${model.id}-${model.generation}`,
      [
        ...getStyles(
          "root",
          ...accentStyle(props.color, customAccent),
          styles.root,
          setDefinedVars(
            [tocVars.size, mapDefined(props.size, sizeOf)],
            [tocVars.radius, mapDefined(props.radius, radiusValue)],
            [
              tocVars.depthOffset,
              mapDefined(props.depthOffset, (offset) => (Predicate.isNumber(offset) ? rem(offset) : offset))
            ]
          )
        ),
        h.DataAttribute("variant", variant),
        h.OnMount(Mount.mapMessage(scrollSpy(spy), props.toParentMessage))
      ],
      headings.map(control)
    )
  }
