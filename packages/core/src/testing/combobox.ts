import * as Animation from "@foldkit/ui/animation"
import * as Combobox from "@foldkit/ui/combobox"
import { Story } from "foldkit/test"

export const comboboxOpened = (generation = 1) =>
  Story.Command.resolveAll(
    [Combobox.FocusInput, Combobox.Message.CompletedFocusInput()],
    [Animation.WaitForPaint, Animation.Message.CompletedWaitForPaint({ generation })],
    [Animation.WaitForAnimationSettled, Animation.Message.EndedAnimation({ generation })]
  )

export const comboboxClosed = (generation = 2) =>
  Story.Command.resolveAll(
    [Combobox.FocusInput, Combobox.Message.CompletedFocusInput()],
    [Animation.WaitForPaint, Animation.Message.CompletedWaitForPaint({ generation })],
    [
      Combobox.DetectMovementOrAnimationEnd,
      Combobox.Message.GotAnimationMessage({ message: Animation.Message.EndedAnimation({ generation }) })
    ]
  )

export const comboboxMoved = () =>
  Story.Command.resolveAll([Combobox.ScrollIntoView, Combobox.Message.CompletedScrollIntoView()])
