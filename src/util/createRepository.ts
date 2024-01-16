import { Container } from "typedi";
import { EntityManager } from "typeorm";

export default (entity: any, callback: Function): any => {
    const em = Container.get<EntityManager>('entityManager');
    const { target, manager, queryRunner } = em.getMongoRepository(entity);
    return callback(target, manager, queryRunner);
}