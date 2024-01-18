import { EventDispatcher } from 'event-dispatch';
import { Constructable, Container } from 'typedi';

export default function InjectEventDispatcher(): ParameterDecorator {
    return (target: Object, propertyKey: string | symbol, parameterIndex: number): void => {
        const eventDispatcher = new EventDispatcher();

        Container.registerHandler({
            object: target as Constructable<any>,
            propertyName: propertyKey as string,
            index: parameterIndex,
            value: () => eventDispatcher,
        });
    };
}

export { EventDispatcher as EventDispatcherInterface } from 'event-dispatch';