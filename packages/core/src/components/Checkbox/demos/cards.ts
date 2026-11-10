import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { CheckboxCardState } from "../CheckboxIndicator.ts"
import { palette } from "../../../theme/palette.stylex.ts"
import { accent, colors, fontSize, space } from "../../../theme/tokens.stylex.ts"
import type { Ui } from "../../../Ui.ts"

const styles = stylex.create({
  root: {
    position: "relative",
    paddingBlock: space.md,
    paddingInline: space.md,
    transitionProperty: "border-color",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease",
    backgroundColor: { default: "transparent", ":hover": `light-dark(${palette.gray0}, ${palette.dark6})` }
  },
  checked: { borderColor: accent.filled },
  label: { fontWeight: 600, fontSize: fontSize.sm, lineHeight: 1.3, color: colors.bright },
  description: { marginTop: "4px", color: colors.dimmed, fontSize: fontSize.xs }
})

export const cardStyles = (checked: boolean) => ({ card: [styles.root, checked && styles.checked] })

export const cardContent =
  <M>(h: HtmlBuilder<M>, ui: Ui, name: string, description: string) =>
  (state: CheckboxCardState): ReadonlyArray<Html> => [
    ui.Group(h, {
      wrap: "nowrap",
      align: "flex-start",
      children: [
        ui.CheckboxIndicator(h, { checked: state.checked }),
        h.div(
          [],
          [
            ui.Text(h, { styles: { root: [styles.label] }, children: [name] }),
            ui.Text(h, { styles: { root: [styles.description] }, children: [description] })
          ]
        )
      ]
    })
  ]
