import { Container } from "typedi";
import { ConnectionManager, EntityManager, MongoRepository } from "typeorm";

export default function Repository(entity: Object, connection: string = 'default'): ClassDecorator {
    return <TFunction extends Function>(repositoryType: TFunction): TFunction | void => {
        Container.set({
            id: repositoryType,
            type: repositoryType as any,
            factory: () => {
                const em = Container.get(ConnectionManager).get(connection).manager;
                const {
                    target,
                    manager,
                    queryRunner
                } = em[`get${repositoryType instanceof MongoRepository ? 'Mongo' : ''}Repository`](entity as any);
                return new (repositoryType as any)(target, manager, queryRunner);
            }
        });
    };
}
