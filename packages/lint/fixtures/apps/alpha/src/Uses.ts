import { thing } from "../../beta/src/Thing.ts"
import { thing as again } from "beta/Thing.ts"
import { own } from "./Own.ts"
import { Effect } from "effect"
export const all = [thing, again, own, Effect.void]
