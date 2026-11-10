import { Effect, Option, Predicate, Schema } from "effect"
import { getPath } from "./paths.ts"
import type { FormError, RuleResult } from "./validators.ts"

export const formRootRule: unique symbol = Symbol("root-rule")

export const formIndex = "__MANTINE_FORM_INDEX__"

export type Rule = (value: unknown, values: unknown, path: string) => RuleResult | Effect.Effect<RuleResult>

export type Rules = { readonly [key: string]: Rule | Rules; readonly [formRootRule]?: Rule }

export type Errors = Readonly<Record<string, FormError>>

export type RawErrors = Readonly<Record<string, RuleResult>>

export type ValidateFunction = (values: unknown) => RawErrors | Effect.Effect<RawErrors>

export type Validate = Rules | ValidateFunction

export type Validation = { readonly errors: Errors; readonly pending: Option.Option<Effect.Effect<Errors>> }

type Check = { readonly path: string; readonly result: RuleResult | Effect.Effect<RuleResult> }

export const filterErrors = (errors: RawErrors): Errors =>
  Object.fromEntries(
    Object.entries(errors).flatMap(([key, value]) =>
      value === null || value === undefined || value === false ? [] : [[key, value] as const]
    )
  )

const rootChecks = (rules: Rules, value: unknown, values: unknown, path: string): ReadonlyArray<Check> =>
  Option.match(Option.fromNullishOr(rules[formRootRule]), {
    onNone: () => [],
    onSome: (rule) => [{ path, result: rule(value, values, path) }]
  })

const checksOf = (rules: Rules, values: unknown, path: string): ReadonlyArray<Check> =>
  Object.entries(rules).flatMap(([key, rule]) => {
    const rulePath = path === "" ? key : `${path}.${key}`
    const value = getPath(rulePath, values)
    if (typeof rule === "function") return [{ path: rulePath, result: rule(value, values, rulePath) }]
    if (Array.isArray(value)) {
      return [
        ...value.flatMap((_, index) => checksOf(rule, values, `${rulePath}.${index}`)),
        ...rootChecks(rule, value, values, rulePath)
      ]
    }
    if (Predicate.isObject(value))
      return [...checksOf(rule, values, rulePath), ...rootChecks(rule, value, values, rulePath)]

    return []
  })

const pendingOf = (checks: ReadonlyArray<{ readonly path: string; readonly result: Effect.Effect<RuleResult> }>) =>
  checks.length === 0
    ? Option.none()
    : Option.some(
        Effect.forEach(checks, (check) => Effect.map(check.result, (result) => [check.path, result] as const)).pipe(
          Effect.map((entries) => filterErrors(Object.fromEntries(entries)))
        )
      )

const syncResult = (check: Check): check is { readonly path: string; readonly result: RuleResult } =>
  !Effect.isEffect(check.result)

const asyncResult = (check: Check): check is { readonly path: string; readonly result: Effect.Effect<RuleResult> } =>
  Effect.isEffect(check.result)

const fromRules = (rules: Rules, values: unknown): Validation => {
  const checks = checksOf(rules, values, "")

  return {
    errors: filterErrors(Object.fromEntries(checks.filter(syncResult).map((check) => [check.path, check.result]))),
    pending: pendingOf(checks.filter(asyncResult))
  }
}

const fromFunction = (validate: ValidateFunction, values: unknown): Validation => {
  const result = validate(values)
  if (Effect.isEffect(result)) return { errors: {}, pending: Option.some(Effect.map(result, filterErrors)) }

  return { errors: filterErrors(result), pending: Option.none() }
}

export const validateValues = (validate: Validate | undefined, values: unknown): Validation => {
  if (validate === undefined) return { errors: {}, pending: Option.none() }

  return typeof validate === "function" ? fromFunction(validate, values) : fromRules(validate, values)
}

export const ruleForPath = (path: string, rules: Rules): Option.Option<Rule> => {
  const found = path
    .split(".")
    .filter((segment) => !/^\d+$/.test(segment))
    .reduce<unknown>(
      (current, segment) => (Predicate.isObject(current) ? Reflect.get(current, segment) : undefined),
      rules
    )

  return typeof found === "function" ? Option.some((value, values, at) => found(value, values, at)) : Option.none()
}

export const errorAt = (path: string, errors: Errors): Option.Option<FormError> => {
  const segments = path.split(".")
  const key = Object.keys(errors).find((errorKey) => {
    const parts = errorKey.split(".")

    return segments.every((segment, index) => segment === parts[index])
  })

  return Option.flatMap(Option.fromNullishOr(key), (found) => Option.fromNullishOr(errors[found]))
}

export type FieldValidation = {
  readonly error: Option.Option<FormError>
  readonly pending: Option.Option<Effect.Effect<Option.Option<FormError>>>
}

const fieldFromValidation = (path: string, validation: Validation): FieldValidation => ({
  error: errorAt(path, validation.errors),
  pending: Option.map(validation.pending, (effect) => Effect.map(effect, (errors) => errorAt(path, errors)))
})

const fieldFromRule = (rule: Rule, path: string, values: unknown): FieldValidation => {
  const result = rule(getPath(path, values), values, path)
  if (!Effect.isEffect(result))
    return { error: errorAt(path, filterErrors({ [path]: result })), pending: Option.none() }

  return {
    error: Option.none(),
    pending: Option.some(Effect.map(result, (value) => errorAt(path, filterErrors({ [path]: value }))))
  }
}

export const validateFieldValue = (path: string, validate: Validate | undefined, values: unknown): FieldValidation => {
  if (validate === undefined || typeof validate === "function")
    return fieldFromValidation(path, validateValues(validate, values))

  return Option.match(ruleForPath(path, validate), {
    onNone: () => fieldFromValidation(path, validateValues(validate, values)),
    onSome: (rule) => fieldFromRule(rule, path, values)
  })
}

export const shouldValidateOnChange = (path: string, setting: boolean | ReadonlyArray<string>): boolean =>
  typeof setting === "boolean" ? setting : setting.includes(path.replace(/[.][0-9]+/g, `.${formIndex}`))

export const getStatus = (status: Readonly<Record<string, boolean>>, path?: string): boolean => {
  const paths = Object.keys(status)
  if (path === undefined) return paths.some((key) => status[key] === true)

  return status[path] === true || paths.some((key) => key.startsWith(`${path}.`) && status[key] === true)
}

const pathOf = (path: ReadonlyArray<unknown> | undefined) =>
  (path ?? [])
    .map((segment) => (Predicate.isObject(segment) ? String(Reflect.get(segment, "key")) : String(segment)))
    .join(".")

export const issueErrors = (
  issues: ReadonlyArray<{ readonly message: string; readonly path?: ReadonlyArray<unknown> | undefined }>
): Errors =>
  issues.reduce<Errors>((errors, issue) => {
    const key = pathOf(issue.path)

    return key in errors ? errors : { ...errors, [key]: issue.message }
  }, {})

type StandardResult = {
  readonly issues?:
    | ReadonlyArray<{ readonly message: string; readonly path?: ReadonlyArray<unknown> | undefined }>
    | undefined
}

const standardErrors = (resolved: StandardResult): Errors => issueErrors(resolved.issues ?? [])

export type StandardSchema = {
  readonly "~standard": { readonly validate: (value: unknown) => StandardResult | Promise<StandardResult> }
}

export const standardResolver =
  (schema: StandardSchema): ValidateFunction =>
  (values) => {
    const result = schema["~standard"].validate(values)

    return result instanceof Promise
      ? Effect.promise(() => result).pipe(Effect.map(standardErrors))
      : standardErrors(result)
  }

export const schemaResolver = (schema: Parameters<typeof Schema.toStandardSchemaV1>[0]): ValidateFunction =>
  standardResolver(Schema.toStandardSchemaV1(schema))
