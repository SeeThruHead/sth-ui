export type RichTextEditorLabels = {
  readonly boldControlLabel: string
  readonly hrControlLabel: string
  readonly italicControlLabel: string
  readonly underlineControlLabel: string
  readonly strikeControlLabel: string
  readonly clearFormattingControlLabel: string
  readonly linkControlLabel: string
  readonly unlinkControlLabel: string
  readonly bulletListControlLabel: string
  readonly orderedListControlLabel: string
  readonly h1ControlLabel: string
  readonly h2ControlLabel: string
  readonly h3ControlLabel: string
  readonly h4ControlLabel: string
  readonly h5ControlLabel: string
  readonly h6ControlLabel: string
  readonly blockquoteControlLabel: string
  readonly alignLeftControlLabel: string
  readonly alignCenterControlLabel: string
  readonly alignRightControlLabel: string
  readonly alignJustifyControlLabel: string
  readonly codeControlLabel: string
  readonly codeBlockControlLabel: string
  readonly subscriptControlLabel: string
  readonly superscriptControlLabel: string
  readonly colorPickerControlLabel: string
  readonly unsetColorControlLabel: string
  readonly highlightControlLabel: string
  readonly undoControlLabel: string
  readonly redoControlLabel: string
  readonly colorControlLabel: (color: string) => string
  readonly sourceCodeControlLabel: string
  readonly linkEditorInputLabel: string
  readonly linkEditorInputPlaceholder: string
  readonly linkEditorExternalLink: string
  readonly linkEditorInternalLink: string
  readonly linkEditorSave: string
  readonly colorPickerCancel: string
  readonly colorPickerClear: string
  readonly colorPickerColorPicker: string
  readonly colorPickerPalette: string
  readonly colorPickerSave: string
  readonly colorPickerColorLabel: (color: string) => string
  readonly tasksControlLabel: string
  readonly tasksSinkLabel: string
  readonly tasksLiftLabel: string
  readonly imageUploadControlLabel: string
  readonly tableInsertControlLabel: string
  readonly tableInsertLabel: (columns: number, rows: number) => string
  readonly tableDeleteControlLabel: string
  readonly tableColumnBeforeControlLabel: string
  readonly tableColumnAfterControlLabel: string
  readonly tableColumnDeleteControlLabel: string
  readonly tableRowBeforeControlLabel: string
  readonly tableRowAfterControlLabel: string
  readonly tableRowDeleteControlLabel: string
  readonly tableToggleHeaderRowControlLabel: string
  readonly tableToggleHeaderColumnControlLabel: string
  readonly tableMergeCellsControlLabel: string
  readonly tableSplitCellControlLabel: string
  readonly detailsControlLabel: string
  readonly invisibleCharactersControlLabel: string
}

export const defaultLabels: RichTextEditorLabels = {
  linkControlLabel: "Link",
  colorPickerControlLabel: "Text color",
  highlightControlLabel: "Highlight text",
  colorControlLabel: (color) => `Set text color ${color}`,
  boldControlLabel: "Bold",
  italicControlLabel: "Italic",
  underlineControlLabel: "Underline",
  strikeControlLabel: "Strikethrough",
  clearFormattingControlLabel: "Clear formatting",
  unlinkControlLabel: "Remove link",
  bulletListControlLabel: "Bullet list",
  orderedListControlLabel: "Ordered list",
  sourceCodeControlLabel: "Switch between text/source code",
  h1ControlLabel: "Heading 1",
  h2ControlLabel: "Heading 2",
  h3ControlLabel: "Heading 3",
  h4ControlLabel: "Heading 4",
  h5ControlLabel: "Heading 5",
  h6ControlLabel: "Heading 6",
  blockquoteControlLabel: "Blockquote",
  alignLeftControlLabel: "Align text: left",
  alignCenterControlLabel: "Align text: center",
  alignRightControlLabel: "Align text: right",
  alignJustifyControlLabel: "Align text: justify",
  codeControlLabel: "Code",
  codeBlockControlLabel: "Code block",
  subscriptControlLabel: "Subscript",
  superscriptControlLabel: "Superscript",
  unsetColorControlLabel: "Unset color",
  hrControlLabel: "Horizontal line",
  undoControlLabel: "Undo",
  redoControlLabel: "Redo",
  tasksControlLabel: "Task list",
  tasksSinkLabel: "Decrease task level",
  tasksLiftLabel: "Increase task level",
  imageUploadControlLabel: "Upload image",
  tableInsertControlLabel: "Insert table",
  tableInsertLabel: (columns, rows) => `Insert ${columns} × ${rows} table`,
  tableDeleteControlLabel: "Delete table",
  tableColumnBeforeControlLabel: "Add column before",
  tableColumnAfterControlLabel: "Add column after",
  tableColumnDeleteControlLabel: "Delete column",
  tableRowBeforeControlLabel: "Add row before",
  tableRowAfterControlLabel: "Add row after",
  tableRowDeleteControlLabel: "Delete row",
  tableToggleHeaderRowControlLabel: "Toggle header row",
  tableToggleHeaderColumnControlLabel: "Toggle header column",
  tableMergeCellsControlLabel: "Merge cells",
  tableSplitCellControlLabel: "Split cell",
  detailsControlLabel: "Toggle collapsible section",
  invisibleCharactersControlLabel: "Toggle invisible characters",
  linkEditorInputLabel: "Enter URL",
  linkEditorInputPlaceholder: "https://example.com/",
  linkEditorExternalLink: "Open link in a new tab",
  linkEditorInternalLink: "Open link in the same tab",
  linkEditorSave: "Save",
  colorPickerCancel: "Cancel",
  colorPickerClear: "Clear color",
  colorPickerColorPicker: "Color picker",
  colorPickerPalette: "Color palette",
  colorPickerSave: "Save",
  colorPickerColorLabel: (color) => `Set text color ${color}`
}

export const richTextEditorLabels = (labels: Partial<RichTextEditorLabels> = {}): RichTextEditorLabels => ({
  ...defaultLabels,
  ...labels
})
