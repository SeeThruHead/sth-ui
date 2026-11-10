import { Array as Arr } from "effect"

export const containerTags = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "del",
  "ins",
  "small",
  "sub",
  "sup",
  "code",
  "pre",
  "kbd",
  "mark",
  "blockquote",
  "cite",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "details",
  "summary",
  "figure",
  "figcaption",
  "span",
  "div"
] as const

export const voidTags = ["hr", "img", "br"] as const

export type ContainerTag = (typeof containerTags)[number]

export type VoidTag = (typeof voidTags)[number]

export type TypographyElement = {
  readonly _tag: "Element"
  readonly tag: ContainerTag | VoidTag
  readonly attributes: ReadonlyArray<readonly [string, string]>
  readonly children: ReadonlyArray<TypographyNode>
}

export type TypographyNode = { readonly _tag: "Text"; readonly text: string } | TypographyElement

const allowedAttributes = [
  "href",
  "src",
  "alt",
  "title",
  "width",
  "height",
  "colspan",
  "rowspan",
  "start",
  "reversed",
  "open",
  "cite",
  "data-type"
]

const scripted = /^\s*(javascript|vbscript):/i

const embedded = /^\s*data:/i

const isContainer = (tag: string): tag is ContainerTag => containerTags.some((known) => known === tag)

export const isVoid = (tag: string): tag is VoidTag => voidTags.some((known) => known === tag)

const unsafe = (name: string, value: string): boolean =>
  scripted.test(value) || (name !== "src" && embedded.test(value))

const safe = ([name, value]: readonly [string, string]): boolean =>
  allowedAttributes.includes(name) && !unsafe(name, value)

const elementOf = (node: Element, tag: ContainerTag | VoidTag): TypographyElement => ({
  _tag: "Element",
  tag,
  attributes: Arr.fromIterable(node.attributes)
    .map((attribute): readonly [string, string] => [attribute.name, attribute.value])
    .filter(safe),
  children: nodesOf(node.childNodes)
})

const nodeOf = (node: ChildNode): ReadonlyArray<TypographyNode> => {
  if (node instanceof Text) return [{ _tag: "Text", text: node.data }]
  if (!(node instanceof Element)) return []
  const tag = node.tagName.toLowerCase()
  if (isContainer(tag) || isVoid(tag)) return [elementOf(node, tag)]
  if (tag === "script" || tag === "style") return []

  return nodesOf(node.childNodes)
}

const nodesOf = (nodes: NodeListOf<ChildNode>): ReadonlyArray<TypographyNode> => Arr.fromIterable(nodes).flatMap(nodeOf)

export const parseTypography = (html: string): ReadonlyArray<TypographyNode> =>
  nodesOf(new DOMParser().parseFromString(html, "text/html").body.childNodes)
