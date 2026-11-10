import * as stylex from "@stylexjs/stylex"
import * as FoldkitMenu from "@foldkit/ui/menu"
import { Array as Arr, Duration, Effect, Option, Predicate, Queue, Schema, Stream } from "effect"
import * as Mount from "foldkit/mount"
import { childAttributes } from "foldkit/html"
import { defineView } from "foldkit/submodel"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue, shadowValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { listOf, mapDefined, setDefinedStyle, setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { themeColor } from "../../theme/accent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { colors, fontSize, fontWeight, radius, space } from "../../theme/tokens.stylex.ts"
import type { FloatingPlacement } from "../Floating/FloatingArrow.ts"
import type { RenderRoot } from "../Button/Button.ts"
import { CheckboxIcon } from "../Checkbox/Checkbox.ts"
import { arrowStyles, arrowVars } from "../Floating/FloatingArrow.ts"
import { Input } from "../Input/Input.ts"
import { CaretRightIcon } from "@sth-ui/icons/icons/CaretRightIcon.ts"
import { dropdownStyles, dropdownWidth } from "../Popover/Popover.ts"
import { RadioIcon } from "../Radio/Radio.ts"
import { popoverVars } from "../Popover/Popover.stylex.ts"
import { menuVars } from "./Menu.stylex.ts"

const bundle: FoldkitMenu.Bundle = FoldkitMenu.create()

export const { Message, OutMessage, buttonId } = FoldkitMenu

export const { open, close, selectItem } = bundle

export const Model = FoldkitMenu.Model

export type Model = FoldkitMenu.Model

export type Message = FoldkitMenu.Message

export type OutMessage = FoldkitMenu.OutMessage

export const init = (config: FoldkitMenu.InitConfig): Model =>
  FoldkitMenu.init({ isAnimated: true, isModal: false, ...config })

export type MenuPart =
  | "dropdown"
  | "arrow"
  | "search"
  | "item"
  | "itemLabel"
  | "itemSection"
  | "itemIndicator"
  | "label"
  | "divider"

export type MenuItem = {
  readonly value: string
  readonly label: Child
  readonly leftSection?: Child
  readonly rightSection?: Child
  readonly color?: string
  readonly disabled?: boolean
  readonly group?: string
  readonly searchText?: string
  readonly kind?: "checkbox" | "radio" | "submenu"
  readonly checked?: boolean
  readonly closeMenuOnClick?: boolean
}

export type MenuSelection = {
  readonly items?: ReadonlyArray<MenuItem>
  readonly closeOnItemClick?: boolean
  readonly search?: boolean
}

const closesOnClick = (item: MenuItem | undefined, closeOnItemClick: boolean): boolean => {
  if (item === undefined) return closeOnItemClick
  if (item.closeMenuOnClick !== undefined) return item.closeMenuOnClick

  return item.kind === undefined && closeOnItemClick
}

export type UpdateResult = ReturnType<typeof bundle.update>

const keptOpen = (model: Model, index: number, value: string): UpdateResult => ({
  model,
  outMessage: OutMessage.Selected({ value, index })
})

const ownsFocus = (selection: MenuSelection): boolean =>
  selection.search === true || selection.items?.some((item) => item.kind === "submenu") === true

const withoutItemsFocus = (result: UpdateResult, selection: MenuSelection): UpdateResult =>
  selection.search === true
    ? { ...result, commands: (result.commands ?? []).filter((command) => command.name !== "FocusItems") }
    : result

export const update = (model: Model, message: Message, selection: MenuSelection = {}): UpdateResult => {
  if (message._tag === "BlurredItems" && ownsFocus(selection)) return { model }
  if (message._tag !== "SelectedItem") return withoutItemsFocus(bundle.update(model, message), selection)
  const item = selection.items?.find((candidate) => candidate.value === message.item)
  if (closesOnClick(item, selection.closeOnItemClick ?? true)) return bundle.update(model, message)

  return keptOpen(model, message.index, message.item)
}

export type MenuTrigger = "click" | "hover" | "click-hover"

export type MenuSearch<M> = {
  readonly value: string
  readonly onChange: (value: string) => M
  readonly placeholder: string
}

const navigationKeys = ["ArrowDown", "ArrowUp", "Home", "End", "Enter", "Escape"]

const keep = (event: KeyboardEvent) => (navigationKeys.includes(event.key) ? undefined : event.stopPropagation())

const searchEvents = (field: HTMLInputElement): Stream.Stream<typeof Message.Closed.Type> => {
  return Stream.callback<typeof Message.Closed.Type>((queue) => {
    const tabbed = (event: KeyboardEvent) =>
      event.key === "Tab" ? Queue.offerUnsafe(queue, Message.Closed()) : undefined

    return Effect.acquireRelease(
      Effect.sync(() => {
        field.addEventListener("keydown", keep)
        field.addEventListener("keyup", keep)
        field.addEventListener("keydown", tabbed)
        field.focus()
      }),
      () =>
        Effect.sync(() => {
          field.removeEventListener("keydown", keep)
          field.removeEventListener("keyup", keep)
          field.removeEventListener("keydown", tabbed)
        })
    ).pipe(Effect.flatMap(() => Effect.never))
  })
}

const itemElementId = (id: string, index: number) => `${id}-item-${index}`

const listening = <A>(target: EventTarget, type: string, toMessage: (event: Event) => Option.Option<A>) =>
  Stream.callback<A>((queue) => {
    const listener = (event: Event) => Option.map(toMessage(event), (message) => Queue.offerUnsafe(queue, message))

    return Effect.acquireRelease(
      Effect.sync(() => target.addEventListener(type, listener)),
      () => Effect.sync(() => target.removeEventListener(type, listener))
    ).pipe(Effect.flatMap(() => Effect.never))
  })

const isKey = (event: Event, key: string): boolean => event instanceof KeyboardEvent && event.key === key

const opensSubmenu = (event: Event, parentId: string, index: number): boolean => {
  if (!isKey(event, "ArrowRight")) return false

  return document.getElementById(itemElementId(parentId, index))?.hasAttribute("data-active") === true
}

const closesSubmenu = (event: Event, subId: string): boolean =>
  isKey(event, "ArrowLeft") && isInside(event.target, [`${subId}-items`])

const returnFocus = (event: Event, subId: string, parentId: string): Option.Option<never> => {
  if (event.target !== document.getElementById(buttonId(subId))) return Option.none()
  Option.map(Option.fromNullishOr(document.getElementById(`${parentId}-items`)), (items) => items.focus())

  return Option.none()
}

const firstItem = () => Message.Opened({ maybeActiveItemIndex: Option.some(0) })

const SubmenuTrigger = Mount.defineStream("MenuSubmenuTrigger", {
  args: { parentId: Schema.String, subId: Schema.String, index: Schema.Finite },
  messages: [Message.Opened, Message.Closed],
  execute: ({ parentId, subId, index }) =>
    Stream.mergeAll(
      [
        hovering([itemElementId(parentId, index), `${subId}-items`]).pipe(
          Stream.changes,
          Stream.switchMap((hovered) =>
            Stream.fromEffect(
              Effect.sleep(Duration.millis(hovered ? 0 : 150)).pipe(
                Effect.as(hovered ? Message.Opened({ maybeActiveItemIndex: Option.none() }) : Message.Closed())
              )
            )
          )
        ),
        listening(document, "click", (event) =>
          Option.liftPredicate(firstItem(), () => isInside(event.target, [itemElementId(parentId, index)]))
        ),
        listening(document, "keydown", (event) =>
          Option.liftPredicate(firstItem(), () => opensSubmenu(event, parentId, index))
        ),
        listening(document, "keydown", (event) =>
          Option.liftPredicate(Message.Closed(), () => closesSubmenu(event, subId))
        ),
        listening(document, "focusin", (event) => returnFocus(event, subId, parentId))
      ],
      { concurrency: "unbounded" }
    )
})

const leftMenu = (event: Event, ids: ReadonlyArray<string>): boolean =>
  !(event instanceof FocusEvent) || !isInside(event.relatedTarget, ids)

const FocusGuard = Mount.defineStream("MenuFocusGuard", {
  args: { ids: Schema.Array(Schema.String) },
  messages: [Message.Closed],
  execute: ({ element, ids }) =>
    listening(element, "focusout", (event) => Option.liftPredicate(Message.Closed(), () => leftMenu(event, ids)))
})

const focusFieldFrom = (event: Event, field: HTMLInputElement, id: string): Option.Option<never> =>
  Option.flatMap(
    Option.liftPredicate(event.target, (target) => target === document.getElementById(`${id}-items`)),
    () => {
      field.focus()

      return Option.none()
    }
  )

const isField = (element: Element): element is HTMLInputElement => element instanceof HTMLInputElement

const SearchField = Mount.defineStream("MenuSearchField", {
  args: { id: Schema.String },
  messages: [Message.Closed],
  execute: ({ element, id }) =>
    Stream.fromIterable(Option.toArray(Option.liftPredicate(element, isField))).pipe(
      Stream.flatMap((field) =>
        Stream.merge(
          searchEvents(field),
          listening(document, "focusin", (event) => focusFieldFrom(event, field, id))
        )
      )
    )
})

const isInside = (target: EventTarget | null, ids: ReadonlyArray<string>): boolean =>
  target instanceof Node && ids.some((id) => document.getElementById(id)?.contains(target) === true)

const hovering = (ids: ReadonlyArray<string>): Stream.Stream<boolean> =>
  Stream.fromEventListener<PointerEvent>(document, "pointermove").pipe(
    Stream.map((event) => isInside(event.target, ids))
  )

const MenuHover = Mount.defineStream("MenuHover", {
  args: { id: Schema.String, openDelay: Schema.Finite, closeDelay: Schema.Finite },
  messages: [Message.Opened, Message.Closed],
  execute: ({ id, openDelay, closeDelay }) =>
    hovering([buttonId(id), `${id}-items`]).pipe(
      Stream.changes,
      Stream.switchMap((hovered) =>
        Stream.fromEffect(
          Effect.sleep(Duration.millis(hovered ? openDelay : closeDelay)).pipe(
            Effect.as(hovered ? Message.Opened({ maybeActiveItemIndex: Option.none() }) : Message.Closed())
          )
        )
      )
    )
})

type Point = { readonly clientX: number; readonly clientY: number }

const placeAt = (region: Element, id: string, event: Point) => {
  const box = region.getBoundingClientRect()
  const anchor = document.getElementById(buttonId(id))
  anchor?.style.setProperty("left", `${event.clientX - box.left}px`)
  anchor?.style.setProperty("top", `${event.clientY - box.top}px`)
}

const opened = () => Message.Opened({ maybeActiveItemIndex: Option.none() })

const rightClicks = (region: Element, id: string): Stream.Stream<typeof Message.Opened.Type> =>
  Stream.callback<typeof Message.Opened.Type>((queue) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const clicked = (event: Event) => {
          event.preventDefault()
          Option.map(Option.liftPredicate(event, isMouse), (mouse) => placeAt(region, id, mouse))
          Queue.offerUnsafe(queue, opened())
        }
        region.addEventListener("contextmenu", clicked)

        return () => region.removeEventListener("contextmenu", clicked)
      }),
      (stop) => Effect.sync(stop)
    ).pipe(Effect.flatMap(() => Effect.never))
  )

const isMouse = (event: Event): event is MouseEvent => event instanceof MouseEvent

const firstTouch = (event: TouchEvent): Option.Option<Point> => Option.fromNullishOr(event.touches[0])

const touches = (region: Element, type: string): Stream.Stream<TouchEvent> =>
  Stream.fromEventListener<TouchEvent>(region, type)

const longPresses = (region: Element, id: string, delay: number): Stream.Stream<typeof Message.Opened.Type> =>
  Stream.mergeAll(
    [
      touches(region, "touchstart").pipe(Stream.map(firstTouch)),
      ...["touchend", "touchcancel", "touchmove"].map((type) =>
        touches(region, type).pipe(Stream.map(() => Option.none<Point>()))
      )
    ],
    { concurrency: "unbounded" }
  ).pipe(
    Stream.switchMap((pressed) =>
      Stream.fromIterable(Option.toArray(pressed)).pipe(
        Stream.mapEffect((point) =>
          Effect.sleep(Duration.millis(delay)).pipe(
            Effect.map(() => {
              placeAt(region, id, point)

              return opened()
            })
          )
        )
      )
    )
  )

const ContextMenuTrigger = Mount.defineStream("MenuContextMenu", {
  args: { id: Schema.String, longPressDelay: Schema.Finite },
  messages: [Message.Opened],
  execute: ({ element, id, longPressDelay }) =>
    Stream.merge(rightClicks(element, id), longPresses(element, id, longPressDelay))
})

export type MenuOptions = {
  readonly trigger?: MenuTrigger
  readonly openDelay?: number
  readonly closeDelay?: number
  readonly position?: FloatingPlacement
  readonly offset?: number
  readonly width?: "target" | number | (string & {})
  readonly withinPortal?: boolean
  readonly zIndex?: number | string
  readonly radius?: StyleValue
  readonly shadow?: string
  readonly closeOnItemClick?: boolean
  readonly alignItemsLabels?: "all" | "with-indicators" | "none"
  readonly checkIcon?: Child
  readonly withArrow?: boolean
  readonly arrowSize?: number
  readonly arrowOffset?: number
  readonly arrowRadius?: number
  readonly arrowPosition?: "side" | "center"
}

type ViewInputs = Parameters<typeof bundle.view>[1]

type ItemAttributes = Readonly<Record<string, string>>

type Node = NonNullable<Html>

const selectableKind = (item: MenuItem): Option.Option<"checkbox" | "radio"> =>
  Option.filter(Option.fromNullishOr(item.kind), (kind) => kind !== "submenu")

const roleOf = (item: MenuItem): Option.Option<ItemAttributes> =>
  Option.map(selectableKind(item), (kind) => ({
    role: kind === "checkbox" ? "menuitemcheckbox" : "menuitemradio",
    "aria-checked": String(item.checked === true)
  }))

const withAttributes = (node: Node, attributes: ItemAttributes): Node => {
  const data = { ...node.data }

  return { ...node, data: { ...data, attrs: Object.assign({}, data.attrs, attributes) } }
}

const isNode = (child: Node | string): child is Node => !Predicate.isString(child)

type Rewrite = (node: Node) => Node

type Rewrites = ReadonlyMap<PropertyKey | undefined, Rewrite>

const rewrite = (node: Node, rewrites: Rewrites): Node => {
  const children = Option.getOrUndefined(
    Option.map(Option.fromNullishOr(node.children), (list) =>
      list.flatMap((child) => [
        ...[child].filter(Predicate.isString),
        ...[child].filter(isNode).map((inner) => rewrite(inner, rewrites))
      ])
    )
  )
  const own = { ...node, children }

  return Option.match(Option.fromNullishOr(rewrites.get(node.key)), {
    onNone: () => own,
    onSome: (change) => change(own)
  })
}

const surrounded =
  (before: ReadonlyArray<Node>, after: ReadonlyArray<Node>): Rewrite =>
  (node) => ({
    ...node,
    children: [...before, ...Option.toArray(Option.fromNullishOr(node.children)).flat(), ...after]
  })

const rewritesOf = (
  id: string,
  items: ReadonlyArray<MenuItem>,
  attributesOf: (item: MenuItem) => Option.Option<ItemAttributes>,
  before: ReadonlyArray<Node>,
  after: ReadonlyArray<Node>
): Rewrites =>
  new Map([
    ...items.flatMap((item, index) =>
      Option.toArray(
        Option.map(
          attributesOf(item),
          (attributes) => [itemElementId(id, index), (node: Node) => withAttributes(node, attributes)] as const
        )
      )
    ),
    [`${id}-items-container`, surrounded(before, after)] as const
  ])

const rewrittenView = defineView<Model, Message, ViewInputs & { readonly rewrites: Rewrites }>((model, inputs, h) =>
  Option.getOrNull(
    Option.map(Option.fromNullishOr(bundle.view(model, inputs, h)), (node) => rewrite(node, inputs.rewrites))
  )
)

export type MenuContextMenu = {
  readonly children: ReadonlyArray<Child>
  readonly disabled?: boolean
  readonly longPressDelay?: number
}

export type MenuTarget =
  | { readonly target: (renderRoot: RenderRoot) => Html; readonly contextMenu?: never }
  | { readonly contextMenu: MenuContextMenu; readonly target?: never }

export type MenuProps<M> = MenuOptions &
  StylesApiProps<MenuPart> &
  MenuTarget & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly items: ReadonlyArray<MenuItem>
    readonly labels?: { readonly [group: string]: Child }
    readonly disabled?: boolean
    readonly ariaLabel?: string
    readonly search?: MenuSearch<M>
    readonly submenus?: { readonly [value: string]: MenuSubmenu<M> }
  }

export type MenuSubmenu<M> = {
  readonly model: Model
  readonly toParentMessage: (message: Message) => M
  readonly items: ReadonlyArray<MenuItem>
  readonly labels?: { readonly [group: string]: Child }
  readonly width?: MenuOptions["width"]
}

export type MenuConfig = ComponentConfig<MenuOptions, MenuPart>

const styles = stylex.create({
  region: { position: "relative" },
  anchor: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    padding: 0,
    borderWidth: 0,
    overflow: "hidden",
    opacity: 0
  },
  contents: { display: "contents" },
  dropdown: { paddingBlock: "4px", paddingInline: "4px" },
  item: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    fontSize: fontSize.sm,
    paddingBlock: `calc(${space.xs} / 1.5)`,
    paddingInline: space.sm,
    borderRadius: radius.default,
    color: menuVars.itemColor,
    userSelect: "none",
    cursor: "default",
    backgroundColor: {
      default: "transparent",
      ":is([data-menu-active])": menuVars.itemHover
    }
  },
  itemRoot: {
    [menuVars.itemColor]: colors.text,
    [menuVars.itemHover]: `light-dark(${palette.gray1}, ${palette.dark4})`
  },
  disabled: { color: colors.disabledColor, opacity: 0.6, cursor: "not-allowed" },
  itemLabel: { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
  itemIndicator: {
    width: "12px",
    height: "12px",
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginInlineEnd: "8px"
  },
  checkIcon: { display: "flex", width: "10px" },
  searchWrapper: { marginInline: "-4px", marginTop: "-4px", marginBottom: "4px" },
  search: {
    borderTopWidth: 0,
    borderInlineWidth: 0,
    borderEndStartRadius: 0,
    borderEndEndRadius: 0,
    borderColor: `light-dark(${palette.gray2}, ${palette.dark4})`
  },
  radioIcon: { display: "flex", width: "5px" },
  submenuItem: { position: "relative" },
  submenuCorner: { position: "absolute", top: 0, insetInlineEnd: 0, width: 0, height: 0 },
  submenuAnchor: { display: "block", width: 0, height: 0, padding: 0, borderWidth: 0, overflow: "hidden", opacity: 0 },
  chevron: { display: "flex", width: "14px", height: "14px" },
  itemSection: { display: "flex", justifyContent: "center", alignItems: "center" },
  sectionLeft: { marginInlineEnd: space.xs },
  sectionRight: { marginInlineStart: space.xs },
  label: {
    color: colors.dimmed,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs,
    paddingBlock: `calc(${space.xs} / 2)`,
    paddingInline: space.sm,
    cursor: "default"
  },
  divider: {
    marginBlock: "4px",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: `light-dark(${palette.gray2}, ${palette.dark4})`
  }
})

const sideStyles = { left: styles.sectionLeft, right: styles.sectionRight }

const itemColor = (color: string) =>
  setVars(
    [menuVars.itemColor, themeColor(color)],
    [menuVars.itemHover, `color-mix(in srgb, ${themeColor(color)} 12%, transparent)`]
  )

export const Menu =
  (config: { readonly Menu?: MenuConfig }) =>
  <M>(h: HtmlBuilder<M>, input: MenuProps<M>): Html => {
    const props = withDefaults(config.Menu, input)
    const getStyles = stylesApi<M, MenuPart>(h, props, config.Menu, "dropdown")
    const position = props.position ?? "bottom"
    const items = props.items
    const withArrow = props.withArrow === true
    const arrowSize = props.arrowSize ?? 7
    const arrow = Option.filter(
      Option.fromNullishOr(
        h.div([...getStyles("arrow", arrowStyles.arrow, arrowStyles.bordered), h.AriaHidden(true)], [])
      ),
      () => withArrow
    )
    const itemAt = (index: number): MenuItem => Option.getOrThrow(Arr.get(items, index))
    const itemOf = (value: string): MenuItem => Option.getOrThrow(Arr.findFirst(items, (item) => item.value === value))
    const indexOf = (value: string): number => items.findIndex((item) => item.value === value)
    const section = (side: "left" | "right", content: Child | undefined): ReadonlyArray<Html> =>
      content === undefined
        ? []
        : [
            h.span(
              [...getStyles("itemSection", styles.itemSection, sideStyles[side]), h.DataAttribute("position", side)],
              [content]
            )
          ]
    const alignment = props.alignItemsLabels ?? "with-indicators"
    const submenus = props.submenus ?? {}
    const submenuOf = (item: MenuItem): Option.Option<MenuSubmenu<M>> =>
      Option.filter(Option.fromNullishOr(submenus[item.value]), () => item.kind === "submenu")
    const attributesOf = (item: MenuItem): Option.Option<ItemAttributes> =>
      Option.orElse(
        Option.map(submenuOf(item), (submenu) => ({
          "aria-haspopup": "menu",
          "aria-expanded": String(submenu.model.isOpen)
        })),
        () => roleOf(item)
      )
    const submenuParts = (item: MenuItem, index: number): ReadonlyArray<Child> =>
      Option.toArray(submenuOf(item)).flatMap((submenu) => [
        ...(item.rightSection === undefined
          ? section("right", h.span(sx(h, styles.chevron), [CaretRightIcon(h, { size: 14 })]))
          : []),
        h.span(sx(h, styles.submenuCorner), [
          Menu(config)(h, {
            model: submenu.model,
            toParentMessage: submenu.toParentMessage,
            items: submenu.items,
            position: "right-start",
            offset: 8,
            ...(submenu.labels === undefined ? {} : { labels: submenu.labels }),
            ...(submenu.width === undefined ? {} : { width: submenu.width }),
            target: (renderRoot) => renderRoot(childAttributes([...sx(h, styles.submenuAnchor), h.Tabindex(-1)]), [])
          })
        ]),
        h.span(
          [
            ...sx(h, styles.contents),
            h.OnMount(
              Mount.mapMessage(
                SubmenuTrigger({ parentId: props.model.id, subId: submenu.model.id, index }),
                submenu.toParentMessage
              )
            )
          ],
          []
        )
      ])
    const defaultIcon = (kind: "checkbox" | "radio"): Child =>
      kind === "checkbox"
        ? h.span(sx(h, styles.checkIcon), [CheckboxIcon(h, false)])
        : h.span(sx(h, styles.radioIcon), [RadioIcon(h)])
    const indicatorShown = (item: MenuItem): boolean =>
      Option.isNone(selectableKind(item)) ? alignment === "all" : alignment !== "none" || item.checked === true
    const indicator = (item: MenuItem): ReadonlyArray<Html> =>
      indicatorShown(item)
        ? [
            h.div(
              [
                ...getStyles("itemIndicator", styles.itemIndicator),
                ...(item.checked === true ? [h.DataAttribute("checked", "")] : [])
              ],
              Option.toArray(Option.filter(selectableKind(item), () => item.checked === true)).map(
                (kind) => props.checkIcon ?? defaultIcon(kind)
              )
            )
          ]
        : []
    const itemView = (item: MenuItem, index: number, active: boolean): Html =>
      h.div(
        [
          ...getStyles(
            "item",
            styles.itemRoot,
            item.color === undefined ? null : itemColor(item.color),
            styles.item,
            item.kind === "submenu" && styles.submenuItem,
            item.disabled === true && styles.disabled
          ),
          ...(active ? [h.DataAttribute("menu-active", "")] : []),
          ...(item.disabled === true ? [h.DataAttribute("disabled", "")] : [])
        ],
        [
          ...indicator(item),
          ...section("left", item.leftSection),
          h.div(getStyles("itemLabel", styles.itemLabel), [item.label]),
          ...section("right", item.rightSection),
          ...submenuParts(item, index)
        ]
      )
    const labels = props.labels ?? {}
    const grouped = items.some((item) => item.group !== undefined)
    const dropdownAttributes = childAttributes([
      ...getStyles(
        "dropdown",
        dropdownStyles.dropdown,
        styles.dropdown,
        stylex.defaultMarker(),
        setVars([popoverVars.zIndex, String(props.zIndex ?? 300)], [popoverVars.width, dropdownWidth(props.width)]),
        arrowVars({
          position,
          arrowSize,
          arrowOffset: props.arrowOffset ?? 5,
          arrowRadius: props.arrowRadius ?? 0,
          arrowPosition: props.arrowPosition ?? "side",
          centre: "self"
        }),
        setDefinedStyle(
          ["borderRadius", mapDefined(props.radius, radiusValue)],
          ["boxShadow", mapDefined(props.shadow, shadowValue)]
        )
      )
    ])
    const searchField = Option.toArray(
      Option.flatMap(Option.fromNullishOr(props.search), (search) =>
        Option.fromNullishOr(
          Input({})(h, {
            value: search.value,
            placeholder: search.placeholder,
            size: "sm",
            onInput: search.onChange,
            fieldBind: childAttributes([
              h.AriaLabel(search.placeholder),
              h.OnMount(Mount.mapMessage(SearchField({ id: props.model.id }), props.toParentMessage))
            ]),
            styles: { wrapper: [styles.searchWrapper], input: [styles.search, ...listOf(props.styles?.search)] }
          })
        )
      )
    )
    const submenuIds = items.flatMap((item) =>
      Option.toArray(submenuOf(item)).map((submenu) => `${submenu.model.id}-items`)
    )
    const focusGuard = Arr.isReadonlyArrayNonEmpty(submenuIds)
      ? childAttributes([
          h.OnMount(
            Mount.mapMessage(
              FocusGuard({ ids: [`${props.model.id}-items`, buttonId(props.model.id), ...submenuIds] }),
              props.toParentMessage
            )
          )
        ])
      : []
    const values = items.map((item) => item.value)
    const renderRoot: RenderRoot = (attributes, children) =>
      h.submodel({
        slotId: props.model.id,
        model: props.model,
        view: rewrittenView,
        toParentMessage: props.toParentMessage,
        viewInputs: {
          items: values,
          rewrites: rewritesOf(props.model.id, items, attributesOf, searchField, Option.toArray(arrow)),
          itemToConfig: (value, context) => ({
            content: itemView(itemOf(value), indexOf(value), context.isActive)
          }),
          isItemDisabled: (_value, index) => itemAt(index).disabled === true,
          itemToSearchText: (value, index) => itemAt(index).searchText ?? value,
          isButtonDisabled: props.disabled === true,
          buttonContent: h.span(sx(h, styles.contents), children),
          buttonAttributes: attributes,
          attributes: childAttributes([
            ...sx(h, styles.contents),
            ...((props.trigger ?? "click") === "click"
              ? []
              : [
                  h.OnMount(
                    Mount.mapMessage(
                      MenuHover({
                        id: props.model.id,
                        openDelay: props.openDelay ?? 0,
                        closeDelay: props.closeDelay ?? 100
                      }),
                      props.toParentMessage
                    )
                  )
                ])
          ]),
          itemsAttributes: [...dropdownAttributes, ...focusGuard],
          ...(grouped
            ? {
                itemGroupKey: (_value: string, index: number) => itemAt(index).group ?? "",
                groupToHeading: (key: string) =>
                  labels[key] === undefined
                    ? undefined
                    : { content: h.div(getStyles("label", styles.label), [labels[key]]) },
                separatorAttributes: childAttributes(getStyles("divider", styles.divider))
              }
            : {}),
          anchor: {
            placement: position,
            gap: (props.offset ?? 8) + (withArrow ? arrowSize / 2 : 0),
            portal: props.withinPortal ?? true
          },
          ...(props.ariaLabel === undefined ? {} : { ariaLabel: props.ariaLabel })
        }
      })

    if (props.contextMenu === undefined) return props.target(renderRoot)
    const contextMenu = props.contextMenu

    return h.div(
      [
        ...sx(h, styles.region),
        ...(contextMenu.disabled === true
          ? []
          : [
              h.OnMount(
                Mount.mapMessage(
                  ContextMenuTrigger({ id: props.model.id, longPressDelay: contextMenu.longPressDelay ?? 500 }),
                  props.toParentMessage
                )
              )
            ])
      ],
      [...contextMenu.children, renderRoot(childAttributes(sx(h, styles.anchor)), [])]
    )
  }
