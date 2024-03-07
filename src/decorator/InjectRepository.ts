import { Constructable, Container } from 'typedi'

export default function InjectRepository(): ParameterDecorator {
  return (target: Constructable<unknown>, propertyKey: string | symbol, parameterIndex: number): void => {
    const paramTypes: unknown[] = Reflect.getOwnMetadata('design:paramtypes', target, propertyKey)
    const repositoryType = paramTypes[parameterIndex]

    Container.registerHandler({
      object: target,
      propertyName: propertyKey as string,
      index: parameterIndex,
      value: container => container.get<typeof repositoryType>(repositoryType),
    })
  }
}
