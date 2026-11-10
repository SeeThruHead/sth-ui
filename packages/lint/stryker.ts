import { PluginKind, declareValuePlugin } from "@stryker-mutator/api/plugin"
import { typeOnly } from "./typeOnly.ts"

export const strykerPlugins = [declareValuePlugin(PluginKind.Ignore, "type-only", { shouldIgnore: typeOnly })]
