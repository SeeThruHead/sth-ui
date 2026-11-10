import * as stylex from "@stylexjs/stylex"
import { Effect, Option, Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, GetStyles, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, fontSize, fontWeight, radius, space } from "../../theme/tokens.stylex.ts"
import { nextIndex, toggledMultiple, toggledSingle } from "./navigation.ts"
import type { ToolbarOrientation } from "./navigation.ts"
import { toolbarVars } from "./Toolbar.stylex.ts"

export type ToolbarPart = "root" | "group" | "toggle" | "divider"

export type ToolbarSize = "xs" | "sm" | "md" | "lg" | "xl"

export type ToolbarOptions = {
  readonly orientation?: ToolbarOrientation
  readonly loop?: boolean
  readonly size?: ToolbarSize
  readonly radius?: StyleValue
  readonly withBorder?: boolean
  readonly color?: string
  readonly autoContrast?: boolean
  readonly variant?: "filled" | "light"
}

export type ToolbarToggleProps<M> = {
  readonly ariaLabel?: string
  readonly active?: boolean
  readonly disabled?: boolean
  readonly autoWidth?: boolean
  readonly onClick?: M
  readonly href?: string
  readonly target?: string
  readonly children: ReadonlyArray<Child>
}

export type ToolbarToggleItem = Omit<ToolbarToggleProps<never>, "active" | "onClick" | "href" | "target"> & {
  readonly value: string
}

export type ToolbarToggleGroupProps<M> = {
  readonly ariaLabel?: string
  readonly disabled?: boolean
  readonly items: ReadonlyArray<ToolbarToggleItem>
} & (
  | {
      readonly type: "single"
      readonly value: string | null
      readonly onChange: (value: string | null) => M
    }
  | {
      readonly type: "multiple"
      readonly value: ReadonlyArray<string>
      readonly onChange: (value: ReadonlyArray<string>) => M
    }
)

export type ToolbarParts<M> = {
  readonly Toggle: (props: ToolbarToggleProps<M>) => Html
  readonly Group: (props: { readonly toggles: ReadonlyArray<ToolbarToggleProps<M>> }) => Html
  readonly ToggleGroup: (props: ToolbarToggleGroupProps<M>) => Html
  readonly Divider: () => Html
}

export type ToolbarProps<M> = ToolbarOptions &
  StylesApiProps<ToolbarPart> & {
    readonly ariaLabel?: string
    readonly children: (parts: ToolbarParts<M>) => ReadonlyArray<Child>
  }

export type ToolbarConfig = ComponentConfig<ToolbarOptions, ToolbarPart>

const sizes = stylex.create({
  xs: { [toolbarVars.toggleSize]: "22px", [toolbarVars.padding]: "4px", [toolbarVars.gap]: `calc(${space.xs} / 2)` },
  sm: { [toolbarVars.toggleSize]: "26px", [toolbarVars.padding]: "5px", [toolbarVars.gap]: space.xs },
  md: { [toolbarVars.toggleSize]: "30px", [toolbarVars.padding]: "6px", [toolbarVars.gap]: space.sm },
  lg: { [toolbarVars.toggleSize]: "36px", [toolbarVars.padding]: "8px", [toolbarVars.gap]: space.sm },
  xl: { [toolbarVars.toggleSize]: "42px", [toolbarVars.padding]: "12px", [toolbarVars.gap]: space.md }
})

const toggleRadius = `max(calc(${toolbarVars.radius} - ${toolbarVars.padding}), min(${toolbarVars.radius}, 2px))`

const styles = stylex.create({
  root: {
    [toolbarVars.radius]: radius.default,
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: toolbarVars.gap,
    boxSizing: "border-box",
    backgroundColor: colors.body,
    borderRadius: toolbarVars.radius,
    padding: toolbarVars.padding
  },
  bordered: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray4}, ${palette.dark4})`
  },
  vertical: { flexDirection: "column", alignItems: "stretch", width: "fit-content" },
  filled: {
    [toolbarVars.activeBg]: accent.filled,
    [toolbarVars.activeHover]: accent.filledHover,
    [toolbarVars.activeColor]: palette.white
  },
  filledContrast: { [toolbarVars.activeColor]: accent.contrast },
  light: {
    [toolbarVars.activeBg]: accent.light,
    [toolbarVars.activeHover]: accent.lightHover,
    [toolbarVars.activeColor]: accent.lightColor
  },
  group: { display: "flex", backgroundColor: colors.body },
  groupVertical: { flexDirection: "column" },
  toggle: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box",
    borderRadius: toggleRadius,
    cursor: "pointer",
    appearance: "none",
    textDecoration: "none",
    lineHeight: 1,
    userSelect: "none",
    fontFamily: "inherit",
    fontSize: fontSize.xs,
    width: toolbarVars.toggleSize,
    minWidth: toolbarVars.toggleSize,
    height: toolbarVars.toggleSize,
    padding: `calc(${toolbarVars.toggleSize} / 5)`,
    borderWidth: "1px",
    borderStyle: "solid",
    fontWeight: fontWeight.medium,
    backgroundColor: `light-dark(${palette.white}, ${palette.dark6})`,
    borderColor: `light-dark(${palette.gray4}, ${palette.dark4})`,
    color: `light-dark(${palette.gray7}, ${palette.dark1})`,
    outline: { default: "none", ":focus-visible": `2px solid ${accent.filled}` },
    outlineOffset: "2px",
    position: { default: null, ":focus-visible": "relative" },
    zIndex: { default: null, ":focus-visible": 1 }
  },
  hoverable: {
    backgroundColor: {
      default: `light-dark(${palette.white}, ${palette.dark6})`,
      ":hover": `light-dark(${palette.gray0}, ${palette.dark5})`
    }
  },
  autoWidth: { width: "auto", paddingBlock: 0, paddingInline: `calc(${toolbarVars.toggleSize} / 4)` },
  active: {
    backgroundColor: { default: toolbarVars.activeBg, ":hover": toolbarVars.activeHover },
    color: toolbarVars.activeColor,
    borderColor: "transparent"
  },
  disabled: {
    cursor: "not-allowed",
    color: colors.disabledColor,
    backgroundColor: colors.disabled,
    borderColor: "transparent"
  },
  disabledActive: {
    backgroundColor: `light-dark(${palette.gray4}, ${palette.dark4})`,
    color: `light-dark(${palette.gray6}, ${palette.dark2})`
  },
  first: { borderEndEndRadius: 0, borderStartEndRadius: 0, borderInlineEndWidth: "0.5px" },
  last: { borderEndStartRadius: 0, borderStartStartRadius: 0, borderInlineStartWidth: "0.5px" },
  middle: { borderRadius: 0, borderInlineStartWidth: "0.5px", borderInlineEndWidth: "0.5px" },
  firstVertical: {
    borderEndStartRadius: 0,
    borderEndEndRadius: 0,
    borderStartEndRadius: toggleRadius,
    borderInlineEndWidth: "1px",
    borderBottomWidth: "0.5px"
  },
  lastVertical: {
    borderStartStartRadius: 0,
    borderStartEndRadius: 0,
    borderEndStartRadius: toggleRadius,
    borderInlineStartWidth: "1px",
    borderTopWidth: "0.5px"
  },
  middleVertical: {
    borderRadius: 0,
    borderInlineStartWidth: "1px",
    borderInlineEndWidth: "1px",
    borderBottomWidth: "0.5px",
    borderTopWidth: "0.5px"
  },
  divider: { alignSelf: "stretch", backgroundColor: `light-dark(${palette.gray4}, ${palette.dark4})` },
  dividerHorizontal: { width: "1px" },
  dividerVertical: { height: "1px" }
})

const tabStop = "data-toolbar-tab-stop"

const focusableItems = (root: Element): ReadonlyArray<HTMLElement> => [
  ...root.querySelectorAll<HTMLElement>("[data-toolbar-toggle]:not([data-disabled])")
]

const syncTabIndex = (root: Element): void => {
  const items = focusableItems(root)
  const stop = items.find((item) => item.hasAttribute(tabStop)) ?? items[0]
  items.forEach((item) => item.setAttribute("tabindex", item === stop ? "0" : "-1"))
}

const RovingFocus = Mount.defineStream("ToolbarRovingFocus", {
  args: { orientation: Schema.Literals(["horizontal", "vertical"]), loop: Schema.Boolean },
  messages: [Schema.Never],
  execute: ({ element, orientation, loop }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const keydown = (event: Event): void => {
            const items = focusableItems(element)
            Option.some(event).pipe(
              Option.filter((pressed): pressed is KeyboardEvent => pressed instanceof KeyboardEvent),
              Option.flatMap((pressed) =>
                nextIndex({
                  key: pressed.key,
                  current: items.findIndex((item) => item === document.activeElement),
                  count: items.length,
                  orientation,
                  loop,
                  rtl: getComputedStyle(element).direction === "rtl"
                })
              ),
              Option.map((index) => {
                event.preventDefault()
                items[index]?.focus()
              })
            )
          }
          const focusin = (event: Event): void => {
            const items = focusableItems(element)
            Option.map(Option.fromNullishOr(items.find((item) => item === event.target)), (target) => {
              items.forEach((item) => item.removeAttribute(tabStop))
              target.setAttribute(tabStop, "")
              syncTabIndex(element)
            })
          }
          const observer = new MutationObserver(() => syncTabIndex(element))
          syncTabIndex(element)
          observer.observe(element, { childList: true, subtree: true, attributeFilter: ["data-disabled"] })
          element.addEventListener("keydown", keydown)
          element.addEventListener("focusin", focusin)

          return () => {
            observer.disconnect()
            element.removeEventListener("keydown", keydown)
            element.removeEventListener("focusin", focusin)
          }
        }),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

type Place = "only" | "first" | "middle" | "last"

const placeOf = (index: number, count: number): Place => {
  if (count === 1) return "only"
  if (index === 0) return "first"

  return index === count - 1 ? "last" : "middle"
}

const toggleView = <M>(
  h: HtmlBuilder<M>,
  getStyles: GetStyles<M, ToolbarPart>,
  orientation: ToolbarOrientation,
  place: Place,
  props: ToolbarToggleProps<M>,
  pressed: boolean | undefined
): Html => {
  const disabled = props.disabled === true
  const active = props.active === true
  const vertical = orientation === "vertical"
  const attributes = [
    ...getStyles(
      "toggle",
      styles.toggle,
      !disabled && !active && styles.hoverable,
      props.autoWidth === true && styles.autoWidth,
      active && styles.active,
      disabled && styles.disabled,
      disabled && active && styles.disabledActive,
      place === "first" && (vertical ? styles.firstVertical : styles.first),
      place === "last" && (vertical ? styles.lastVertical : styles.last),
      place === "middle" && (vertical ? styles.middleVertical : styles.middle)
    ),
    h.DataAttribute("toolbar-toggle", ""),
    ...(active ? [h.DataAttribute("active", "")] : []),
    ...(disabled ? [h.DataAttribute("disabled", ""), h.AriaDisabled(true), h.Tabindex(-1)] : []),
    ...(props.autoWidth === true ? [h.DataAttribute("auto-width", "")] : []),
    ...(pressed === undefined ? [] : [h.AriaPressed(pressed ? "true" : "false")]),
    ...(props.ariaLabel === undefined ? [] : [h.AriaLabel(props.ariaLabel)]),
    ...(props.onClick === undefined || disabled ? [] : [h.OnClick(props.onClick)])
  ]

  return props.href === undefined
    ? h.button([...attributes, h.Type("button"), ...(disabled ? [h.Disabled(true)] : [])], props.children)
    : h.a(
        [...attributes, h.Href(props.href), ...(props.target === undefined ? [] : [h.Target(props.target)])],
        props.children
      )
}

const isActive = <M>(group: ToolbarToggleGroupProps<M>, value: string) =>
  group.type === "single" ? group.value === value : group.value.includes(value)

const changeOf = <M>(group: ToolbarToggleGroupProps<M>, value: string): M =>
  group.type === "single"
    ? group.onChange(toggledSingle(group.value, value))
    : group.onChange(toggledMultiple(group.value, value))

export const Toolbar =
  (config: { readonly Toolbar?: ToolbarConfig }) =>
  <M>(h: HtmlBuilder<M>, input: ToolbarProps<M>): Html => {
    const props = withDefaults(config.Toolbar, input)
    const getStyles = stylesApi<M, ToolbarPart>(h, props, config.Toolbar, "root")
    const orientation = props.orientation ?? "horizontal"
    const vertical = orientation === "vertical"
    const groupView = (role: "group" | undefined, label: string | undefined, toggles: ReadonlyArray<Html>) =>
      h.div(
        [
          ...getStyles("group", styles.group, vertical && styles.groupVertical),
          h.DataAttribute("orientation", orientation),
          ...(role === undefined ? [] : [h.Role(role)]),
          ...(label === undefined ? [] : [h.AriaLabel(label)])
        ],
        toggles
      )
    const parts: ToolbarParts<M> = {
      Toggle: (toggle) => toggleView(h, getStyles, orientation, "only", toggle, toggle.active),
      Group: ({ toggles }) =>
        groupView(
          undefined,
          undefined,
          toggles.map((toggle, index) =>
            toggleView(h, getStyles, orientation, placeOf(index, toggles.length), toggle, toggle.active)
          )
        ),
      ToggleGroup: (group) =>
        groupView(
          "group",
          group.ariaLabel,
          group.items.map((item, index) => {
            const active = isActive(group, item.value)

            return toggleView(
              h,
              getStyles,
              orientation,
              placeOf(index, group.items.length),
              {
                ...item,
                active,
                disabled: item.disabled === true || group.disabled === true,
                onClick: changeOf(group, item.value)
              },
              active
            )
          })
        ),
      Divider: () =>
        h.div(
          [
            ...getStyles("divider", styles.divider, vertical ? styles.dividerVertical : styles.dividerHorizontal),
            h.Role("separator"),
            h.AriaOrientation(vertical ? "horizontal" : "vertical"),
            h.DataAttribute("orientation", orientation)
          ],
          []
        )
    }
    const variant = props.variant ?? "filled"

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          sizes[props.size ?? "md"],
          props.withBorder !== false && styles.bordered,
          vertical && styles.vertical,
          ...accentStyle(props.color, customAccent),
          variant === "filled" ? styles.filled : styles.light,
          variant === "filled" && props.autoContrast === true && styles.filledContrast,
          setDefinedVars([toolbarVars.radius, mapDefined(props.radius, radiusValue)])
        ),
        h.Role("toolbar"),
        h.AriaOrientation(orientation),
        h.DataAttribute("orientation", orientation),
        ...(props.withBorder === false ? [] : [h.DataAttribute("with-border", "")]),
        ...(props.ariaLabel === undefined ? [] : [h.AriaLabel(props.ariaLabel)]),
        h.OnMount(RovingFocus({ orientation, loop: props.loop !== false }))
      ],
      props.children(parts)
    )
  }
