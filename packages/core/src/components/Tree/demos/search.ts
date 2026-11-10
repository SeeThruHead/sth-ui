import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { FileTextIcon } from "@sth-ui/icons/icons/FileTextIcon.ts"
import { FolderOpenIcon } from "@sth-ui/icons/icons/FolderOpenIcon.ts"
import { FolderSimpleIcon } from "@sth-ui/icons/icons/FolderSimpleIcon.ts"
import type { Child } from "../../../content.ts"
import type { Ui } from "../../../Ui.ts"
import * as Tree from "../Tree.ts"
import type { RenderTreeNodePayload, TreeNodeData, TreeNodeFilter } from "../Tree.ts"

export const files: ReadonlyArray<TreeNodeData> = [
  {
    label: "src",
    value: "src",
    children: [
      {
        label: "components",
        value: "src/components",
        children: [
          { label: "Accordion.tsx", value: "src/components/Accordion.tsx" },
          { label: "Tree.tsx", value: "src/components/Tree.tsx" },
          { label: "Button.tsx", value: "src/components/Button.tsx" },
          { label: "Input.tsx", value: "src/components/Input.tsx" }
        ]
      },
      {
        label: "hooks",
        value: "src/hooks",
        children: [
          { label: "use-debounce.ts", value: "src/hooks/use-debounce.ts" },
          { label: "use-media-query.ts", value: "src/hooks/use-media-query.ts" }
        ]
      }
    ]
  },
  {
    label: "public",
    value: "public",
    children: [
      { label: "favicon.ico", value: "public/favicon.ico" },
      { label: "logo.svg", value: "public/logo.svg" }
    ]
  },
  { label: "package.json", value: "package.json" },
  { label: "tsconfig.json", value: "tsconfig.json" }
]

export const Model = Schema.Struct({ tree: Tree.Model, search: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Searched: { value: Schema.String }, GotTree: { message: Tree.Message } })
export type Message = typeof Message.Type

type Update = { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> }

export type SearchMode = {
  readonly id: string
  readonly placeholder: string
  readonly shown: (search: string) => ReadonlyArray<TreeNodeData>
  readonly expandedFor: (search: string) => ReadonlyArray<string> | "*"
  readonly label: <M>(h: HtmlBuilder<M>, ui: Ui, search: string, node: TreeNodeData) => Child
}

export const filtered = (filter?: TreeNodeFilter<TreeNodeData>) => (search: string) =>
  Tree.filterTreeData(files, search, filter)

export const searchDemo = (mode: SearchMode) => {
  const step = (model: Model, message: Tree.Message): Update => {
    const result = Tree.update(model.tree, message, Tree.treeContext({ data: mode.shown(model.search) }))

    return {
      model: { ...model, tree: result.model },
      commands: result.commands.map((command) =>
        Command.mapMessage(command, (lifted) => Message.GotTree({ message: lifted }))
      )
    }
  }

  const leaf = (h: HtmlBuilder<Message>, ui: Ui, search: string, payload: RenderTreeNodePayload<Message>) =>
    ui.Group(h, {
      gap: 6,
      bind: payload.elementProps,
      styles: { root: payload.elementStyles },
      children: [
        h.span(
          [h.Style({ opacity: "0.75", display: "inline-flex" })],
          [
            payload.hasChildren
              ? (payload.expanded ? FolderOpenIcon : FolderSimpleIcon)(h, { size: 14 })
              : FileTextIcon(h, { size: 14 })
          ]
        ),
        mode.label(h, ui, search, payload.node)
      ]
    })

  return {
    init: (): Model => ({ tree: Tree.init({ id: mode.id, data: files }), search: "" }),
    update: (model: Model, message: Message): Update =>
      Message.match(message, {
        Searched: ({ value }) => {
          const searched = { ...model, search: value }

          return value.trim() === ""
            ? step(searched, Tree.Message.CollapsedAll())
            : step(
                searched,
                Tree.Message.SetExpanded({
                  state: Tree.getTreeExpandedState(mode.shown(value), mode.expandedFor(value))
                })
              )
        },
        GotTree: ({ message: inner }) => step(model, inner)
      }),
    view: (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
      ui.Box(h, {
        w: "100%",
        maw: 360,
        children: [
          ui.TextInput(h, {
            id: `${mode.id}-search`,
            placeholder: mode.placeholder,
            mb: "sm",
            value: model.search,
            onInput: (value) => Message.Searched({ value }),
            attributes: { input: { "aria-label": "Search files" } }
          }),
          ui.Tree(h, {
            model: model.tree,
            data: mode.shown(model.search),
            toParentMessage: (message) => Message.GotTree({ message }),
            ariaLabel: "Project files",
            withLines: true,
            renderNode: (payload) => leaf(h, ui, model.search, payload)
          })
        ]
      })
  }
}

export const plainLabel = <M>(h: HtmlBuilder<M>, _ui: Ui, _search: string, node: TreeNodeData): Child =>
  h.span([], [node.label])
