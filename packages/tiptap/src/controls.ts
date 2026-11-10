import { ArrowUUpLeftIcon } from "@sth-ui/icons/icons/ArrowUUpLeftIcon.ts"
import { ArrowUUpRightIcon } from "@sth-ui/icons/icons/ArrowUUpRightIcon.ts"
import { CodeBlockIcon } from "@sth-ui/icons/icons/CodeBlockIcon.ts"
import { CodeIcon } from "@sth-ui/icons/icons/CodeIcon.ts"
import { ColumnsIcon } from "@sth-ui/icons/icons/ColumnsIcon.ts"
import { ColumnsPlusLeftIcon } from "@sth-ui/icons/icons/ColumnsPlusLeftIcon.ts"
import { ColumnsPlusRightIcon } from "@sth-ui/icons/icons/ColumnsPlusRightIcon.ts"
import { EraserIcon } from "@sth-ui/icons/icons/EraserIcon.ts"
import { HighlighterIcon } from "@sth-ui/icons/icons/HighlighterIcon.ts"
import type { Icon } from "@sth-ui/icons/Icon.ts"
import { LinkBreakIcon } from "@sth-ui/icons/icons/LinkBreakIcon.ts"
import { ListBulletsIcon } from "@sth-ui/icons/icons/ListBulletsIcon.ts"
import { ListChecksIcon } from "@sth-ui/icons/icons/ListChecksIcon.ts"
import { ListNumbersIcon } from "@sth-ui/icons/icons/ListNumbersIcon.ts"
import { MinusIcon } from "@sth-ui/icons/icons/MinusIcon.ts"
import { ProhibitIcon } from "@sth-ui/icons/icons/ProhibitIcon.ts"
import { QuotesIcon } from "@sth-ui/icons/icons/QuotesIcon.ts"
import { RowsIcon } from "@sth-ui/icons/icons/RowsIcon.ts"
import { RowsPlusBottomIcon } from "@sth-ui/icons/icons/RowsPlusBottomIcon.ts"
import { RowsPlusTopIcon } from "@sth-ui/icons/icons/RowsPlusTopIcon.ts"
import { TableIcon } from "@sth-ui/icons/icons/TableIcon.ts"
import { TextAlignCenterIcon } from "@sth-ui/icons/icons/TextAlignCenterIcon.ts"
import { TextAlignJustifyIcon } from "@sth-ui/icons/icons/TextAlignJustifyIcon.ts"
import { TextAlignLeftIcon } from "@sth-ui/icons/icons/TextAlignLeftIcon.ts"
import { TextAlignRightIcon } from "@sth-ui/icons/icons/TextAlignRightIcon.ts"
import { TextBIcon } from "@sth-ui/icons/icons/TextBIcon.ts"
import { TextHFiveIcon } from "@sth-ui/icons/icons/TextHFiveIcon.ts"
import { TextHFourIcon } from "@sth-ui/icons/icons/TextHFourIcon.ts"
import { TextHOneIcon } from "@sth-ui/icons/icons/TextHOneIcon.ts"
import { TextHSixIcon } from "@sth-ui/icons/icons/TextHSixIcon.ts"
import { TextHThreeIcon } from "@sth-ui/icons/icons/TextHThreeIcon.ts"
import { TextHTwoIcon } from "@sth-ui/icons/icons/TextHTwoIcon.ts"
import { TextIndentIcon } from "@sth-ui/icons/icons/TextIndentIcon.ts"
import { TextItalicIcon } from "@sth-ui/icons/icons/TextItalicIcon.ts"
import { TextOutdentIcon } from "@sth-ui/icons/icons/TextOutdentIcon.ts"
import { TextStrikethroughIcon } from "@sth-ui/icons/icons/TextStrikethroughIcon.ts"
import { TextSubscriptIcon } from "@sth-ui/icons/icons/TextSubscriptIcon.ts"
import { TextSuperscriptIcon } from "@sth-ui/icons/icons/TextSuperscriptIcon.ts"
import { TextUnderlineIcon } from "@sth-ui/icons/icons/TextUnderlineIcon.ts"
import type { Editor } from "@tiptap/core"
import { CaretCircleRightIcon } from "@sth-ui/icons/icons/CaretCircleRightIcon.ts"
import { ImageIcon } from "@sth-ui/icons/icons/ImageIcon.ts"
import { ParagraphIcon } from "@sth-ui/icons/icons/ParagraphIcon.ts"
import { can, stored } from "./call.ts"
import type { Call } from "./call.ts"
import type { RichTextEditorLabels } from "./labels.ts"

export type { Call } from "./call.ts"

type TextLabel = {
  readonly [Key in keyof RichTextEditorLabels]: RichTextEditorLabels[Key] extends string ? Key : never
}[keyof RichTextEditorLabels]

export type ControlSpec = {
  readonly label: TextLabel
  readonly icon: Icon
  readonly operation: Call
  readonly active?: { readonly name: string; readonly attributes?: Readonly<Record<string, unknown>> }
  readonly checksCan?: boolean
  readonly requires?: string
  readonly isActive?: (editor: Editor) => boolean
  readonly isDisabled?: (editor: Editor) => boolean
  readonly choose?: (editor: Editor) => Call
}

const toggle = (label: TextLabel, icon: Icon, name: string, operation: string): ControlSpec => ({
  label,
  icon,
  active: { name },
  operation: { name: operation }
})

const heading = (label: TextLabel, icon: Icon, level: number): ControlSpec => ({
  label,
  icon,
  active: { name: "heading", attributes: { level } },
  operation: { name: "toggleHeading", args: [{ level }] }
})

const align = (label: TextLabel, icon: Icon, side: string): ControlSpec => ({
  label,
  icon,
  operation: { name: "setTextAlign", args: [side] }
})

const action = (label: TextLabel, icon: Icon, name: string, args: ReadonlyArray<unknown> = []): ControlSpec => ({
  label,
  icon,
  operation: { name, args }
})

const guarded = (spec: ControlSpec, requires?: string): ControlSpec => ({
  ...spec,
  checksCan: true,
  ...(requires === undefined ? {} : { requires })
})

const setDetails: Call = { name: "setDetails" }

const unsetDetails: Call = { name: "unsetDetails" }

const toggleInvisible: Call = { name: "toggleInvisibleCharacters" }

const details: ControlSpec = {
  label: "detailsControlLabel",
  icon: CaretCircleRightIcon,
  operation: setDetails,
  requires: "details",
  isActive: (editor) => can(editor, unsetDetails),
  isDisabled: (editor) => !can(editor, setDetails) && !can(editor, unsetDetails),
  choose: (editor) => (can(editor, unsetDetails) ? unsetDetails : setDetails)
}

const invisibleCharacters: ControlSpec = {
  label: "invisibleCharactersControlLabel",
  icon: ParagraphIcon,
  operation: toggleInvisible,
  isActive: (editor) => stored(editor, "invisibleCharacters", { name: "visibility" }) === true,
  isDisabled: (editor) => !can(editor, toggleInvisible)
}

export const controls = {
  Bold: toggle("boldControlLabel", TextBIcon, "bold", "toggleBold"),
  Italic: toggle("italicControlLabel", TextItalicIcon, "italic", "toggleItalic"),
  Underline: toggle("underlineControlLabel", TextUnderlineIcon, "underline", "toggleUnderline"),
  Strikethrough: toggle("strikeControlLabel", TextStrikethroughIcon, "strike", "toggleStrike"),
  ClearFormatting: action("clearFormattingControlLabel", EraserIcon, "unsetAllMarks"),
  Unlink: action("unlinkControlLabel", LinkBreakIcon, "unsetLink"),
  BulletList: toggle("bulletListControlLabel", ListBulletsIcon, "bulletList", "toggleBulletList"),
  OrderedList: toggle("orderedListControlLabel", ListNumbersIcon, "orderedList", "toggleOrderedList"),
  H1: heading("h1ControlLabel", TextHOneIcon, 1),
  H2: heading("h2ControlLabel", TextHTwoIcon, 2),
  H3: heading("h3ControlLabel", TextHThreeIcon, 3),
  H4: heading("h4ControlLabel", TextHFourIcon, 4),
  H5: heading("h5ControlLabel", TextHFiveIcon, 5),
  H6: heading("h6ControlLabel", TextHSixIcon, 6),
  Blockquote: toggle("blockquoteControlLabel", QuotesIcon, "blockquote", "toggleBlockquote"),
  AlignLeft: align("alignLeftControlLabel", TextAlignLeftIcon, "left"),
  AlignRight: align("alignRightControlLabel", TextAlignRightIcon, "right"),
  AlignCenter: align("alignCenterControlLabel", TextAlignCenterIcon, "center"),
  AlignJustify: align("alignJustifyControlLabel", TextAlignJustifyIcon, "justify"),
  Subscript: toggle("subscriptControlLabel", TextSubscriptIcon, "subscript", "toggleSubscript"),
  Superscript: toggle("superscriptControlLabel", TextSuperscriptIcon, "superscript", "toggleSuperscript"),
  Code: toggle("codeControlLabel", CodeIcon, "code", "toggleCode"),
  CodeBlock: toggle("codeBlockControlLabel", CodeBlockIcon, "codeBlock", "toggleCodeBlock"),
  Highlight: toggle("highlightControlLabel", HighlighterIcon, "highlight", "toggleHighlight"),
  Hr: action("hrControlLabel", MinusIcon, "setHorizontalRule"),
  UnsetColor: action("unsetColorControlLabel", ProhibitIcon, "unsetColor"),
  Undo: guarded(action("undoControlLabel", ArrowUUpLeftIcon, "undo")),
  Redo: guarded(action("redoControlLabel", ArrowUUpRightIcon, "redo")),
  TaskList: toggle("tasksControlLabel", ListChecksIcon, "taskList", "toggleTaskList"),
  TaskListSink: guarded(action("tasksSinkLabel", TextIndentIcon, "sinkListItem", ["taskItem"]), "taskItem"),
  TaskListLift: guarded(action("tasksLiftLabel", TextOutdentIcon, "liftListItem", ["taskItem"]), "taskItem"),
  TableDelete: guarded(action("tableDeleteControlLabel", TableIcon, "deleteTable"), "table"),
  TableColumnBefore: guarded(action("tableColumnBeforeControlLabel", ColumnsPlusLeftIcon, "addColumnBefore"), "table"),
  TableColumnAfter: guarded(action("tableColumnAfterControlLabel", ColumnsPlusRightIcon, "addColumnAfter"), "table"),
  TableColumnDelete: guarded(action("tableColumnDeleteControlLabel", ColumnsIcon, "deleteColumn"), "table"),
  TableRowBefore: guarded(action("tableRowBeforeControlLabel", RowsPlusTopIcon, "addRowBefore"), "table"),
  TableRowAfter: guarded(action("tableRowAfterControlLabel", RowsPlusBottomIcon, "addRowAfter"), "table"),
  TableRowDelete: guarded(action("tableRowDeleteControlLabel", RowsIcon, "deleteRow"), "table"),
  TableToggleHeaderRow: guarded(action("tableToggleHeaderRowControlLabel", RowsIcon, "toggleHeaderRow"), "table"),
  TableToggleHeaderColumn: guarded(
    action("tableToggleHeaderColumnControlLabel", ColumnsIcon, "toggleHeaderColumn"),
    "table"
  ),
  TableMergeCells: guarded(action("tableMergeCellsControlLabel", TableIcon, "mergeCells"), "table"),
  TableSplitCell: guarded(action("tableSplitCellControlLabel", TableIcon, "splitCell"), "table"),
  TableInsert: guarded(action("tableInsertControlLabel", TableIcon, "insertTable"), "table"),
  ImageUpload: {
    label: "imageUploadControlLabel",
    icon: ImageIcon,
    operation: { name: "insertContent" },
    requires: "image"
  },
  Details: details,
  InvisibleCharacters: invisibleCharacters
} satisfies Readonly<Record<string, ControlSpec>>

export type ControlName = keyof typeof controls

export const controlNames = Object.keys(controls).filter((name): name is ControlName => Object.hasOwn(controls, name))
