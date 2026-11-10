import * as stylex from "@stylexjs/stylex"
import { Function, Option } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { defaultTagsToIgnore } from "../../hooks/hotkey.ts"
import { listOf, mergeStyles, setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, fontSize, fontWeight, radius, space } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import type { CloseButtonConfig } from "../CloseButton/CloseButton.ts"
import { Highlight } from "../Highlight/Highlight.ts"
import type { HighlightConfig } from "../Highlight/Highlight.ts"
import { Input } from "../Input/Input.ts"
import type { InputConfig, InputSize } from "../Input/Input.ts"
import { Modal } from "../Modal/Modal.ts"
import type { ModalConfig, ModalOptions } from "../Modal/Modal.ts"
import type { OverlayConfig } from "../Overlay/Overlay.ts"
import type { PortalConfig } from "../Portal/Portal.ts"
import type { TextConfig } from "../Text/Text.ts"
import { isActionsGroup, shownActions } from "./filter.ts"
import type { SpotlightActionData, SpotlightActions } from "./filter.ts"
import { WatchShortcut } from "./hotkey.ts"
import { actionId, gotModal, listId, Message, searchId } from "./model.ts"
import type { Model, SpotlightContext } from "./model.ts"
import { KeepFocus } from "./reveal.ts"
import { spotlightVars } from "./Spotlight.stylex.ts"

export type SpotlightPart =
  | "search"
  | "actionsList"
  | "action"
  | "actionBody"
  | "actionLabel"
  | "actionDescription"
  | "actionSection"
  | "actionsGroup"
  | "empty"
  | "footer"

export type SpotlightOptions = Omit<ModalOptions, "withCloseButton"> & {
  readonly highlightQuery?: boolean
  readonly scrollable?: boolean
  readonly maxHeight?: number | string
  readonly shortcut?: string | ReadonlyArray<string> | null
  readonly tagsToIgnore?: ReadonlyArray<string>
  readonly triggerOnContentEditable?: boolean
  readonly disabled?: boolean
}

export type SpotlightSearchProps = {
  readonly placeholder?: string
  readonly leftSection?: Child
  readonly rightSection?: Child
  readonly size?: InputSize
}

export type SpotlightProps<M> = SpotlightOptions &
  SpotlightContext &
  StylesApiProps<SpotlightPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly searchProps?: SpotlightSearchProps
    readonly nothingFound?: Child
    readonly footer?: Child
  }

export type SpotlightConfig = ComponentConfig<SpotlightOptions, SpotlightPart>

const styles = stylex.create({
  shortcut: { display: "contents" },
  content: { overflow: "hidden", maxHeight: spotlightVars.maxHeight },
  scrollableContent: { height: "100%" },
  body: { display: "flex", flexDirection: "column" },
  scrollableBody: { height: "100%" },
  search: { borderWidth: 0, backgroundColor: "transparent" },
  actionsList: {
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: `light-dark(${palette.gray2}, ${palette.dark4})`,
    flexGrow: 1,
    padding: "4px",
    maxHeight: "calc(100vh - 15rem)",
    overflowY: "auto",
    width: "100%"
  },
  action: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    paddingBlock: "7px",
    paddingInline: space.md,
    borderWidth: 0,
    borderRadius: radius.default,
    backgroundColor: {
      default: "transparent",
      ":hover": `light-dark(${palette.gray0}, ${palette.dark6})`
    },
    color: "inherit",
    font: "inherit",
    textAlign: "start",
    cursor: "pointer"
  },
  selected: {
    backgroundColor: { default: accent.filled, ":hover": accent.filled },
    color: palette.white
  },
  actionBody: { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
  actionSection: { opacity: 1, color: "inherit" },
  dimmed: { color: colors.dimmed },
  dimmedSelected: { opacity: 0.7, color: palette.white },
  left: { marginInlineEnd: space.md },
  right: { marginInlineStart: space.md },
  actionLabel: { display: "block" },
  actionDescription: { display: "block", fontSize: fontSize.xs, color: colors.dimmed },
  descriptionSelected: { opacity: 0.7, color: palette.white },
  empty: { color: colors.dimmed, padding: space.md, textAlign: "center" },
  footer: {
    paddingBlock: space.xs,
    paddingInline: `calc(${space.md} + 0.25rem)`,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: `light-dark(${palette.gray2}, ${palette.dark4})`
  },
  actionsGroup: {
    display: { default: "flex", ":empty": "none" },
    flexDirection: "column",
    marginTop: space.md,
    "::before": {
      content: spotlightVars.label,
      textTransform: "uppercase",
      fontSize: fontSize.xs,
      fontWeight: fontWeight.bold,
      color: colors.dimmed,
      paddingInlineStart: space.md
    }
  }
})

const quoted = (label: string) => `'${label.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`

const shortcutsOf = (shortcut: SpotlightOptions["shortcut"]): ReadonlyArray<string> => {
  if (shortcut === null) return []
  if (shortcut === undefined) return ["mod + K"]

  return typeof shortcut === "string" ? [shortcut] : shortcut
}

const keyMessage = (key: string) => {
  if (key === "ArrowDown") return [Message.SelectedNext()]
  if (key === "ArrowUp") return [Message.SelectedPrevious()]

  return key === "Enter" ? [Message.TriggeredSelected()] : []
}

export const Spotlight = (config: {
  readonly Spotlight?: SpotlightConfig
  readonly Modal?: ModalConfig
  readonly Input?: InputConfig
  readonly Highlight?: HighlightConfig
  readonly Text?: TextConfig
  readonly CloseButton?: CloseButtonConfig
  readonly Overlay?: OverlayConfig
  readonly Portal?: PortalConfig
}) => {
  const modal = Modal(config)
  const input = Input(config)
  const highlight = Highlight(config)

  return <M>(h: HtmlBuilder<M>, inputProps: SpotlightProps<M>): Html => {
    const props = withDefaults(config.Spotlight, inputProps)
    const getStyles = stylesApi<M, SpotlightPart>(h, props, config.Spotlight, "search")
    const parts = mergeStyles(["search"], config.Spotlight?.styles, props.styles)
    const send = props.toParentMessage
    const model = props.model
    const items = shownActions(model.query, props)
    const ordered = items.flatMap((item) => (isActionsGroup(item) ? item.actions : [item]))
    const indexOf = (action: SpotlightActionData) => ordered.indexOf(action)
    const scrollable = props.scrollable === true

    const label = (action: SpotlightActionData): Child => {
      const text = action.label ?? ""
      if (props.highlightQuery !== true) return h.span(getStyles("actionLabel", styles.actionLabel), [text])

      return highlight(h, {
        component: "span",
        highlight: model.query,
        children: text,
        ...(action.highlightColor === undefined ? {} : { color: action.highlightColor }),
        styles: { root: [styles.actionLabel] }
      })
    }

    const section = (
      child: Child | undefined,
      side: "left" | "right",
      dimmed: boolean,
      selected: boolean
    ): ReadonlyArray<Child> =>
      child === undefined
        ? []
        : [
            h.span(
              [
                ...getStyles(
                  "actionSection",
                  styles.actionSection,
                  side === "left" ? styles.left : styles.right,
                  dimmed && styles.dimmed,
                  dimmed && selected && styles.dimmedSelected
                ),
                h.DataAttribute("position", side),
                ...(dimmed ? [h.DataAttribute("dimmed", "")] : [])
              ],
              [child]
            )
          ]

    const action = (data: SpotlightActionData): Html => {
      const index = indexOf(data)
      const selected = index === model.selected
      const dimmed = data.dimmedSections ?? true

      return h.keyed("button")(
        data.id,
        [
          ...getStyles("action", styles.action, selected && styles.selected),
          h.Id(actionId(model, index)),
          h.Type("button"),
          h.Tabindex(-1),
          h.DataAttribute("action", ""),
          ...(selected ? [h.DataAttribute("selected", "true")] : []),
          h.OnClick(send(Message.ClickedAction({ id: data.id })))
        ],
        [
          ...section(data.leftSection, "left", dimmed, selected),
          h.span(getStyles("actionBody", styles.actionBody), [
            label(data),
            h.span(getStyles("actionDescription", styles.actionDescription, selected && styles.descriptionSelected), [
              data.description ?? ""
            ])
          ]),
          ...section(data.rightSection, "right", dimmed, selected)
        ]
      )
    }

    const entry = (item: SpotlightActions): Html =>
      isActionsGroup(item)
        ? h.keyed("div")(
            `group-${item.group}`,
            [
              ...getStyles("actionsGroup", styles.actionsGroup, setVars([spotlightVars.label, quoted(item.group)])),
              h.Role("group"),
              h.AriaLabel(item.group)
            ],
            item.actions.map(action)
          )
        : action(item)

    const search = input(h, {
      id: searchId(model),
      size: props.searchProps?.size ?? "lg",
      value: model.query,
      ...(props.searchProps?.placeholder === undefined ? {} : { placeholder: props.searchProps.placeholder }),
      ...(props.searchProps?.leftSection === undefined ? {} : { leftSection: props.searchProps.leftSection }),
      ...(props.searchProps?.rightSection === undefined ? {} : { rightSection: props.searchProps.rightSection }),
      onInput: (query) => send(Message.ChangedQuery({ query })),
      onKeyDown: (key) => {
        const [message] = keyMessage(key)

        return message === undefined ? Option.none() : Option.some(send(message))
      },
      styles: { input: [styles.search, ...listOf(parts.search)] }
    })

    const list =
      items.length === 0
        ? []
        : [
            h.div(
              [
                ...getStyles("actionsList", styles.actionsList),
                h.Id(listId(model)),
                h.OnMount(Mount.mapMessage(KeepFocus(), Function.absurd<M>))
              ],
              items.map(entry)
            )
          ]

    const empty =
      items.length === 0 && props.nothingFound !== undefined
        ? [h.div(getStyles("empty", styles.empty), [props.nothingFound])]
        : []

    const footer = props.footer === undefined ? [] : [h.div(getStyles("footer", styles.footer), [props.footer])]

    const shortcuts = shortcutsOf(props.shortcut)

    if (props.disabled === true) return h.empty

    return h.keyed("div")(
      `${model.id}-shortcuts-${shortcuts.join("|")}`,
      [
        ...sx(h, styles.shortcut),
        ...(shortcuts.length === 0
          ? []
          : [
              h.OnMount(
                Mount.mapMessage(
                  WatchShortcut({
                    shortcuts,
                    tagsToIgnore: props.tagsToIgnore ?? defaultTagsToIgnore,
                    triggerOnContentEditable: props.triggerOnContentEditable ?? false
                  }),
                  send
                )
              )
            ])
      ],
      [
        modal(h, {
          size: 600,
          yOffset: 80,
          zIndex: 9999,
          padding: 0,
          overlayProps: { backgroundOpacity: 0.35, blur: 7 },
          transitionProps: { duration: 200, transition: "pop" },
          ...modalOptions(props),
          withCloseButton: false,
          model: model.modal,
          toParentMessage: (message) => send(gotModal(message)),
          styles: {
            content: [
              styles.content,
              scrollable && styles.scrollableContent,
              setVars([spotlightVars.maxHeight, scrollable ? sizeOf(props.maxHeight ?? 400) : "none"])
            ],
            body: [styles.body, scrollable && styles.scrollableBody]
          },
          children: [search, ...list, ...empty, ...footer]
        })
      ]
    )
  }
}

const modalOptions = <M>(props: SpotlightProps<M>): Omit<ModalOptions, "withCloseButton"> => {
  const {
    model: _model,
    toParentMessage: _toParentMessage,
    actions: _actions,
    filter: _filter,
    limit: _limit,
    clearQueryOnClose: _clearQueryOnClose,
    closeOnActionTrigger: _closeOnActionTrigger,
    highlightQuery: _highlightQuery,
    scrollable: _scrollable,
    maxHeight: _maxHeight,
    shortcut: _shortcut,
    tagsToIgnore: _tagsToIgnore,
    triggerOnContentEditable: _triggerOnContentEditable,
    disabled: _disabled,
    searchProps: _searchProps,
    nothingFound: _nothingFound,
    footer: _footer,
    styles: _styles,
    attributes: _attributes,
    mod: _mod,
    unstyled: _unstyled,
    bind: _bind,
    id: _id,
    ...options
  } = props

  return options
}

const sizeOf = (value: number | string) => (typeof value === "number" ? rem(value) : value)
