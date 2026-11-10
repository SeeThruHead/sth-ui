import * as Animation from "@foldkit/ui/animation"
import { Story } from "foldkit/test"

export const transitioned = (generation: number) =>
  Story.Command.resolveAll(
    [Animation.WaitForPaint, Animation.Message.CompletedWaitForPaint({ generation })],
    [Animation.WaitForAnimationSettled, Animation.Message.EndedAnimation({ generation })]
  )
