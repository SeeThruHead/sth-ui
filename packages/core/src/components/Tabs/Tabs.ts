import * as stylex from "@stylexjs/stylex"
import { Effect, Function, Option, Predicate, Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { shared } from "../../styles/shared.ts"
import { radiusValue, styleProps } from "../../styles/styleProps.ts"
import type { StyleProps, StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedStyle, setDefinedVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, GetStyles, StylesApiProps, Sx } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, fontSize, radius, space } from "../../theme/tokens.stylex.ts"
import { unstyledButtonStyles } from "../UnstyledButton/UnstyledButton.ts"
import { stepOf, targetIndex } from "./keyboard.ts"
import type { Orientation, Step } from "./keyboard.ts"
import { tabsVars } from "./Tabs.stylex.ts"

export type TabsPart = "root" | "list" | "panel" | "tab" | "tabSection" | "tabLabel"

export type TabsVariant = "default" | "outline" | "pills"

export type TabsOptions = {
  readonly variant?: TabsVariant
  readonly orientation?: Orientation
  readonly placement?: "left" | "right"
  readonly color?: string
  readonly radius?: StyleValue
  readonly inverted?: boolean
  readonly loop?: boolean
  readonly activateTabWithKeyboard?: boolean
  readonly allowTabDeactivation?: boolean
  readonly keepMounted?: boolean
  readonly autoContrast?: boolean
}

export type TabsTab = StyleProps & {
  readonly _tag: "TabsTab"
  readonly value: string
  readonly leftSection?: Child
  readonly rightSection?: Child
  readonly color?: string
  readonly disabled?: boolean
  readonly styles?: Sx
  readonly children?: ReadonlyArray<Child>
}

export type TabsList = StyleProps & {
  readonly _tag: "TabsList"
  readonly grow?: boolean
  readonly justify?: string
  readonly styles?: Sx
  readonly children: ReadonlyArray<TabsTab>
}

export type TabsPanel = StyleProps & {
  readonly _tag: "TabsPanel"
  readonly value: string
  readonly keepMounted?: boolean
  readonly styles?: Sx
  readonly children: ReadonlyArray<Child>
}

export type TabsChild = Child | TabsList | TabsPanel

export type TabsProps<M> = TabsOptions &
  StylesApiProps<TabsPart> & {
    readonly id: string
    readonly value: string | null
    readonly onChange: (value: string | null) => M
    readonly children: ReadonlyArray<TabsChild>
  }

export type TabsConfig = ComponentConfig<TabsOptions, TabsPart>

export const tabsList = (list: Omit<TabsList, "_tag">): TabsList => ({ _tag: "TabsList", ...list })

export const tabsTab = (tab: Omit<TabsTab, "_tag">): TabsTab => ({ _tag: "TabsTab", ...tab })

export const tabsPanel = (panel: Omit<TabsPanel, "_tag">): TabsPanel => ({ _tag: "TabsPanel", ...panel })

type Side = "top" | "bottom" | "start" | "end"

const borderColor = `light-dark(${palette.gray3}, ${palette.dark4})`

const hoverColor = `light-dark(${palette.gray0}, ${palette.dark6})`

const styles = stylex.create({
  root: { [tabsVars.radius]: radius.default, display: "block" },
  vertical: { display: "flex", flexDirection: "row" },
  verticalRight: { display: "flex", flexDirection: "row-reverse" },
  list: { display: "flex", flexWrap: "wrap", justifyContent: "flex-start", flexDirection: "row" },
  listVertical: { flexDirection: "column" },
  listLined: { position: "relative" },
  listPills: { gap: `calc(${space.sm} / 2)` },
  panel: { display: { default: "block", ":is([hidden])": "none" } },
  panelVertical: { flexGrow: 1 },
  tab: {
    position: "relative",
    paddingBlock: space.xs,
    paddingInline: space.md,
    fontSize: fontSize.sm,
    whiteSpace: "nowrap",
    zIndex: { default: 0, ":focus": 1 },
    display: "flex",
    alignItems: "center",
    lineHeight: 1,
    userSelect: "none"
  },
  grow: { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
  disabled: { opacity: 0.5, cursor: "not-allowed" },
  section: { display: "flex", alignItems: "center", justifyContent: "center" },
  sectionLeft: { marginInlineEnd: space.xs },
  sectionRight: { marginInlineStart: space.xs },
  label: { flexGrow: 1, flexShrink: 1, flexBasis: 0, textAlign: "center" },
  line: { position: "absolute", backgroundColor: borderColor },
  defaultTab: {
    borderStyle: "solid",
    borderColor: { default: "transparent", ":hover": borderColor },
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderInlineStartWidth: 0,
    borderInlineEndWidth: 0,
    backgroundColor: { default: "transparent", ":hover": hoverColor }
  },
  defaultActive: { borderColor: { default: accent.filled, ":hover": accent.filled } },
  disabledHover: { backgroundColor: { default: "transparent", ":hover": "transparent" } },
  outlineTab: {
    borderStyle: "solid",
    borderColor: "transparent",
    borderTopWidth: "1px",
    borderBottomWidth: "1px",
    borderInlineStartWidth: "1px",
    borderInlineEndWidth: "1px"
  },
  outlineActive: { borderColor },
  dot: { position: "absolute", width: "1px", height: "1px", backgroundColor: borderColor },
  pillsTab: {
    borderRadius: tabsVars.radius,
    backgroundColor: { default: "transparent", ":hover": hoverColor },
    color: "inherit"
  },
  pillsActive: {
    backgroundColor: { default: accent.filled, ":hover": accent.filled },
    color: colors.white
  },
  pillsContrast: { color: accent.contrast }
})

const radii = stylex.create({
  top: {
    borderStartStartRadius: tabsVars.radius,
    borderStartEndRadius: tabsVars.radius,
    borderEndStartRadius: 0,
    borderEndEndRadius: 0
  },
  bottom: {
    borderStartStartRadius: 0,
    borderStartEndRadius: 0,
    borderEndStartRadius: tabsVars.radius,
    borderEndEndRadius: tabsVars.radius
  },
  start: {
    borderStartStartRadius: tabsVars.radius,
    borderStartEndRadius: 0,
    borderEndStartRadius: tabsVars.radius,
    borderEndEndRadius: 0
  },
  end: {
    borderStartStartRadius: 0,
    borderStartEndRadius: tabsVars.radius,
    borderEndStartRadius: 0,
    borderEndEndRadius: tabsVars.radius
  }
})

const defaultBorders = stylex.create({
  bottom: { borderBottomWidth: "2px" },
  top: { borderTopWidth: "2px" },
  end: { borderInlineEndWidth: "2px" },
  start: { borderInlineStartWidth: "2px" }
})

const openSides = stylex.create({
  bottom: { borderBottomColor: colors.body },
  top: { borderTopColor: colors.body },
  end: { borderInlineEndColor: colors.body },
  start: { borderInlineStartColor: colors.body }
})

const lines = stylex.create({
  bottom: { bottom: 0, insetInlineStart: 0, insetInlineEnd: 0 },
  top: { top: 0, insetInlineStart: 0, insetInlineEnd: 0 },
  end: { insetInlineEnd: 0, top: 0, bottom: 0 },
  start: { insetInlineStart: 0, top: 0, bottom: 0 }
})

const thickness = stylex.create({
  horizontal2: { height: "2px" },
  horizontal1: { height: "1px" },
  vertical2: { width: "2px" },
  vertical1: { width: "1px" }
})

const dots = stylex.create({
  bottomStart: { bottom: "-1px", insetInlineStart: "-1px" },
  bottomEnd: { bottom: "-1px", insetInlineEnd: "-1px" },
  topStart: { top: "-1px", insetInlineStart: "-1px" },
  topEnd: { top: "-1px", insetInlineEnd: "-1px" }
})

const tabRadius = { bottom: radii.top, top: radii.bottom, start: radii.end, end: radii.start } as const

const lineThickness = {
  default: { horizontal: thickness.horizontal2, vertical: thickness.vertical2 },
  outline: { horizontal: thickness.horizontal1, vertical: thickness.vertical1 }
} as const

const dotsBySide = {
  bottom: [dots.bottomStart, dots.bottomEnd],
  top: [dots.topStart, dots.topEnd],
  end: [dots.topEnd, dots.bottomEnd],
  start: [dots.topStart, dots.bottomStart]
} as const

type Context<M> = {
  readonly h: HtmlBuilder<M>
  readonly getStyles: GetStyles<M, TabsPart>
  readonly props: TabsProps<M>
  readonly variant: TabsVariant
  readonly orientation: Orientation
  readonly placement: "left" | "right"
  readonly inverted: boolean
  readonly side: Side
  readonly panels: ReadonlySet<string>
}

const sideOf = (orientation: Orientation, placement: "left" | "right", inverted: boolean): Side => {
  if (orientation === "vertical") return placement === "left" ? "end" : "start"

  return inverted ? "top" : "bottom"
}

const tabId = (id: string, value: string): string => `${id}-tab-${value}`

const panelId = (id: string, value: string): string => `${id}-panel-${value}`

const isList = (child: TabsChild): child is TabsList => Predicate.isTagged(child, "TabsList")

const isPanel = (child: TabsChild): child is TabsPanel => Predicate.isTagged(child, "TabsPanel")

const positionAttributes = <M>(context: Context<M>) => [
  context.h.DataAttribute("orientation", context.orientation),
  ...(context.inverted ? [context.h.DataAttribute("inverted", "")] : []),
  ...(context.orientation === "vertical" ? [context.h.DataAttribute("placement", context.placement)] : [])
]

const variantStyles = <M>(context: Context<M>, active: boolean, disabled: boolean) => {
  if (context.variant === "pills") {
    return [
      styles.pillsTab,
      active && styles.pillsActive,
      active && context.props.autoContrast === true && styles.pillsContrast,
      disabled && styles.disabledHover
    ]
  }
  const radiusStyle = tabRadius[context.side]
  if (context.variant === "outline") {
    return [radiusStyle, styles.outlineTab, active && styles.outlineActive, active && openSides[context.side]]
  }

  return [
    radiusStyle,
    styles.defaultTab,
    defaultBorders[context.side],
    active && styles.defaultActive,
    disabled && styles.disabledHover
  ]
}

const corners = <M>(context: Context<M>, active: boolean): ReadonlyArray<Html> => {
  if (!active || context.variant !== "outline") return []

  return dotsBySide[context.side].map((place) =>
    context.h.span([...sx(context.h, styles.dot, place), context.h.AriaHidden(true)], [])
  )
}

const activation = <M>(context: Context<M>, value: string): M =>
  context.props.onChange(context.props.allowTabDeactivation === true && context.props.value === value ? null : value)

const tabView = <M>(context: Context<M>, list: TabsList, tab: TabsTab): Html => {
  const { h, getStyles, props } = context
  const active = props.value === tab.value
  const disabled = tab.disabled === true
  const focusable = active || props.value === null
  const label = tab.children ?? []
  const labelled = label.length > 0

  return h.button(
    [
      ...getStyles(
        "tab",
        unstyledButtonStyles.root,
        ...accentStyle(tab.color, customAccent),
        styles.tab,
        ...variantStyles(context, active, disabled),
        list.grow === true && styles.grow,
        disabled && styles.disabled,
        shared.focusRing,
        tab.styles,
        ...styleProps(tab)
      ),
      h.Type("button"),
      h.Disabled(disabled),
      h.Role("tab"),
      h.Id(tabId(props.id, tab.value)),
      h.AriaSelected(active),
      h.Tabindex(focusable ? 0 : -1),
      ...(context.panels.has(tab.value) ? [h.AriaControls(panelId(props.id, tab.value))] : []),
      h.DataAttribute("variant", context.variant),
      ...(active ? [h.DataAttribute("active", "")] : []),
      ...(disabled ? [h.DataAttribute("disabled", "")] : []),
      ...positionAttributes(context),
      h.OnClick(activation(context, tab.value))
    ],
    [
      ...corners(context, active),
      ...(tab.leftSection === undefined
        ? []
        : [
            h.span(
              [
                ...getStyles("tabSection", styles.section, labelled && styles.sectionLeft),
                h.DataAttribute("position", "left")
              ],
              [tab.leftSection]
            )
          ]),
      ...(labelled ? [h.span(getStyles("tabLabel", styles.label), label)] : []),
      ...(tab.rightSection === undefined
        ? []
        : [
            h.span(
              [
                ...getStyles("tabSection", styles.section, labelled && styles.sectionRight),
                h.DataAttribute("position", "right")
              ],
              [tab.rightSection]
            )
          ])
    ]
  )
}

const activatesOnFocus = (list: Element, step: Step): boolean => {
  if (step === "first" || step === "last") return false

  return list.hasAttribute("data-activate-on-focus")
}

const tabElements = (list: Element): ReadonlyArray<HTMLButtonElement> =>
  [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')].filter(
    (tab) => tab.closest('[role="tablist"]') === list
  )

const orientationOf = (list: Element): Orientation =>
  list.getAttribute("aria-orientation") === "vertical" ? "vertical" : "horizontal"

const isKeyboardEvent = (event: Event): event is KeyboardEvent => event instanceof KeyboardEvent

const isTarget =
  (event: KeyboardEvent) =>
  (tab: HTMLButtonElement): boolean =>
    tab === event.target

const moveFocus = (list: Element, event: KeyboardEvent): void => {
  const tabs = tabElements(list)
  const rtl = getComputedStyle(list).direction === "rtl"
  const current = Option.liftPredicate(tabs.findIndex(isTarget(event)), (index) => index !== -1)
  const step = stepOf(event.key, orientationOf(list), rtl)
  const target = Option.flatMap(Option.all([current, step]), ([index, found]) =>
    Option.map(targetIndex(tabs, index, found, list.hasAttribute("data-loop")), (next) => ({ next, found }))
  )
  Option.map(target, ({ next, found }) =>
    Option.map(Option.fromNullishOr(tabs[next]), (tab) => {
      event.preventDefault()
      event.stopPropagation()
      tab.focus()
      if (activatesOnFocus(list, found)) tab.click()
    })
  )
}

const TabsKeyboard = Mount.defineStream("TabsKeyboard", {
  messages: [Schema.Never],
  execute: ({ element }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const onKeyDown = (event: Event): void => {
            Option.map(Option.liftPredicate(event, isKeyboardEvent), (key) => moveFocus(element, key))
          }
          element.addEventListener("keydown", onKeyDown)

          return () => element.removeEventListener("keydown", onKeyDown)
        }),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

const listView = <M>(context: Context<M>, list: TabsList): Html => {
  const { h, getStyles, props, variant, orientation } = context

  return h.div(
    [
      ...getStyles(
        "list",
        styles.list,
        orientation === "vertical" && styles.listVertical,
        variant !== "pills" && styles.listLined,
        variant === "pills" && styles.listPills,
        setDefinedStyle(["justifyContent", list.justify]),
        list.styles,
        ...styleProps(list)
      ),
      h.Role("tablist"),
      h.AriaOrientation(orientation),
      h.DataAttribute("variant", variant),
      ...(list.grow === true ? [h.DataAttribute("grow", "")] : []),
      ...((props.loop ?? true) ? [h.DataAttribute("loop", "")] : []),
      ...((props.activateTabWithKeyboard ?? true) ? [h.DataAttribute("activate-on-focus", "")] : []),
      ...positionAttributes(context),
      h.OnMount(Mount.mapMessage(TabsKeyboard(), Function.absurd<M>))
    ],
    [
      ...(variant === "pills"
        ? []
        : [
            h.span(
              [...sx(h, styles.line, lines[context.side], lineThickness[variant][orientation]), h.AriaHidden(true)],
              []
            )
          ]),
      ...list.children.map((tab) => tabView(context, list, tab))
    ]
  )
}

const panelView = <M>(context: Context<M>, panel: TabsPanel): Html => {
  const { h, getStyles, props } = context
  const active = props.value === panel.value
  const mounted = active || (panel.keepMounted ?? props.keepMounted ?? true)

  return h.div(
    [
      ...getStyles(
        "panel",
        styles.panel,
        context.orientation === "vertical" && styles.panelVertical,
        panel.styles,
        ...styleProps(panel)
      ),
      h.Role("tabpanel"),
      h.Id(panelId(props.id, panel.value)),
      h.AriaLabelledBy(tabId(props.id, panel.value)),
      h.DataAttribute("orientation", context.orientation),
      ...(active ? [] : [h.Attribute("hidden", "")])
    ],
    mounted ? panel.children : []
  )
}

export const Tabs =
  (config: { readonly Tabs?: TabsConfig }) =>
  <M>(h: HtmlBuilder<M>, input: TabsProps<M>): Html => {
    const props = withDefaults(config.Tabs, input)
    const getStyles = stylesApi<M, TabsPart>(h, props, config.Tabs, "root")
    const variant = props.variant ?? "default"
    const orientation = props.orientation ?? "horizontal"
    const placement = props.placement ?? "left"
    const inverted = orientation === "horizontal" && props.inverted === true
    const context: Context<M> = {
      h,
      getStyles,
      props,
      variant,
      orientation,
      placement,
      inverted,
      side: sideOf(orientation, placement, inverted),
      panels: new Set(props.children.filter(isPanel).map((panel) => panel.value))
    }

    return h.div(
      [
        ...getStyles(
          "root",
          ...accentStyle(props.color, customAccent),
          styles.root,
          orientation === "vertical" && (placement === "left" ? styles.vertical : styles.verticalRight),
          setDefinedVars([tabsVars.radius, mapDefined(props.radius, radiusValue)])
        ),
        h.Id(props.id),
        h.DataAttribute("variant", variant),
        ...positionAttributes(context)
      ],
      props.children.map((child) => {
        if (isList(child)) return listView(context, child)
        if (isPanel(child)) return panelView(context, child)

        return child
      })
    )
  }
