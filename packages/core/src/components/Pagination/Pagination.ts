import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue, spacing } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, GetStyles, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { accent, colors, fontSize, radius } from "../../theme/tokens.stylex.ts"
import { clampPage, firstPage, lastPage, paginationRange } from "./model.ts"
import { paginationVars } from "./Pagination.stylex.ts"

export { paginationRange } from "./model.ts"

export type PaginationPart = "root" | "control" | "dots" | "items" | "label"

export type PaginationSize = keyof typeof sizes

export type PaginationControl = "first" | "previous" | "next" | "last"

export type PaginationLink = { readonly href?: string; readonly label?: string; readonly children?: Child }

export type PaginationOptions = {
  readonly size?: PaginationSize
  readonly radius?: StyleValue
  readonly color?: string
  readonly autoContrast?: boolean
  readonly gap?: StyleValue
  readonly siblings?: number
  readonly boundaries?: number
  readonly withEdges?: boolean
  readonly withControls?: boolean
  readonly withPages?: boolean
  readonly hideWithOnePage?: boolean
  readonly layout?: "default" | "responsive"
}

export type PaginationProps<M> = PaginationOptions &
  StylesApiProps<PaginationPart> & {
    readonly total: number
    readonly value: number
    readonly onChange: (page: number) => M
    readonly startValue?: number
    readonly disabled?: boolean
    readonly formatLabel?: (input: { readonly page: number; readonly totalPages: number }) => string
    readonly getItemProps?: (page: number) => PaginationLink
    readonly getControlProps?: (control: PaginationControl) => PaginationLink
    readonly nextIcon?: Child
    readonly previousIcon?: Child
    readonly firstIcon?: Child
    readonly lastIcon?: Child
    readonly dotsIcon?: Child
  }

export type PaginationConfig = ComponentConfig<PaginationOptions, PaginationPart>

const sizes = stylex.create({
  xs: { [paginationVars.controlSize]: "22px", [paginationVars.fontSize]: fontSize.xs },
  sm: { [paginationVars.controlSize]: "26px", [paginationVars.fontSize]: fontSize.sm },
  md: { [paginationVars.controlSize]: "32px", [paginationVars.fontSize]: fontSize.md },
  lg: { [paginationVars.controlSize]: "38px", [paginationVars.fontSize]: fontSize.lg },
  xl: { [paginationVars.controlSize]: "44px", [paginationVars.fontSize]: fontSize.xl },
  "input-xs": { [paginationVars.controlSize]: "30px", [paginationVars.fontSize]: fontSize.xs },
  "input-sm": { [paginationVars.controlSize]: "36px", [paginationVars.fontSize]: fontSize.sm },
  "input-md": { [paginationVars.controlSize]: "42px", [paginationVars.fontSize]: fontSize.md },
  "input-lg": { [paginationVars.controlSize]: "50px", [paginationVars.fontSize]: fontSize.lg },
  "input-xl": { [paginationVars.controlSize]: "60px", [paginationVars.fontSize]: fontSize.xl }
})

const styles = stylex.create({
  root: {
    [paginationVars.radius]: radius.default,
    [paginationVars.activeBg]: accent.filled,
    [paginationVars.activeColor]: colors.white
  },
  responsive: { containerType: "inline-size" },
  group: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: paginationVars.gap },
  control: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    margin: 0,
    padding: 0,
    fontFamily: "inherit",
    textDecoration: "none",
    appearance: "none",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.defaultBorder,
    backgroundColor: colors.default,
    cursor: "pointer",
    color: colors.text,
    height: paginationVars.controlSize,
    minWidth: paginationVars.controlSize,
    fontSize: paginationVars.fontSize,
    lineHeight: 1,
    borderRadius: paginationVars.radius,
    WebkitTapHighlightColor: "transparent",
    outline: { default: "none", ":focus-visible": `2px solid ${accent.filled}` },
    outlineOffset: "2px"
  },
  hoverable: { backgroundColor: { default: colors.default, ":hover": colors.defaultHover } },
  withPadding: { padding: `calc(${paginationVars.controlSize} / 4)` },
  disabled: { cursor: "not-allowed", opacity: 0.4 },
  active: {
    backgroundColor: paginationVars.activeBg,
    borderColor: paginationVars.activeBg,
    color: paginationVars.activeColor
  },
  contrast: { [paginationVars.activeColor]: accent.contrast },
  icon: { width: `calc(${paginationVars.controlSize} / 1.8)`, height: `calc(${paginationVars.controlSize} / 1.8)` },
  rtl: { transform: { default: null, ":dir(rtl)": "rotate(180deg)" } },
  dots: {
    height: paginationVars.controlSize,
    minWidth: paginationVars.controlSize,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none"
  },
  items: {
    display: { default: "flex", "@container (width <= 400px)": "none" },
    gap: "inherit",
    alignItems: "center"
  },
  label: {
    display: { default: "none", "@container (width <= 400px)": "flex" },
    alignItems: "center",
    justifyContent: "center",
    height: paginationVars.controlSize,
    fontSize: paginationVars.fontSize,
    whiteSpace: "nowrap"
  }
})

const nextPath = "M8.781 8l-3.3-3.3.943-.943L10.667 8l-4.243 4.243-.943-.943 3.3-3.3z"

const previousPath = "M7.219 8l3.3 3.3-.943.943L5.333 8l4.243-4.243.943.943-3.3 3.3z"

const firstPath =
  "M6.85355 3.85355C7.04882 3.65829 7.04882 3.34171 6.85355 3.14645C6.65829 2.95118 6.34171 2.95118 6.14645 3.14645L2.14645 7.14645C1.95118 7.34171 1.95118 7.65829 2.14645 7.85355L6.14645 11.8536C6.34171 12.0488 6.65829 12.0488 6.85355 11.8536C7.04882 11.6583 7.04882 11.3417 6.85355 11.1464L3.20711 7.5L6.85355 3.85355ZM12.8536 3.85355C13.0488 3.65829 13.0488 3.34171 12.8536 3.14645C12.6583 2.95118 12.3417 2.95118 12.1464 3.14645L8.14645 7.14645C7.95118 7.34171 7.95118 7.65829 8.14645 7.85355L12.1464 11.8536C12.3417 12.0488 12.6583 12.0488 12.8536 11.8536C13.0488 11.6583 13.0488 11.3417 12.8536 11.1464L9.20711 7.5L12.8536 3.85355Z"

const lastPath =
  "M2.14645 11.1464C1.95118 11.3417 1.95118 11.6583 2.14645 11.8536C2.34171 12.0488 2.65829 12.0488 2.85355 11.8536L6.85355 7.85355C7.04882 7.65829 7.04882 7.34171 6.85355 7.14645L2.85355 3.14645C2.65829 2.95118 2.34171 2.95118 2.14645 3.14645C1.95118 3.34171 1.95118 3.65829 2.14645 3.85355L5.79289 7.5L2.14645 11.1464ZM8.14645 11.1464C7.95118 11.3417 7.95118 11.6583 8.14645 11.8536C8.34171 12.0488 8.65829 12.0488 8.85355 11.8536L12.8536 7.85355C13.0488 7.65829 13.0488 7.34171 12.8536 7.14645L8.85355 3.14645C8.65829 2.95118 8.34171 2.95118 8.14645 3.14645C7.95118 3.34171 7.95118 3.65829 8.14645 3.85355L11.7929 7.5L8.14645 11.1464Z"

const dotsPath =
  "M2 8c0-.733.6-1.333 1.333-1.333.734 0 1.334.6 1.334 1.333s-.6 1.333-1.334 1.333C2.6 9.333 2 8.733 2 8zm9.333 0c0-.733.6-1.333 1.334-1.333C13.4 6.667 14 7.267 14 8s-.6 1.333-1.333 1.333c-.734 0-1.334-.6-1.334-1.333zM6.667 8c0-.733.6-1.333 1.333-1.333s1.333.6 1.333 1.333S8.733 9.333 8 9.333 6.667 8.733 6.667 8z"

const icon = <M>(h: HtmlBuilder<M>, path: string, flips: boolean) =>
  h.svg(
    [
      ...sx(h, styles.icon, flips && styles.rtl),
      h.Attribute("viewBox", "0 0 16 16"),
      h.Attribute("fill", "none"),
      h.AriaHidden(true)
    ],
    [h.path([h.Attribute("d", path), h.Attribute("fill", "currentColor")], [])]
  )

type ControlSpec<M> = {
  readonly link: PaginationLink | undefined
  readonly label: string | undefined
  readonly disabled: boolean
  readonly active: boolean
  readonly withPadding: boolean
  readonly onClick: M
  readonly children: ReadonlyArray<Child>
}

const control = <M>(h: HtmlBuilder<M>, getStyles: GetStyles<M, PaginationPart>, spec: ControlSpec<M>): Html => {
  const href = spec.link?.href
  const label = spec.link?.label ?? spec.label
  const attributes = [
    ...getStyles(
      "control",
      styles.control,
      !spec.disabled && !spec.active && styles.hoverable,
      spec.withPadding && styles.withPadding,
      spec.active && styles.active,
      spec.disabled && styles.disabled
    ),
    ...(spec.active ? [h.DataAttribute("active", ""), h.AriaCurrent("page")] : []),
    ...(spec.disabled ? [h.DataAttribute("disabled", "")] : []),
    ...(spec.withPadding ? [h.DataAttribute("with-padding", "")] : []),
    ...(label === undefined ? [] : [h.AriaLabel(label)]),
    ...(spec.disabled ? [] : [h.OnClick(spec.onClick)])
  ]
  const children = spec.link?.children === undefined ? spec.children : [spec.link.children]

  return href === undefined
    ? h.button([...attributes, h.Type("button"), ...(spec.disabled ? [h.Disabled(true)] : [])], children)
    : h.a([...attributes, h.Href(href), ...(spec.disabled ? [h.AriaDisabled(true)] : [])], children)
}

export const Pagination =
  (config: { readonly Pagination?: PaginationConfig }) =>
  <M>(h: HtmlBuilder<M>, input: PaginationProps<M>): Html => {
    const props = withDefaults(config.Pagination, input)
    const getStyles = stylesApi<M, PaginationPart>(h, props, config.Pagination, "root")
    const bounds = { total: props.total, ...(props.startValue === undefined ? {} : { startValue: props.startValue }) }
    const start = firstPage(bounds)
    const end = lastPage(bounds)
    const active = clampPage(bounds, props.value)
    const disabled = props.disabled === true
    if (props.total <= 0) return h.empty
    if (props.hideWithOnePage === true && props.total === 1) return h.empty
    const go = (page: number) => props.onChange(clampPage(bounds, page))
    const edge = (
      name: PaginationControl,
      label: string,
      page: number,
      atEnd: boolean,
      custom: Child | undefined,
      path: string
    ) =>
      control(h, getStyles, {
        link: props.getControlProps?.(name),
        label,
        disabled: disabled || atEnd,
        active: false,
        withPadding: false,
        onClick: go(page),
        children: [custom ?? icon(h, path, true)]
      })
    const items = paginationRange({
      total: props.total,
      active,
      ...(props.startValue === undefined ? {} : { startValue: props.startValue }),
      ...(props.siblings === undefined ? {} : { siblings: props.siblings }),
      ...(props.boundaries === undefined ? {} : { boundaries: props.boundaries })
    }).map((item) =>
      item === "dots"
        ? h.div([...getStyles("dots", styles.dots)], [props.dotsIcon ?? icon(h, dotsPath, false)])
        : control(h, getStyles, {
            link: props.getItemProps?.(item),
            label: undefined,
            disabled,
            active: item === active,
            withPadding: true,
            onClick: go(item),
            children: [String(item)]
          })
    )
    const responsive = props.layout === "responsive"
    const label = (props.formatLabel ?? defaultLabel)({ page: active, totalPages: props.total })
    const pages =
      props.withPages === false
        ? []
        : responsive
          ? [h.div(getStyles("items", styles.items), items), h.div(getStyles("label", styles.label), [label])]
          : items

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          sizes[props.size ?? "md"],
          responsive && styles.responsive,
          ...accentStyle(props.color, customAccent),
          props.autoContrast === true && styles.contrast,
          setDefinedVars(
            [paginationVars.radius, mapDefined(props.radius, radiusValue)],
            [paginationVars.gap, mapDefined(props.gap, spacing)]
          )
        ),
        ...(props.layout === undefined ? [] : [h.DataAttribute("layout", props.layout)])
      ],
      [
        h.div(sx(h, styles.group), [
          ...(props.withEdges === true
            ? [edge("first", "First page", start, active === start, props.firstIcon, firstPath)]
            : []),
          ...(props.withControls === false
            ? []
            : [edge("previous", "Previous page", active - 1, active === start, props.previousIcon, previousPath)]),
          ...pages,
          ...(props.withControls === false
            ? []
            : [edge("next", "Next page", active + 1, active === end, props.nextIcon, nextPath)]),
          ...(props.withEdges === true
            ? [edge("last", "Last page", end, active === end, props.lastIcon, lastPath)]
            : [])
        ])
      ]
    )
  }

const defaultLabel = (input: { readonly page: number; readonly totalPages: number }) =>
  `Page ${input.page} of ${input.totalPages}`
