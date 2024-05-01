/**
 * Originally taken from 'w3tecch/express-typescript-boilerplate'
 * Credits to the author
 */

import { EventDispatcher } from 'event-dispatch'
import { Constructable, Container } from 'typedi'

export default function InjectEventDispatcher(): ParameterDecorator {
  return (target: Constructable<unknown>, propertyKey: string | symbol, parameterIndex: number): void => {
    const eventDispatcher = new EventDispatcher()

    Container.registerHandler({
      object: target,
      propertyName: propertyKey as string,
      index: parameterIndex,
      value: () => eventDispatcher,
    })
  }
}

export { EventDispatcher as EventDispatcherInterface } from 'event-dispatch'