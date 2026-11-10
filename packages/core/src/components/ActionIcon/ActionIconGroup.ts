import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { buttonVars } from "../Button/Button.stylex.ts"
import { ButtonGroupSection, positionOf } from "../Button/ButtonGroup.ts"
import type { ButtonGroupSectionConfig, ButtonGroupSectionProps } from "../Button/ButtonGroup.ts"
import type { ButtonConfig, GroupOrientation } from "../Button/Button.ts"
import type { LoaderConfig } from "../Loader/Loader.ts"
import { ActionIcon } from "./ActionIcon.ts"
import type { ActionIconConfig, ActionIconProps } from "./ActionIcon.ts"
import { sizeValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"

export type ActionIconSectionSize = keyof typeof sectionSizes

export type ActionIconGroupSectionProps = Omit<ButtonGroupSectionProps, "size"> & {
  readonly size?: ActionIconSectionSize
}

export type ActionIconGroupItem<M> =
  | { readonly _tag: "ActionIcon"; readonly props: ActionIconProps<M> }
  | { readonly _tag: "Section"; readonly props: ActionIconGroupSectionProps }

export const groupActionIcon = <M>(props: ActionIconProps<M>): ActionIconGroupItem<M> => ({ _tag: "ActionIcon", props })

export const groupActionIconSection = <M>(props: ActionIconGroupSectionProps): ActionIconGroupItem<M> => ({
  _tag: "Section",
  props
})

export type ActionIconGroupOptions = {
  readonly orientation?: GroupOrientation
  readonly borderWidth?: number | string
}

export type ActionIconGroupProps<M> = ActionIconGroupOptions &
  StylesApiProps<"group"> & { readonly children: ReadonlyArray<ActionIconGroupItem<M>> }

export type ActionIconGroupConfig = ComponentConfig<ActionIconGroupOptions, "group">

const styles = stylex.create({
  group: { display: "flex", flexDirection: "row" },
  vertical: { flexDirection: "column" }
})

const sectionSizes = stylex.create({
  xs: { [buttonVars.height]: "18px", [buttonVars.paddingX]: "6px" },
  sm: { [buttonVars.height]: "22px", [buttonVars.paddingX]: "8px" },
  md: { [buttonVars.height]: "28px", [buttonVars.paddingX]: "10px" },
  lg: { [buttonVars.height]: "34px", [buttonVars.paddingX]: "12px" },
  xl: { [buttonVars.height]: "44px", [buttonVars.paddingX]: "16px" },
  "input-xs": { [buttonVars.height]: "30px", [buttonVars.paddingX]: "6px" },
  "input-sm": { [buttonVars.height]: "36px", [buttonVars.paddingX]: "8px" },
  "input-md": { [buttonVars.height]: "42px", [buttonVars.paddingX]: "10px" },
  "input-lg": { [buttonVars.height]: "50px", [buttonVars.paddingX]: "12px" },
  "input-xl": { [buttonVars.height]: "60px", [buttonVars.paddingX]: "16px" }
})

export const ActionIconGroup = (config: {
  readonly ActionIconGroup?: ActionIconGroupConfig
  readonly ActionIcon?: ActionIconConfig
  readonly ButtonGroupSection?: ButtonGroupSectionConfig
  readonly Button?: ButtonConfig
  readonly Loader?: LoaderConfig
}) => {
  const actionIcon = ActionIcon(config)
  const section = ButtonGroupSection(config)

  return <M>(h: HtmlBuilder<M>, input: ActionIconGroupProps<M>): Html => {
    const props = withDefaults(config.ActionIconGroup, input)
    const getStyles = stylesApi<M, "group">(h, props, config.ActionIconGroup, "group")
    const orientation = props.orientation ?? "horizontal"
    const count = props.children.length
    const item = (child: ActionIconGroupItem<M>, index: number): Html => {
      const placed = { groupPosition: positionOf(index, count), groupOrientation: orientation }
      if (child._tag === "ActionIcon") return actionIcon(h, { ...child.props, ...placed })
      const { size, ...rest } = child.props

      return section(h, {
        ...rest,
        ...placed,
        styles: { groupSection: size === undefined ? sectionSizes.sm : sectionSizes[size] }
      })
    }

    return h.div(
      [
        ...getStyles(
          "group",
          styles.group,
          orientation === "vertical" && styles.vertical,
          setDefinedVars([buttonVars.groupBorderWidth, mapDefined(props.borderWidth, sizeValue)])
        ),
        h.Role("group"),
        h.DataAttribute("orientation", orientation)
      ],
      props.children.map(item)
    )
  }
}
