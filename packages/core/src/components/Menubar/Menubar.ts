import * as stylex from "@stylexjs/stylex"
import { Array as Arr, Effect, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import * as Dom from "foldkit/dom"
import { childAttributes } from "foldkit/html"
import type { Html, HtmlBuilder } from "foldkit/html"
import { stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { colors, fontSize, radius, space } from "../../theme/tokens.stylex.ts"
import { Menu } from "../Menu/Menu.ts"
import type { MenuConfig, MenuItem, MenuOptions } from "../Menu/Menu.ts"
import { gotMenu, Message } from "./model.ts"
import type { MenubarContext, Model } from "./model.ts"

export { init, Message, Model, OutMessage, update } from "./model.ts"
export type { MenubarContext, Result } from "./model.ts"

export type MenubarPart = "root" | "target"

export type MenubarMenu = {
  readonly label: string
  readonly items: ReadonlyArray<MenuItem>
  readonly labels?: { readonly [group: string]: Html | string }
  readonly disabled?: boolean
}

export type MenubarOptions = {
  readonly loop?: boolean
  readonly trigger?: "click" | "hover"
  readonly dir?: "ltr" | "rtl"
}

export type MenubarProps<M> = MenubarOptions &
  StylesApiProps<MenubarPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly menus: ReadonlyArray<MenubarMenu>
    readonly menuProps?: MenuOptions
  }

export type MenubarConfig = ComponentConfig<MenubarOptions, MenubarPart>

const styles = stylex.create({
  root: { display: "flex", alignItems: "center" },
  target: {
    appearance: "none",
    borderWidth: 0,
    font: "inherit",
    fontSize: fontSize.sm,
    lineHeight: 1,
    paddingBlock: `calc(${space.xs} / 1.5)`,
    paddingInline: space.sm,
    borderRadius: radius.default,
    color: colors.text,
    backgroundColor: {
      default: "transparent",
      ":hover": `light-dark(${palette.gray1}, ${palette.dark5})`,
      ":focus-visible": `light-dark(${palette.gray1}, ${palette.dark5})`
    },
    userSelect: "none",
    cursor: "pointer"
  },
  expanded: { backgroundColor: `light-dark(${palette.gray1}, ${palette.dark5})` },
  disabled: {
    color: colors.disabledColor,
    opacity: 0.6,
    cursor: "not-allowed",
    backgroundColor: { default: "transparent", ":hover": "transparent", ":focus-visible": "transparent" }
  }
})

const FocusTarget = Command.define("MenubarFocusTarget", {
  args: { selector: Schema.String },
  messages: [Message.CompletedFocus],
  execute: ({ selector }) => Dom.focus(selector).pipe(Effect.ignore, Effect.as(Message.CompletedFocus()))
})

const isEnabled = (item: MenuItem): boolean => item.disabled !== true

export const menubarContext = (
  props: MenubarOptions & { readonly menus: ReadonlyArray<MenubarMenu> }
): MenubarContext => ({
  entries: props.menus.map((menu) => ({
    label: menu.label,
    first: Math.max(0, menu.items.findIndex(isEnabled)),
    last: Math.max(0, menu.items.findLastIndex(isEnabled)),
    disabled: menu.disabled === true
  })),
  focusTarget: (selector) => FocusTarget({ selector }),
  ...(props.loop === undefined ? {} : { loop: props.loop }),
  ...(props.trigger === undefined ? {} : { trigger: props.trigger }),
  ...(props.dir === undefined ? {} : { dir: props.dir })
})

const handledKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Enter", " "]

const isHandled = (key: string): boolean => handledKeys.includes(key) || key.length === 1

export const Menubar =
  (config: { readonly Menubar?: MenubarConfig; readonly Menu?: MenuConfig }) =>
  <M>(h: HtmlBuilder<M>, input: MenubarProps<M>): Html => {
    const props = withDefaults(config.Menubar, input)
    const getStyles = stylesApi<M, MenubarPart>(h, props, config.Menubar, "root")
    const menuView = (menu: MenubarMenu, index: number): Html => {
      const model = Option.getOrThrow(Arr.get(props.model.menus, index))
      const disabled = menu.disabled === true
      const toParent = (message: Message) => props.toParentMessage(message)

      return Menu(config)(h, {
        ...props.menuProps,
        model,
        toParentMessage: (message) => toParent(gotMenu(index)(message)),
        items: menu.items,
        disabled,
        ...(menu.labels === undefined ? {} : { labels: menu.labels }),
        target: (renderRoot) =>
          renderRoot(
            childAttributes([
              ...getStyles("target", styles.target, model.isOpen && styles.expanded, disabled && styles.disabled),
              h.Role("menuitem"),
              h.Tabindex(index === props.model.focused ? 0 : -1),
              ...(disabled
                ? [h.Disabled(true)]
                : [
                    h.OnKeyDownPreventDefault((key) =>
                      Option.map(Option.liftPredicate(key, isHandled), () =>
                        toParent(Message.PressedKey({ index, key }))
                      )
                    ),
                    h.OnMouseEnter(toParent(Message.Hovered({ index }))),
                    h.OnFocus(toParent(Message.Focused({ index })))
                  ])
            ]),
            [h.span([], [menu.label])]
          )
      })
    }

    return h.div(
      [
        ...getStyles("root", styles.root),
        h.Role("menubar"),
        h.AriaOrientation("horizontal"),
        h.Dir(props.dir ?? "ltr")
      ],
      props.menus.map(menuView)
    )
  }
