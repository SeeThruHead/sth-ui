import * as stylex from "@stylexjs/stylex"
import { Option } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { shared } from "../../styles/shared.ts"
import { spacing } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, fontSize, space } from "../../theme/tokens.stylex.ts"
import { unstyledButtonStyles } from "../UnstyledButton/UnstyledButton.ts"
import { navLinkVars } from "./NavLink.stylex.ts"

export type NavLinkPart = "root" | "body" | "section" | "label" | "description" | "chevron" | "collapse" | "children"

export type NavLinkVariant = keyof typeof actives

export type NavLinkOptions = {
  readonly variant?: NavLinkVariant
  readonly color?: string
  readonly noWrap?: boolean
  readonly childrenOffset?: StyleValue
  readonly disableRightSectionRotation?: boolean
  readonly autoContrast?: boolean
  readonly keepMounted?: boolean
  readonly component?: "a" | "button"
}

export type NavLinkProps<M> = NavLinkOptions &
  StylesApiProps<NavLinkPart> & {
    readonly label?: Child
    readonly description?: Child
    readonly leftSection?: Child
    readonly rightSection?: Child
    readonly href?: string
    readonly active?: boolean
    readonly disabled?: boolean
    readonly opened?: boolean
    readonly onChange?: (opened: boolean) => M
    readonly onClick?: M
    readonly children?: ReadonlyArray<Child>
  }

export type NavLinkConfig = ComponentConfig<NavLinkOptions, NavLinkPart>

const styles = stylex.create({
  root: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    paddingBlock: "8px",
    paddingInline: space.sm,
    userSelect: "none",
    color: "inherit",
    backgroundColor: {
      default: "transparent",
      ":hover": `light-dark(${palette.gray0}, ${palette.dark6})`
    }
  },
  disabled: { opacity: 0.4, pointerEvents: "none" },
  section: { display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 150ms ease" },
  sectionLeft: { marginInlineEnd: space.sm },
  sectionRight: { marginInlineStart: space.sm },
  rotate: { transform: "rotate(90deg)" },
  label: { fontSize: fontSize.sm },
  body: { flexGrow: 1, flexShrink: 1, flexBasis: 0, overflow: "hidden", textOverflow: "ellipsis" },
  noWrap: { whiteSpace: "nowrap" },
  description: {
    display: "block",
    fontSize: fontSize.xs,
    color: colors.dimmed,
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  activeDescription: { opacity: 0.9, color: "inherit" },
  children: { paddingInlineStart: navLinkVars.offset },
  childrenRoot: { [navLinkVars.offset]: space.lg },
  chevron: { width: "1rem", height: "1rem", display: "block", transform: "rotate(-90deg)" },
  contrast: { color: accent.contrast }
})

const actives = stylex.create({
  light: {
    backgroundColor: { default: accent.light, ":hover": accent.lightHover },
    color: accent.lightColor
  },
  filled: {
    backgroundColor: { default: accent.filled, ":hover": accent.filledHover },
    color: colors.white
  },
  subtle: {
    backgroundColor: { default: "transparent", ":hover": accent.lightHover },
    color: accent.lightColor
  }
})

const chevronPath =
  "M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"

export const NavLink =
  (config: { readonly NavLink?: NavLinkConfig }) =>
  <M>(h: HtmlBuilder<M>, input: NavLinkProps<M>): Html => {
    const props = withDefaults(config.NavLink, input)
    const getStyles = stylesApi<M, NavLinkPart>(h, props, config.NavLink, "root")
    const children = props.children ?? []
    const nested = children.length > 0
    const opened = props.opened === true
    const active = props.active === true
    const disabled = props.disabled === true
    const variant = props.variant ?? "light"
    const component = props.component ?? (nested ? "button" : "a")
    const toggle = props.onChange === undefined ? Option.none<M>() : Option.some(props.onChange(!opened))
    const regionId = props.id === undefined ? undefined : `${props.id}-children`
    const chevron = h.svg(
      [
        ...getStyles("chevron", styles.chevron),
        h.Attribute("viewBox", "0 0 15 15"),
        h.Attribute("fill", "none"),
        h.AriaHidden(true)
      ],
      [
        h.path(
          [h.Attribute("d", chevronPath), h.Attribute("fill", "currentColor"), h.Attribute("fill-rule", "evenodd")],
          []
        )
      ]
    )
    const right = nested ? (props.rightSection ?? chevron) : props.rightSection
    const rotate = nested && opened && props.disableRightSectionRotation !== true
    const clickMessage = nested ? toggle : Option.fromNullishOr(props.onClick)
    const link = h[component](
      [
        ...getStyles(
          "root",
          unstyledButtonStyles.root,
          ...accentStyle(props.color, customAccent),
          styles.root,
          active && actives[variant],
          active && props.autoContrast === true && variant === "filled" && styles.contrast,
          disabled && styles.disabled,
          shared.focusRing
        ),
        ...(component === "button" ? [h.Type("button"), h.Disabled(disabled)] : []),
        ...(component === "a" && props.href !== undefined ? [h.Href(props.href)] : []),
        ...(active ? [h.DataAttribute("active", "")] : []),
        ...(disabled ? [h.DataAttribute("disabled", ""), h.AriaDisabled(true)] : []),
        ...(nested ? [h.AriaExpanded(opened)] : []),
        ...(nested && opened ? [h.DataAttribute("expanded", "")] : []),
        ...(nested && regionId !== undefined ? [h.AriaControls(regionId)] : []),
        ...Option.match(clickMessage, { onNone: () => [], onSome: (message) => [h.OnClick(message)] })
      ],
      [
        ...(props.leftSection === undefined
          ? []
          : [
              h.span(
                [...getStyles("section", styles.section, styles.sectionLeft), h.DataAttribute("position", "left")],
                [props.leftSection]
              )
            ]),
        h.span(
          [
            ...getStyles("body", styles.body, props.noWrap === true && styles.noWrap),
            ...(props.noWrap === true ? [h.DataAttribute("no-wrap", "")] : [])
          ],
          [
            h.span(getStyles("label", styles.label), props.label === undefined ? [] : [props.label]),
            h.span(
              [
                ...getStyles(
                  "description",
                  styles.description,
                  active && styles.activeDescription,
                  props.noWrap === true && styles.noWrap
                ),
                ...(active ? [h.DataAttribute("active", "")] : [])
              ],
              props.description === undefined ? [] : [props.description]
            )
          ]
        ),
        ...(right === undefined
          ? []
          : [
              h.span(
                [
                  ...getStyles("section", styles.section, styles.sectionRight, rotate && styles.rotate),
                  h.DataAttribute("position", "right"),
                  ...(rotate ? [h.DataAttribute("rotate", "")] : [])
                ],
                [right]
              )
            ])
      ]
    )
    if (!nested) return link
    const showChildren = opened || props.keepMounted !== false

    return h.div(
      [],
      [
        link,
        ...(showChildren
          ? [
              h.div(
                [
                  ...getStyles("collapse"),
                  ...(regionId === undefined ? [] : [h.Id(regionId)]),
                  ...(opened ? [] : [h.Attribute("hidden", "")])
                ],
                [
                  h.div(
                    getStyles(
                      "children",
                      styles.childrenRoot,
                      styles.children,
                      setDefinedVars([navLinkVars.offset, mapDefined(props.childrenOffset, spacing)])
                    ),
                    children
                  )
                ]
              )
            ]
          : [])
      ]
    )
  }
