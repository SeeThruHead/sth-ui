import * as stylex from "@stylexjs/stylex"
import { Effect, Function, Option, Predicate, Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { radiusValue, spacing } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { gradientStyle } from "../../theme/gradient.ts"
import type { Gradient } from "../../theme/gradient.ts"
import { staticVariants } from "../../theme/staticVariants.ts"
import type { StaticVariant } from "../../theme/staticVariants.ts"
import { accent, colors, fontWeight } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import type { BoxElement } from "../Box/Box.ts"
import { avatarGroupVars, avatarVars } from "./Avatar.stylex.ts"
import { getInitials, getInitialsColor } from "./initials.ts"

export { getInitials, getInitialsColor } from "./initials.ts"

export type AvatarPart = "root" | "image" | "placeholder"

export type AvatarGroupPart = "group"

export type AvatarVariant = StaticVariant

export type AvatarSize = keyof typeof sizes

export type AvatarOptions = {
  readonly size?: AvatarSize | number | (string & {})
  readonly radius?: StyleValue
  readonly color?: string
  readonly variant?: AvatarVariant
  readonly gradient?: Gradient
  readonly autoContrast?: boolean
  readonly allowedInitialsColors?: ReadonlyArray<string>
  readonly component?: BoxElement
}

export type AvatarProps = AvatarOptions &
  StylesApiProps<AvatarPart> & {
    readonly src?: string
    readonly alt?: string
    readonly name?: string
    readonly withinGroup?: boolean
    readonly children?: ReadonlyArray<Child>
  }

export type AvatarConfig = ComponentConfig<AvatarOptions, AvatarPart>

export type AvatarGroupOptions = { readonly spacing?: StyleValue }

export type AvatarGroupProps = AvatarGroupOptions &
  StylesApiProps<AvatarGroupPart> & { readonly children: ReadonlyArray<AvatarProps> }

export type AvatarGroupConfig = ComponentConfig<AvatarGroupOptions, AvatarGroupPart>

const styles = stylex.create({
  root: {
    [avatarVars.size]: "38px",
    [avatarVars.radius]: "1000px",
    WebkitTapHighlightColor: "transparent",
    position: "relative",
    display: "block",
    userSelect: "none",
    overflow: "hidden",
    borderRadius: avatarVars.radius,
    textDecoration: "none",
    padding: 0,
    width: avatarVars.size,
    height: avatarVars.size,
    minWidth: avatarVars.size
  },
  withinGroup: {
    marginInlineStart: `calc(${avatarGroupVars.spacing} * -1)`,
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: colors.body,
    backgroundColor: colors.body
  },
  image: { objectFit: "cover", width: "100%", height: "100%", display: { default: "block", ":is([hidden])": "none" } },
  placeholder: {
    fontWeight: fontWeight.bold,
    display: { default: "flex", ":is([hidden])": "none" },
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    userSelect: "none",
    borderRadius: avatarVars.radius,
    fontSize: `calc(${avatarVars.size} / 2.5)`,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent"
  },
  contrast: { color: accent.contrast },
  icon: { width: "70%", height: "70%" },
  group: { [avatarGroupVars.spacing]: "0.75rem", display: "flex", paddingInlineStart: avatarGroupVars.spacing }
})

const sizes = stylex.create({
  xs: { [avatarVars.size]: "16px" },
  sm: { [avatarVars.size]: "26px" },
  md: { [avatarVars.size]: "38px" },
  lg: { [avatarVars.size]: "56px" },
  xl: { [avatarVars.size]: "84px" }
})

const isAvatarSize = (size: string): size is AvatarSize => Object.hasOwn(sizes, size)

const sizeStyle = (size: AvatarOptions["size"]) => {
  if (size === undefined) return null
  if (Predicate.isNumber(size)) return setVars([avatarVars.size, rem(size)])

  return isAvatarSize(size) ? sizes[size] : setVars([avatarVars.size, size])
}

const colorOf = (props: AvatarProps): string => {
  if (props.color === "initials" && props.name !== undefined) {
    return getInitialsColor(props.name, props.allowedInitialsColors)
  }

  return props.color ?? "gray"
}

const placeholderPath =
  "M0.877014 7.49988C0.877014 3.84219 3.84216 0.877045 7.49985 0.877045C11.1575 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1575 14.1227 7.49985 14.1227C3.84216 14.1227 0.877014 11.1575 0.877014 7.49988ZM7.49985 1.82704C4.36683 1.82704 1.82701 4.36686 1.82701 7.49988C1.82701 8.97196 2.38774 10.3131 3.30727 11.3213C4.19074 9.94119 5.73818 9.02499 7.50023 9.02499C9.26206 9.02499 10.8093 9.94097 11.6929 11.3208C12.6121 10.3127 13.1727 8.97172 13.1727 7.49988C13.1727 4.36686 10.6328 1.82704 7.49985 1.82704ZM10.9818 11.9787C10.2839 10.7795 8.9857 9.97499 7.50023 9.97499C6.01458 9.97499 4.71624 10.7797 4.01845 11.9791C4.97952 12.7272 6.18765 13.1727 7.49985 13.1727C8.81227 13.1727 10.0206 12.727 10.9818 11.9787ZM5.14999 6.50487C5.14999 5.207 6.20212 4.15487 7.49999 4.15487C8.79786 4.15487 9.84999 5.207 9.84999 6.50487C9.84999 7.80274 8.79786 8.85487 7.49999 8.85487C6.20212 8.85487 5.14999 7.80274 5.14999 6.50487ZM7.49999 5.10487C6.72679 5.10487 6.09999 5.73167 6.09999 6.50487C6.09999 7.27807 6.72679 7.90487 7.49999 7.90487C8.27319 7.90487 8.89999 7.27807 8.89999 6.50487C8.89999 5.73167 8.27319 5.10487 7.49999 5.10487Z"

const placeholderIcon = <M>(h: HtmlBuilder<M>): Html =>
  h.svg(
    [
      ...sx(h, styles.icon),
      h.Attribute("viewBox", "0 0 15 15"),
      h.Attribute("fill", "none"),
      h.DataAttribute("avatar-placeholder-icon", ""),
      h.AriaHidden(true)
    ],
    [
      h.path(
        [
          h.Attribute("d", placeholderPath),
          h.Attribute("fill", "currentColor"),
          h.Attribute("fill-rule", "evenodd"),
          h.Attribute("clip-rule", "evenodd")
        ],
        []
      )
    ]
  )

const placeholderContent = <M>(h: HtmlBuilder<M>, props: AvatarProps): ReadonlyArray<Child> => {
  if (props.children !== undefined && props.children.length > 0) return props.children
  if (props.name !== undefined) return [getInitials(props.name)]

  return [placeholderIcon(h)]
}

const sourceAttribute = "data-src"

const placeholderOf = (image: Element): Option.Option<Element> => Option.fromNullishOr(image.nextElementSibling)

const showPlaceholder = (image: Element): void => {
  image.setAttribute("hidden", "")
  Option.map(placeholderOf(image), (placeholder) => placeholder.removeAttribute("hidden"))
}

const load = (image: Element): void => {
  image.removeAttribute("hidden")
  Option.map(placeholderOf(image), (placeholder) => placeholder.setAttribute("hidden", ""))
  Option.map(Option.fromNullishOr(image.getAttribute(sourceAttribute)), (source) => image.setAttribute("src", source))
}

const LoadAvatar = Mount.defineStream("LoadAvatar", {
  messages: [Schema.Never],
  execute: ({ element }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const failed = (): void => showPlaceholder(element)
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

export const Avatar =
  (config: { readonly Avatar?: AvatarConfig }) =>
  <M>(h: HtmlBuilder<M>, input: AvatarProps): Html => {
    const props = withDefaults(config.Avatar, input)
    const getStyles = stylesApi<M, AvatarPart>(h, props, config.Avatar, "root")
    const variant = props.variant ?? "light"
    const source = props.src === "" ? undefined : props.src
    const placeholder = h.span(
      [
        ...getStyles(
          "placeholder",
          styles.placeholder,
          staticVariants[variant],
          props.autoContrast === true && variant === "filled" && styles.contrast
        ),
        h.DataAttribute("avatar-placeholder", ""),
        ...(props.alt === undefined ? [] : [h.Title(props.alt)]),
        ...(source === undefined ? [] : [h.Attribute("hidden", "")])
      ],
      placeholderContent(h, props)
    )
    const image =
      source === undefined
        ? []
        : [
            h.img([
              ...getStyles("image", styles.image),
              h.Attribute(sourceAttribute, source),
              ...(props.alt === undefined ? [] : [h.Alt(props.alt)]),
              h.OnMount(Mount.mapMessage(LoadAvatar(), Function.absurd<M>))
            ])
          ]

    return h[props.component ?? "div"](
      [
        ...getStyles(
          "root",
          ...accentStyle(colorOf(props), customAccent),
          styles.root,
          sizeStyle(props.size),
          setDefinedVars([avatarVars.radius, mapDefined(props.radius, radiusValue)]),
          gradientStyle(props.gradient),
          props.withinGroup === true && styles.withinGroup
        ),
        ...(props.withinGroup === true ? [h.DataAttribute("within-group", "")] : [])
      ],
      [...image, placeholder]
    )
  }

export const AvatarGroup = (config: { readonly Avatar?: AvatarConfig; readonly AvatarGroup?: AvatarGroupConfig }) => {
  const avatar = Avatar(config)

  return <M>(h: HtmlBuilder<M>, input: AvatarGroupProps): Html => {
    const props = withDefaults(config.AvatarGroup, input)
    const getStyles = stylesApi<M, AvatarGroupPart>(h, props, config.AvatarGroup, "group")

    return h.div(
      getStyles("group", styles.group, setDefinedVars([avatarGroupVars.spacing, mapDefined(props.spacing, spacing)])),
      props.children.map((child) => avatar(h, { ...child, withinGroup: true }))
    )
  }
}
