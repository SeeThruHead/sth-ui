import * as stylex from "@stylexjs/stylex"
import { Effect, Option, Predicate, Queue, Schema, Stream } from "effect"
import type { Cause } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import * as Subscription from "foldkit/subscription"
import type { Child } from "../../content.ts"
import { setStyle, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, ElementAttribute, StylesApiProps, Sx } from "../../styles/StylesApi.ts"
import { styleProps } from "../../styles/styleProps.ts"
import type { Responsive, StyleProps, StyleValue } from "../../styles/styleProps.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, zIndex } from "../../theme/tokens.stylex.ts"
import type { BoxElement } from "../Box/Box.ts"
import { shellVars } from "./AppShell.stylex.ts"
import { shellPointVars } from "./layout.ts"
import type { EdgeConfiguration, ShellLayout, ShellMode, SideConfiguration } from "./layout.ts"
import { activeSection, isVertical, keyTarget, maxOf, Message, Section, sections, sizeOf } from "./model.ts"
import * as AppShellResize from "./model.ts"
import type { Model as ResizeModel } from "./model.ts"
import { shellRules } from "./rules.ts"

export type { EdgeConfiguration, ShellLayout, ShellMode, ShellSize, SideConfiguration } from "./layout.ts"

export { AppShellResize }

export type AppShellPart = "root" | "navbar" | "header" | "main" | "aside" | "footer" | "section" | "resizeHandle"

export type AppShellSlotName = "header" | "navbar" | "aside" | "footer" | "main"

export type AppShellSection = StyleProps & {
  readonly _tag: "AppShellSection"
  readonly grow?: boolean
  readonly component?: BoxElement
  readonly children: ReadonlyArray<Child>
}

export type AppShellSlot = StyleProps & {
  readonly _tag: "AppShellSlot"
  readonly part: AppShellSlotName
  readonly withBorder?: boolean
  readonly zIndex?: StyleValue
  readonly children: ReadonlyArray<Child | AppShellSection>
}

type SlotInput = Omit<AppShellSlot, "_tag" | "part">

export const appShellSection = (section: Omit<AppShellSection, "_tag">): AppShellSection => ({
  _tag: "AppShellSection",
  ...section
})

const slot =
  (part: AppShellSlotName) =>
  (input: SlotInput): AppShellSlot => ({ _tag: "AppShellSlot", part, ...input })

export const appShellHeader = slot("header")

export const appShellNavbar = slot("navbar")

export const appShellAside = slot("aside")

export const appShellFooter = slot("footer")

export const appShellMain = slot("main")

export type AppShellOptions = {
  readonly withBorder?: boolean
  readonly padding?: Responsive<StyleValue>
  readonly navbar?: SideConfiguration
  readonly aside?: SideConfiguration
  readonly header?: EdgeConfiguration
  readonly footer?: EdgeConfiguration
  readonly transitionDuration?: number
  readonly transitionTimingFunction?: string
  readonly zIndex?: StyleValue
  readonly layout?: ShellLayout
  readonly disabled?: boolean
  readonly mode?: ShellMode
}

export type AppShellResizeProps<M> = {
  readonly model: ResizeModel
  readonly toParentMessage: (message: Message) => M
}

export type AppShellProps<M = never> = AppShellOptions &
  StylesApiProps<AppShellPart> & {
    readonly resize?: AppShellResizeProps<M>
    readonly children: ReadonlyArray<AppShellSlot>
  }

export type AppShellConfig = ComponentConfig<AppShellOptions, AppShellPart>

const border = `light-dark(${palette.gray3}, ${palette.dark4})`

const styles = stylex.create({
  rootStatic: {
    display: "grid",
    gridTemplateColumns: shellVars.columns,
    gridTemplateRows: "auto 1fr auto",
    position: "relative",
    height: "100%",
    overflow: "auto"
  },
  side: {
    position: "fixed",
    display: "flex",
    flexDirection: "column",
    top: shellVars.headerOffset,
    height: `calc(100dvh - ${shellVars.headerOffset} - ${shellVars.footerOffset})`,
    backgroundColor: colors.body,
    transitionProperty: "transform, top, height",
    transitionDuration: shellVars.duration,
    transitionTimingFunction: shellVars.timing
  },
  sideAlt: { top: 0, height: "100dvh" },
  navbar: { insetInlineStart: 0, width: shellVars.navbarWidth, transform: shellVars.navbarTransform },
  navbarStatic: {
    position: shellVars.navbarPosition,
    gridRow: shellVars.navbarRow,
    gridColumn: shellVars.navbarColumn,
    display: shellVars.navbarDisplay,
    height: "100%"
  },
  navbarBorder: { borderInlineEndWidth: "1px", borderInlineEndStyle: "solid", borderInlineEndColor: border },
  aside: { insetInlineEnd: 0, width: shellVars.asideWidth, transform: shellVars.asideTransform },
  asideStatic: {
    position: shellVars.asidePosition,
    gridRow: shellVars.asideRow,
    gridColumn: shellVars.asideColumn,
    display: shellVars.asideDisplay,
    height: "100%"
  },
  asideBorder: { borderInlineStartWidth: "1px", borderInlineStartStyle: "solid", borderInlineStartColor: border },
  main: {
    paddingInlineStart: `calc(${shellVars.navbarOffset} + ${shellVars.padding})`,
    paddingInlineEnd: `calc(${shellVars.asideOffset} + ${shellVars.padding})`,
    paddingTop: `calc(${shellVars.headerOffset} + ${shellVars.padding})`,
    paddingBottom: `calc(${shellVars.footerOffset} + ${shellVars.padding})`,
    minHeight: "100dvh",
    transitionProperty: "padding",
    transitionDuration: shellVars.duration,
    transitionTimingFunction: shellVars.timing
  },
  mainStatic: {
    paddingInlineStart: shellVars.padding,
    paddingInlineEnd: shellVars.padding,
    paddingTop: shellVars.padding,
    paddingBottom: shellVars.padding,
    minHeight: "auto",
    gridColumn: `${shellVars.mainStart} / ${shellVars.mainEnd}`,
    gridRow: "2"
  },
  edge: {
    position: "fixed",
    insetInline: 0,
    backgroundColor: colors.body,
    transitionProperty: "transform, margin-inline-start, margin-inline-end",
    transitionDuration: shellVars.duration,
    transitionTimingFunction: shellVars.timing
  },
  edgeAlt: { marginInlineStart: shellVars.navbarOffset, marginInlineEnd: shellVars.asideOffset },
  edgeStaticAlt: {
    gridColumn: `${shellVars.mainStart} / ${shellVars.mainEnd}`,
    marginInlineStart: 0,
    marginInlineEnd: 0
  },
  header: { top: 0, height: shellVars.headerHeight },
  headerStatic: { position: "sticky", gridColumn: "1 / -1", gridRow: "1" },
  headerCollapsed: { transform: `translateY(calc(${shellVars.headerHeight} * -1))` },
  headerBorder: { borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: border },
  footer: {
    bottom: 0,
    height: `calc(${shellVars.footerHeight} + env(safe-area-inset-bottom))`,
    paddingBottom: "env(safe-area-inset-bottom)"
  },
  footerStatic: { position: "sticky", gridColumn: "1 / -1", gridRow: "3" },
  footerCollapsed: { transform: `translateY(${shellVars.footerHeight})` },
  footerBorder: { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: border },
  section: { flexGrow: 0 },
  sectionGrow: { flexGrow: 1 },
  handle: {
    [shellVars.handleLine]: { default: "transparent", ":hover": accent.filled, ":focus-visible": accent.filled },
    position: "absolute",
    zIndex: 1,
    outline: "none",
    touchAction: "none",
    backgroundColor: "transparent"
  },
  handleActive: { [shellVars.handleLine]: accent.filled },
  handleVertical: { top: 0, bottom: 0, width: shellVars.handleSize, cursor: "col-resize" },
  handleHorizontal: { insetInline: 0, height: shellVars.handleSize, cursor: "row-resize" },
  handleNavbar: { insetInlineEnd: `calc(${shellVars.handleSize} / -2)`, display: shellVars.navbarHandle },
  handleAside: { insetInlineStart: `calc(${shellVars.handleSize} / -2)`, display: shellVars.asideHandle },
  handleHeader: { bottom: `calc(${shellVars.handleSize} / -2)` },
  handleFooter: { top: `calc(${shellVars.handleSize} / -2)` },
  line: {
    position: "absolute",
    backgroundColor: shellVars.handleLine,
    transitionProperty: "background-color",
    transitionDuration: "100ms",
    transitionTimingFunction: "ease"
  },
  lineVertical: { top: 0, bottom: 0, insetInlineStart: "50%", width: "2px", transform: "translateX(-50%)" },
  lineHorizontal: { insetInline: 0, top: "50%", height: "2px", transform: "translateY(-50%)" }
})

const handleSides = {
  navbar: styles.handleNavbar,
  aside: styles.handleAside,
  header: styles.handleHeader,
  footer: styles.handleFooter
} as const

const handleLabels = {
  navbar: "Resize navbar",
  aside: "Resize aside",
  header: "Resize header",
  footer: "Resize footer"
} as const

const sectionId = (model: ResizeModel, section: Section): string => `${model.id}-${section}`

type Measure = { readonly size: number; readonly viewport: number }

const measure = (model: ResizeModel, section: Section): Option.Option<Measure> =>
  Option.map(Option.fromNullishOr(document.getElementById(sectionId(model, section))), (element) => {
    const box = element.getBoundingClientRect()

    return isVertical(section)
      ? { size: box.height, viewport: window.innerHeight }
      : { size: box.width, viewport: window.innerWidth }
  })

const sectionOf = (element: Element): Section => Schema.decodeUnknownSync(Section)(element.getAttribute("data-section"))

const measuredSection = (element: Element, parent: Element): typeof Message.MeasuredSection.Type => {
  const section = sectionOf(element)
  const box = parent.getBoundingClientRect()

  return Message.MeasuredSection({
    section,
    size: isVertical(section) ? box.height : box.width,
    width: window.innerWidth,
    height: window.innerHeight
  })
}

const watchSection = (
  element: Element,
  parent: Element,
  report: (message: typeof Message.MeasuredSection.Type) => void
) => {
  const measured = () => report(measuredSection(element, parent))
  const observer = new ResizeObserver(measured)
  observer.observe(parent)
  window.addEventListener("resize", measured)

  return () => {
    observer.disconnect()
    window.removeEventListener("resize", measured)
  }
}

const MeasureSection = Mount.defineStream("MeasureAppShellSection", {
  messages: [Message.MeasuredSection],
  execute: ({ element }) =>
    Stream.callback<typeof Message.MeasuredSection.Type>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() =>
          watchSection(element, Option.getOrThrow(Option.fromNullishOr(element.parentElement)), (message) => {
            Queue.offerUnsafe(queue, message)
          })
        ),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

const offering =
  <E extends Event>(queue: Queue.Queue<Message, Cause.Done>, toMessage: (event: E) => Option.Option<Message>) =>
  (event: E): void => {
    Option.map(toMessage(event), (message) => Queue.offerUnsafe(queue, message))
  }

const resizingDocument = (vertical: boolean): Stream.Stream<Message> =>
  Stream.callback<Message>((queue) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const body = document.body.style
        const moved = offering<PointerEvent>(queue, (event) =>
          Option.some(Message.MovedPointer({ x: event.clientX, y: event.clientY }))
        )
        const released = offering<PointerEvent>(queue, () => Option.some(Message.ReleasedPointer()))
        const cancelled = offering<PointerEvent>(queue, () => Option.some(Message.CancelledResize()))
        const escaped = offering<KeyboardEvent>(queue, (event) =>
          event.key === "Escape" ? Option.some(Message.CancelledResize()) : Option.none()
        )
        body.setProperty("user-select", "none")
        body.setProperty("-webkit-user-select", "none")
        body.setProperty("cursor", vertical ? "row-resize" : "col-resize")
        document.addEventListener("pointermove", moved)
        document.addEventListener("pointerup", released)
        document.addEventListener("pointercancel", cancelled)
        document.addEventListener("keydown", escaped)

        return () => {
          document.removeEventListener("pointermove", moved)
          document.removeEventListener("pointerup", released)
          document.removeEventListener("pointercancel", cancelled)
          document.removeEventListener("keydown", escaped)
          body.removeProperty("user-select")
          body.removeProperty("-webkit-user-select")
          body.removeProperty("cursor")
        }
      }),
      (stop) => Effect.sync(stop)
    ).pipe(Effect.flatMap(() => Effect.never))
  )

export const subscriptions = Subscription.make<ResizeModel, Message>()((entry) => ({
  resizePointer: entry(
    { resizing: Schema.Boolean, vertical: Schema.Boolean },
    {
      modelToDependencies: (model) => ({
        resizing: Option.isSome(activeSection(model)),
        vertical: Option.exists(activeSection(model), isVertical)
      }),
      dependenciesToStream: ({ resizing, vertical }) =>
        Stream.when(
          resizingDocument(vertical),
          Effect.sync(() => resizing)
        )
    }
  )
}))

const resizedSizes = (model: ResizeModel) =>
  Object.fromEntries(sections.map((section) => [section, Option.getOrUndefined(sizeOf(model, section))]))

const isSection = (item: Child | AppShellSection): item is AppShellSection =>
  Predicate.isTagged(item, "AppShellSection")

type Frame = {
  readonly fixed: boolean
  readonly alt: boolean
  readonly staticAlt: boolean
}

const partStyles = (
  part: AppShellSlotName,
  frame: Frame,
  config: { readonly header?: EdgeConfiguration | undefined; readonly footer?: EdgeConfiguration | undefined },
  bordered: boolean
): ReadonlyArray<Sx> => {
  if (part === "main") return [styles.main, !frame.fixed && styles.mainStatic]
  if (part === "navbar")
    return [
      styles.side,
      frame.alt && styles.sideAlt,
      styles.navbar,
      !frame.fixed && styles.navbarStatic,
      bordered && styles.navbarBorder
    ]
  if (part === "aside")
    return [
      styles.side,
      frame.alt && styles.sideAlt,
      styles.aside,
      !frame.fixed && styles.asideStatic,
      bordered && styles.asideBorder
    ]
  if (part === "header")
    return [
      styles.edge,
      frame.alt && styles.edgeAlt,
      styles.header,
      !frame.fixed && styles.headerStatic,
      frame.staticAlt && styles.edgeStaticAlt,
      config.header?.collapsed === true && styles.headerCollapsed,
      bordered && styles.headerBorder
    ]

  return [
    styles.edge,
    frame.alt && styles.edgeAlt,
    styles.footer,
    !frame.fixed && styles.footerStatic,
    frame.staticAlt && styles.edgeStaticAlt,
    config.footer?.collapsed === true && styles.footerCollapsed,
    bordered && styles.footerBorder
  ]
}

const layer = (part: AppShellSlotName, value: string): Sx => {
  if (part === "navbar" || part === "aside") return setStyle(["zIndex", `calc(${value} + 1)`])

  return part === "main" ? null : setStyle(["zIndex", value])
}

export const AppShell =
  (config: { readonly AppShell?: AppShellConfig }) =>
  <M>(h: HtmlBuilder<M>, input: AppShellProps<M>): Html => {
    const props = withDefaults(config.AppShell, input)
    const getStyles = stylesApi<M, AppShellPart>(h, props, config.AppShell, "root")
    const mode = props.mode ?? "fixed"
    const disabled = props.disabled === true
    const fixed = mode === "fixed"
    const alt = props.layout === "alt"
    const frame: Frame = { fixed, alt, staticAlt: alt && !fixed }
    const elements = { header: h.header, navbar: h.nav, aside: h.aside, footer: h.footer, main: h.main }
    const content = (children: AppShellSlot["children"]): ReadonlyArray<Child> =>
      children.map((item) =>
        isSection(item)
          ? h[item.component ?? "div"](
              [
                ...getStyles("section", styles.section, item.grow === true && styles.sectionGrow, ...styleProps(item)),
                ...(item.grow === true ? [h.DataAttribute("grow", "")] : [])
              ],
              item.children
            )
          : item
      )
    const resize = props.resize
    const resizing = resize !== undefined && Option.isSome(activeSection(resize.model))
    const handle = (
      resizer: AppShellResizeProps<M>,
      section: Section,
      options: AppShellResize.SectionOptions
    ): Html => {
      const { model, toParentMessage } = resizer
      const vertical = isVertical(section)
      const active = Option.contains(activeSection(model), section)
      const current = AppShellResize.currentSizeOf(model, section)

      return h.div(
        [
          ...getStyles(
            "resizeHandle",
            styles.handle,
            vertical ? styles.handleHorizontal : styles.handleVertical,
            handleSides[section],
            active && styles.handleActive
          ),
          h.Role("separator"),
          h.Tabindex(0),
          h.AriaLabel(options.label ?? handleLabels[section]),
          h.AriaControls(sectionId(model, section)),
          h.AriaOrientation(vertical ? "horizontal" : "vertical"),
          h.AriaValuemin(options.min ?? 0),
          h.AriaValuemax(Math.round(maxOf(model, section))),
          ...Option.toArray(Option.map(current, (size) => h.AriaValuenow(Math.round(size)))),
          h.DataAttribute("section", section),
          h.DataAttribute("orientation", vertical ? "horizontal" : "vertical"),
          ...(active ? [h.DataAttribute("active", "")] : []),
          h.OnPointerDown((_type, button, _screenX, _screenY, _time, x, y) =>
            button === 0
              ? Option.map(measure(model, section), ({ size, viewport }) =>
                  toParentMessage(Message.PressedHandle({ section, x, y, startSize: size, viewport }))
                )
              : Option.none()
          ),
          h.OnKeyDownPreventDefault((key, modifiers) =>
            Option.flatMap(measure(model, section), ({ size, viewport }) => {
              const currentSize = Option.getOrElse(sizeOf(model, section), () => size)

              return Option.map(keyTarget(model, section, key, modifiers.shiftKey, currentSize, viewport), () =>
                toParentMessage(Message.PressedKey({ section, key, shift: modifiers.shiftKey, currentSize, viewport }))
              )
            })
          ),
          h.OnDoubleClick(toParentMessage(Message.DoubleClickedHandle({ section }))),
          h.OnMount(Mount.mapMessage(MeasureSection(), toParentMessage))
        ],
        [h.div(getStyles("resizeHandle", styles.line, vertical ? styles.lineHorizontal : styles.lineVertical), [])]
      )
    }
    const handles = (part: AppShellSlotName): ReadonlyArray<Html> => {
      if (resize === undefined) return []
      if (part === "main") return []

      return Option.toArray(Option.map(resize.model.options[part], (options) => handle(resize, part, options)))
    }
    const ids = (part: AppShellSlotName) =>
      resize === undefined || part === "main" ? [] : [h.Id(sectionId(resize.model, part))]
    const view = (shellSlot: AppShellSlot): ReadonlyArray<Html> => {
      if (disabled && shellSlot.part !== "main") return []
      const bordered = shellSlot.part !== "main" && (shellSlot.withBorder ?? props.withBorder ?? true)
      const attributes: ReadonlyArray<ElementAttribute<M>> = [
        ...getStyles(
          shellSlot.part,
          ...partStyles(shellSlot.part, frame, props, bordered),
          layer(shellSlot.part, String(shellSlot.zIndex ?? props.zIndex ?? zIndex.app)),
          ...styleProps(shellSlot)
        ),
        ...(bordered ? [h.DataAttribute("with-border", "")] : [])
      ]

      return [
        elements[shellSlot.part](
          [...attributes, ...ids(shellSlot.part)],
          [...content(shellSlot.children), ...handles(shellSlot.part)]
        )
      ]
    }

    return h.div(
      [
        ...getStyles(
          "root",
          shellRules.points,
          setVars(
            ...shellPointVars({
              ...props,
              mode,
              layout: props.layout ?? "default",
              disabled,
              ...(resize === undefined ? {} : { sizes: resizedSizes(resize.model) })
            }),
            [shellVars.duration, resizing ? "0ms" : `${props.transitionDuration ?? 200}ms`],
            [shellVars.timing, props.transitionTimingFunction ?? "ease"]
          ),
          !fixed && styles.rootStatic
        ),
        h.DataAttribute("mode", mode),
        ...(resizing ? [h.DataAttribute("resizing", "")] : []),
        ...(props.layout === undefined ? [] : [h.DataAttribute("layout", props.layout)]),
        ...(disabled ? [h.DataAttribute("disabled", "")] : [])
      ],
      props.children.flatMap(view)
    )
  }
