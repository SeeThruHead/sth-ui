import type { NodePath } from "@babel/traverse"
import type { Node } from "@babel/types"

const isMember = (node: Node | undefined | null, object: string, property: string): boolean => {
  if (node?.type !== "MemberExpression") return false
  if (node.object.type !== "Identifier" || node.object.name !== object) return false

  return node.property.type === "Identifier" && node.property.name === property
}

const isServiceKey = (callee: Node): boolean =>
  callee.type === "CallExpression" && isMember(callee.callee, "Context", "Service")

const isTaggedError = (callee: Node): boolean =>
  callee.type === "CallExpression" && isMember(callee.callee, "Schema", "TaggedError")

const isCallTo = (node: Node | undefined | null, name: string): boolean =>
  node?.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name === name

const reasonFor = (callee: Node, argument: Node): string | undefined => {
  if (isMember(callee, "Schema", "brand")) return "a brand's name exists only in the type"
  if (isServiceKey(callee)) return "a service key is a label; nothing outside the service reads it"
  if (isMember(callee, "Schema", "Struct") && argument.type === "ObjectExpression")
    return "Schema keeps unknown properties, so dropping a struct's fields only breaks the types"
  if (isTaggedError(callee) && argument.type === "ObjectExpression") return "an error's fields only shape its type"

  return undefined
}

const messageFields = (path: NodePath): string | undefined => {
  if (path.node.type !== "ObjectExpression") return undefined
  if (path.parentPath?.node.type !== "ObjectProperty") return undefined
  if (!isCallTo(path.parentPath.parentPath?.parentPath?.node, "defineMessageUnion")) return undefined

  return "a message's fields only shape its type"
}

const callArgument = (path: NodePath): string | undefined => {
  const parent = path.parentPath?.node
  if (parent?.type !== "CallExpression") return undefined
  if (!parent.arguments.some((argument) => argument === path.node)) return undefined

  return reasonFor(parent.callee, path.node)
}

export const typeOnly = (path: NodePath): string | undefined => callArgument(path) ?? messageFields(path)
