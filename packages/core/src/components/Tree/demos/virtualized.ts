import * as stylex from "@stylexjs/stylex"
import * as VirtualList from "@foldkit/ui/virtualList"
import { Schema } from "effect"
import * as Command from "foldkit/command"
import { childAttributes } from "foldkit/html"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { sx } from "../../../styles/StylesApi.ts"
import * as Tree from "../Tree.ts"
import type { TreeNodeData } from "../Tree.ts"
import type { Ui } from "../../../Ui.ts"

const range = (count: number) => Array.from({ length: count }, (_, index) => index + 1)

export const largeData: ReadonlyArray<TreeNodeData> = range(30).map((group) => ({
  value: `group-${group}`,
  label: `Group ${group}`,
  children: range(10).map((folder) => ({
    value: `group-${group}-folder-${folder}`,
    label: `Folder ${group}.${folder}`,
    children: range(5).map((file) => ({
      value: `group-${group}-folder-${folder}-file-${file}`,
      label: `File ${group}.${folder}.${file}`
    }))
  }))
}))

const rowHeight = 30

export const Model = Schema.Struct({ tree: Tree.Model, list: VirtualList.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotTree: { message: Tree.Message },
  GotList: { message: VirtualList.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  tree: {
    ...Tree.init({ id: "virtual-tree" }),
    expanded: { "group-1": true, "group-1-folder-1": true, "group-30": true, "group-30-folder-10": true }
  },
  list: VirtualList.init({ id: "virtual-tree-list", rowHeightPx: rowHeight })
})

const context = Tree.treeContext({ data: largeData, expandOnClick: true, selectOnClick: true })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotTree: ({ message: inner }) => {
      const result = Tree.update(model.tree, inner, context)

      return {
        model: { ...model, tree: result.model },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotTree({ message: lifted }))
        )
      }
    },
    GotList: ({ message: inner }) => {
      const result = VirtualList.update(model.list, inner)

      return {
        model: { ...model, list: result.model },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotList({ message: lifted }))
        )
      }
    }
  })

const styles = stylex.create({ scroll: { height: "300px" } })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html => {
  const treeProps = {
    model: model.tree,
    toParentMessage: (message: Tree.Message) => Message.GotTree({ message }),
    data: largeData,
    withLines: true
  }
  const entries = Tree.flattenTreeData(largeData, model.tree.expanded)

  return h.div(ui.treeRootAttributes(h, { ...treeProps, ariaLabel: "Large tree" }), [
    h.submodel({
      slotId: model.list.id,
      model: model.list,
      view: VirtualList.view<Tree.FlattenedTreeNode<TreeNodeData>>(),
      toParentMessage: (message) => Message.GotList({ message }),
      viewInputs: {
        items: entries,
        itemToKey: (entry) => entry.node.value,
        itemToView: (entry, index) => ui.FlatTreeNode(h, { ...treeProps, entry, focusable: index === 0 }),
        overscan: 10,
        containerAttributes: childAttributes(sx(h, styles.scroll))
      }
    })
  ])
}
