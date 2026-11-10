import * as stylex from "@stylexjs/stylex"
import { Effect, Function, Option, Predicate, Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { shared } from "../../styles/shared.ts"
import { radiusValue, styleProps } from "../../styles/styleProps.ts"
import type { StyleProps, StyleValue } from "../../styles/styleProps.ts"
import { listOf, mapDefined, mergeStyles, setDefinedVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, GetStyles, StylesApiProps, Sx } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { colors, fontSize, fontWeight, lineHeight, space } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { Collapse } from "../Collapse/Collapse.ts"
import type { CollapseConfig } from "../Collapse/Collapse.ts"
import { stepOf, targetIndex } from "../Tabs/keyboard.ts"
import { unstyledButtonStyles } from "../UnstyledButton/UnstyledButton.ts"
import { accordionVars } from "./Accordion.stylex.ts"

export type AccordionPart =
  | "root"
  | "content"
  | "item"
  | "panel"
  | "icon"
  | "chevron"
  | "label"
  | "itemTitle"
  | "control"

export type AccordionVariant = "default" | "contained" | "filled" | "separated"

export type AccordionChevronPosition = "left" | "right"

export type AccordionHeadingOrder = 2 | 3 | 4 | 5 | 6

export type AccordionOptions = {
  readonly variant?: AccordionVariant
  readonly loop?: boolean
  readonly transitionDuration?: number
  readonly disableChevronRotation?: boolean
  readonly disableCollapse?: boolean
  readonly chevronPosition?: AccordionChevronPosition
  readonly chevronSize?: StyleValue
  readonly chevronIconSize?: number
  readonly order?: AccordionHeadingOrder
  readonly radius?: StyleValue
  readonly keepMounted?: boolean
}

export type AccordionControl = StyleProps & {
  readonly _tag: "AccordionControl"
  readonly icon?: Child
  readonly chevron?: Child
  readonly disabled?: boolean
  readonly ariaLabel?: string
  readonly wrap?: (control: Html) => Html
  readonly styles?: Sx
  readonly children: ReadonlyArray<Child>
}

export type AccordionPanel = StyleProps & {
  readonly _tag: "AccordionPanel"
  readonly keepMounted?: boolean
  readonly styles?: Sx
  readonly children: ReadonlyArray<Child>
}

export type AccordionItemChild = Child | AccordionControl | AccordionPanel

export type AccordionItem = StyleProps & {
  readonly _tag: "AccordionItem"
  readonly value: string
  readonly styles?: Sx
  readonly children: ReadonlyArray<AccordionItemChild>
}

export type AccordionSelection<M> =
  | {
      readonly multiple?: false
      readonly value: string | null
      readonly onChange: (value: string | null) => M
    }
  | {
      readonly multiple: true
      readonly value: ReadonlyArray<string>
      readonly onChange: (value: ReadonlyArray<string>) => M
    }

export type AccordionProps<M> = AccordionOptions &
  StylesApiProps<AccordionPart> &
  AccordionSelection<M> & {
    readonly id: string
    readonly chevron?: Child | null
    readonly children: ReadonlyArray<AccordionItem | Child>
  }

export type AccordionConfig = ComponentConfig<AccordionOptions, AccordionPart>

export const accordionItem = (item: Omit<AccordionItem, "_tag">): AccordionItem => ({ _tag: "AccordionItem", ...item })

export const accordionControl = (control: Omit<AccordionControl, "_tag">): AccordionControl => ({
  _tag: "AccordionControl",
  ...control
})

export const accordionPanel = (panel: Omit<AccordionPanel, "_tag">): AccordionPanel => ({
  _tag: "AccordionPanel",
  ...panel
})

const isItem = (child: AccordionItem | Child): child is AccordionItem => Predicate.isTagged(child, "AccordionItem")

const isControl = (child: AccordionItemChild): child is AccordionControl =>
  Predicate.isTagged(child, "AccordionControl")

const isPanel = (child: AccordionItemChild): child is AccordionPanel => Predicate.isTagged(child, "AccordionPanel")

const values = <M>(selection: AccordionSelection<M>): ReadonlyArray<string> =>
  selection.multiple === true ? selection.value : [selection.value].filter(Predicate.isNotNull)

const toggled = <M>(selection: AccordionSelection<M>, item: string, disableCollapse: boolean): M => {
  if (selection.multiple === true) {
    return selection.onChange(
      selection.value.includes(item) ? selection.value.filter((kept) => kept !== item) : [...selection.value, item]
    )
  }
  if (selection.value !== item) return selection.onChange(item)

  return selection.onChange(disableCollapse ? item : null)
}

const controlsOf = (root: Element): ReadonlyArray<HTMLButtonElement> =>
  [...root.querySelectorAll<HTMLButtonElement>("[data-accordion-control]")].filter(
    (control) => control.closest("[data-accordion]") === root
  )

const isKeyboardEvent = (event: Event): event is KeyboardEvent => event instanceof KeyboardEvent

const moveFocus = (root: Element, event: KeyboardEvent): void => {
  const controls = controlsOf(root)
  const current = Option.liftPredicate(
    controls.findIndex((control) => control === event.target),
    (index) => index !== -1
  )
  const states = controls.map((control) => ({ disabled: control.disabled }))
  const target = Option.flatMap(Option.all([current, stepOf(event.key, "vertical", false)]), ([index, step]) =>
    targetIndex(states, index, step, root.hasAttribute("data-loop"))
  )
  Option.map(
    Option.flatMap(target, (next) => Option.fromNullishOr(controls[next])),
    (control) => {
      event.preventDefault()
      control.focus()
    }
  )
}

const AccordionKeyboard = Mount.defineStream("AccordionKeyboard", {
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

const borderColor = `light-dark(${palette.gray3}, ${palette.dark4})`

const filledColor = `light-dark(${palette.gray0}, ${palette.dark6})`

const styles = stylex.create({
  panel: { overflowWrap: "break-word" },
  content: { padding: space.md, paddingTop: `calc(${space.xs} / 2)` },
  itemTitle: { margin: 0, padding: 0, width: "100%" },
  control: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    flexDirection: "row-reverse",
    paddingInline: space.md,
    opacity: 1,
    cursor: "pointer",
    backgroundColor: "transparent",
    color: colors.bright,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md
  },
  controlLeft: { flexDirection: "row", paddingInlineStart: 0 },
  controlDisabled: { opacity: 0.4, cursor: "not-allowed" },
  controlHover: {
    backgroundColor: { default: "transparent", ":hover": `light-dark(${palette.gray0}, ${palette.dark6})` }
  },
  label: {
    color: "inherit",
    fontWeight: fontWeight.regular,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    paddingTop: space.sm,
    paddingBottom: space.sm,
    textAlign: "start"
  },
  chevron: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    transitionProperty: "transform",
    transitionDuration: accordionVars.duration,
    transitionTimingFunction: "ease",
    width: accordionVars.chevronSize,
    minWidth: accordionVars.chevronSize,
    transform: "rotate(0deg)"
  },
  rotated: { transform: "rotate(180deg)" },
  chevronLeft: { marginInlineEnd: space.md, marginInlineStart: space.md },
  icon: { display: "flex", alignItems: "center", justifyContent: "center", marginInlineEnd: space.sm },
  iconLeft: { marginInlineEnd: 0, marginInlineStart: space.lg },
  chevronIcon: { display: "block" },
  defaultItem: { borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: borderColor },
  containedItem: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor,
    transitionProperty: "background-color",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease"
  },
  filledActive: { backgroundColor: filledColor },
  joined: { borderTopWidth: 0 },
  firstItem: { borderStartStartRadius: accordionVars.radius, borderStartEndRadius: accordionVars.radius },
  lastItem: { borderEndStartRadius: accordionVars.radius, borderEndEndRadius: accordionVars.radius },
  filledItem: { borderRadius: accordionVars.radius },
  separatedItem: {
    backgroundColor: filledColor,
    borderRadius: accordionVars.radius,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    transitionProperty: "background-color",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease"
  },
  separatedActive: { borderColor, backgroundColor: `light-dark(${palette.white}, ${palette.dark7})` },
  spaced: { marginTop: space.md }
})

const chevronPath =
  "M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"

export const AccordionChevron = <M>(h: HtmlBuilder<M>, size: number): Html =>
  h.svg(
    [
      ...sx(h, styles.chevronIcon),
      h.Attribute("viewBox", "0 0 15 15"),
      h.Attribute("fill", "none"),
      h.AriaHidden(true),
      h.Style({ width: rem(size), height: rem(size) })
    ],
    [
      h.path(
        [
          h.Attribute("d", chevronPath),
          h.Attribute("fill", "currentColor"),
          h.Attribute("fill-rule", "evenodd"),
          h.Attribute("clip-rule", "evenodd")
        ],
        []
      )
    ]
  )

type Position = { readonly index: number; readonly count: number }

type Context<M> = {
  readonly h: HtmlBuilder<M>
  readonly props: AccordionProps<M>
  readonly getStyles: GetStyles<M, AccordionPart>
  readonly active: ReadonlyArray<string>
  readonly collapse: ReturnType<typeof Collapse>
  readonly panelStyles: ReadonlyArray<Sx>
}

const variantOf = <M>(context: Context<M>): AccordionVariant => context.props.variant ?? "default"

const controlId = <M>(context: Context<M>, value: string) => `${context.props.id}-control-${value}`

const panelId = <M>(context: Context<M>, value: string) => `${context.props.id}-panel-${value}`

const controlView = <M>(context: Context<M>, item: AccordionItem, control: AccordionControl): Html => {
  const { h, props, getStyles } = context
  const active = context.active.includes(item.value)
  const left = props.chevronPosition === "left"
  const disabled = control.disabled === true
  const variant = variantOf(context)
  const hovers = !disabled && (variant === "default" || variant === "contained")
  const defaultChevron =
    props.chevron === null ? [] : [props.chevron ?? AccordionChevron(h, props.chevronIconSize ?? 16)]
  const chevron = control.chevron === undefined ? defaultChevron : [control.chevron]
  const button = h.button(
    [
      ...getStyles(
        "control",
        unstyledButtonStyles.root,
        shared.focusRing,
        styles.control,
        left && styles.controlLeft,
        hovers && styles.controlHover,
        disabled && styles.controlDisabled,
        control.styles,
        ...styleProps(control)
      ),
      h.Type("button"),
      h.Id(controlId(context, item.value)),
      h.AriaExpanded(active),
      h.AriaControls(panelId(context, item.value)),
      h.DataAttribute("accordion-control", ""),
      ...(control.ariaLabel === undefined ? [] : [h.AriaLabel(control.ariaLabel)]),
      h.DataAttribute("chevron-position", left ? "left" : "right"),
      ...(active ? [h.DataAttribute("active", "")] : []),
      ...(disabled ? [h.Disabled(true), h.DataAttribute("disabled", "")] : []),
      h.OnClick(toggled(props, item.value, props.disableCollapse === true))
    ],
    [
      h.span(
        [
          ...getStyles(
            "chevron",
            styles.chevron,
            active && props.disableChevronRotation !== true && styles.rotated,
            left && styles.chevronLeft
          ),
          h.DataAttribute("position", left ? "left" : "right"),
          ...(active && props.disableChevronRotation !== true ? [h.DataAttribute("rotate", "")] : [])
        ],
        chevron
      ),
      h.span(getStyles("label", styles.label), control.children),
      ...(control.icon === undefined
        ? []
        : [h.span(getStyles("icon", styles.icon, left && styles.iconLeft), [control.icon])])
    ]
  )
  const heading = (order: AccordionHeadingOrder, content: Html) => {
    const attributes = getStyles("itemTitle", styles.itemTitle)
    if (order === 2) return h.h2(attributes, [content])
    if (order === 3) return h.h3(attributes, [content])
    if (order === 4) return h.h4(attributes, [content])

    return order === 5 ? h.h5(attributes, [content]) : h.h6(attributes, [content])
  }

  const wrapped = control.wrap === undefined ? button : control.wrap(button)

  return props.order === undefined ? wrapped : heading(props.order, wrapped)
}

const panelView = <M>(context: Context<M>, item: AccordionItem, panel: AccordionPanel): Html => {
  const { h, props, getStyles } = context

  return context.collapse(h, {
    id: panelId(context, item.value),
    expanded: context.active.includes(item.value),
    transitionDuration: props.transitionDuration ?? 200,
    keepMounted: panel.keepMounted ?? props.keepMounted ?? true,
    attributes: {
      root: { ...props.attributes?.panel, role: "region", "aria-labelledby": controlId(context, item.value) }
    },
    styles: { root: [styles.panel, ...context.panelStyles, panel.styles, ...styleProps(panel)] },
    children: [h.div(getStyles("content", styles.content), panel.children)]
  })
}

const itemView = <M>(context: Context<M>, item: AccordionItem, position: Position): Html => {
  const { h, getStyles } = context
  const active = context.active.includes(item.value)
  const variant = variantOf(context)
  const first = position.index === 0
  const last = position.index === position.count - 1

  return h.div(
    [
      ...getStyles(
        "item",
        variant === "default" && styles.defaultItem,
        variant === "contained" && styles.containedItem,
        variant === "contained" && active && styles.filledActive,
        variant === "contained" && !first && styles.joined,
        variant === "contained" && first && styles.firstItem,
        variant === "contained" && last && styles.lastItem,
        variant === "filled" && styles.filledItem,
        variant === "filled" && active && styles.filledActive,
        variant === "separated" && styles.separatedItem,
        variant === "separated" && active && styles.separatedActive,
        variant === "separated" && !first && styles.spaced,
        item.styles,
        ...styleProps(item)
      ),
      h.DataAttribute("variant", variant),
      ...(active ? [h.DataAttribute("active", "")] : [])
    ],
    item.children.map((child) => {
      if (isControl(child)) return controlView(context, item, child)

      return isPanel(child) ? panelView(context, item, child) : child
    })
  )
}

export const Accordion = (config: { readonly Accordion?: AccordionConfig; readonly Collapse?: CollapseConfig }) => {
  const collapse = Collapse(config)

  return <M>(h: HtmlBuilder<M>, input: AccordionProps<M>): Html => {
    const props = withDefaults(config.Accordion, input)
    const getStyles = stylesApi<M, AccordionPart>(h, props, config.Accordion, "root")
    const parts = mergeStyles(["panel"], config.Accordion?.styles, props.styles)
    const panelStyles = props.unstyled === true ? [] : listOf(parts.panel)
    const context = { h, props, getStyles, active: values(input), collapse, panelStyles }
    const items = props.children.filter(isItem)
    const variant = variantOf(context)

    return h.div(
      [
        ...getStyles(
          "root",
          setDefinedVars(
            [accordionVars.duration, mapDefined(props.transitionDuration, (ms) => `${ms}ms`)],
            [
              accordionVars.chevronSize,
              mapDefined(props.chevronSize, (size) => (Predicate.isNumber(size) ? rem(size) : size))
            ],
            [accordionVars.radius, mapDefined(props.radius, radiusValue)]
          )
        ),
        h.Id(props.id),
        h.DataAttribute("accordion", ""),
        h.DataAttribute("variant", variant),
        ...((props.loop ?? true) ? [h.DataAttribute("loop", "")] : []),
        h.OnMount(Mount.mapMessage(AccordionKeyboard(), Function.absurd<M>))
      ],
      props.children.map((child) =>
        isItem(child) ? itemView(context, child, { index: items.indexOf(child), count: items.length }) : child
      )
    )
  }
}
