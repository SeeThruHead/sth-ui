import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { fontSize, radius, space } from "../../theme/tokens.stylex.ts"
import { fieldsetVars } from "./Fieldset.stylex.ts"

export type FieldsetPart = "root" | "legend"

export type FieldsetVariant = "default" | "filled" | "unstyled"

export type FieldsetOptions = { readonly variant?: FieldsetVariant; readonly radius?: StyleValue }

export type FieldsetProps = FieldsetOptions &
  StylesApiProps<FieldsetPart> & {
    readonly legend?: Child
    readonly disabled?: boolean
    readonly name?: string
    readonly children: ReadonlyArray<Child>
  }

export type FieldsetConfig = ComponentConfig<FieldsetOptions, FieldsetPart>

const styles = stylex.create({
  root: {
    [fieldsetVars.radius]: radius.default,
    paddingInline: space.lg,
    paddingBottom: space.lg,
    paddingTop: space.xs,
    borderRadius: fieldsetVars.radius,
    minInlineSize: "auto",
    marginInline: 0,
    marginBlock: 0
  },
  default: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray3}, ${palette.dark4})`,
    backgroundColor: `light-dark(${palette.white}, ${palette.dark7})`
  },
  filled: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray3}, ${palette.dark4})`,
    backgroundColor: `light-dark(${palette.gray0}, ${palette.dark6})`
  },
  unstyled: { paddingInline: 0, paddingBottom: 0, paddingTop: 0, borderWidth: 0, borderRadius: 0 },
  legend: { fontSize: fontSize.sm },
  legendUnstyled: { paddingInline: 0, marginBottom: space.sm }
})

export const Fieldset =
  (config: { readonly Fieldset?: FieldsetConfig }) =>
  <M>(h: HtmlBuilder<M>, input: FieldsetProps): Html => {
    const props = withDefaults(config.Fieldset, input)
    const getStyles = stylesApi<M, FieldsetPart>(h, props, config.Fieldset, "root")
    const variant = props.variant ?? "default"

    return h.fieldset(
      [
        ...getStyles(
          "root",
          styles.root,
          styles[variant],
          setDefinedVars([fieldsetVars.radius, mapDefined(props.radius, radiusValue)])
        ),
        h.DataAttribute("variant", variant),
        ...(props.disabled === true ? [h.Disabled(true)] : []),
        ...(props.name === undefined ? [] : [h.Name(props.name)])
      ],
      [
        ...(props.legend === undefined
          ? []
          : [
              h.legend(getStyles("legend", styles.legend, variant === "unstyled" && styles.legendUnstyled), [
                props.legend
              ])
            ]),
        ...props.children
      ]
    )
  }
