type Updated<Model> = { readonly model: Model }

type ListedOut<Model, Command, OutMessage> = {
  readonly model: Model
  readonly commands?: ReadonlyArray<Command>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const modelAfter = <Model, Message>(
  update: (model: Model, message: Message) => Updated<Model>,
  model: Model,
  messages: ReadonlyArray<Message>
): Model => messages.reduce((current, message) => update(current, message).model, model)

export const listingOutMessages =
  <Model, Message, OutMessage, Command = never>(
    update: (model: Model, message: Message) => ListedOut<Model, Command, OutMessage>
  ) =>
  (model: Model, message: Message) => {
    const result = update(model, message)

    return {
      model: result.model,
      ...(result.commands === undefined ? {} : { commands: result.commands }),
      ...(result.outMessages.length === 0 ? {} : { outMessage: result.outMessages })
    }
  }
