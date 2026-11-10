const domainFile = /^domains\/[^/]+\/[^/.]+\.ts$/

const extraServices = new Set(["notifications/WebPush", "budget/ConnectorSource"])

type DomainFile = { readonly domain: string; readonly name: string }

const domainFileOf = (path: string): DomainFile | undefined => {
  if (!domainFile.test(path)) return undefined
  const key = path.slice("domains/".length, -".ts".length)
  const slash = key.indexOf("/")

  return { domain: key.slice(0, slash), name: key.slice(slash + 1) }
}

const isServiceName = ({ domain, name }: DomainFile): boolean => {
  if (name.endsWith("Repo")) return true
  if (name === "migrations") return true
  if (name.toLowerCase() === domain) return true

  return extraServices.has(`${domain}/${name}`)
}

export const isServerOnlyDomainFile = (path: string): boolean => {
  const file = domainFileOf(path)
  if (file === undefined) return false

  return isServiceName(file)
}

export const isPureDomainModule = (path: string): boolean => domainFile.test(path) && !isServerOnlyDomainFile(path)

const sharedDomains = new Set(["catalogue", "tracking", "dashboards", "configuration", "transactions"])

export const isSharedService = (path: string): boolean => {
  const file = domainFileOf(path)
  if (file === undefined) return false
  if (!sharedDomains.has(file.domain)) return false

  return file.name !== "migrations"
}
