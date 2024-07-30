import { Constructable, Container } from 'typedi'
import EventDispatcher from '../services/event/EventDispatcher'

export default function EventSubscriber(event: string): ClassDecorator {
  return <T = Constructable<unknown>>(subscriber: T): void => {
    const eventDispatcher = Container.get(EventDispatcher)
    eventDispatcher.on(event, (data: any) => {
      const eventSubscriber: { handle: (data: any) => void } = Container.get(subscriber)
      eventSubscriber.handle(data)
    })
  }
}
