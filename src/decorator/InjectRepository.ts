import { Constructable, Container } from "typedi";

export default function InjectRepository(): ParameterDecorator {
    return (target: Object, propertyKey: string | symbol, parameterIndex: number): void => {
        const paramTypes = Reflect.getOwnMetadata('design:paramtypes', target, propertyKey);
        const repositoryType = paramTypes[parameterIndex];

        Container.registerHandler({
            object: target as Constructable<any>,
            propertyName: propertyKey as string,
            index: parameterIndex,
            value: container => container.get(repositoryType),
        });
    };
}
