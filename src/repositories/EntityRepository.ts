import { MongoRepository } from 'typeorm'
import { ObjectId } from 'mongodb'
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral'
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions'
import { FilterOperators } from 'typeorm/driver/mongodb/typings'

export default class EntityRepository<Entity extends ObjectLiteral> extends MongoRepository<Entity> {

  public async findOneBy(where: any): Promise<Entity | null> {
    where['deletedAt'] = { $exists: false }

    return await super.findOneBy(where)
  }

  public async findOneById(id: string | number | Date | ObjectId): Promise<Entity | null> {
    return await this.findOneBy({ _id: id })
  }

  public async find(options?: FindManyOptions<Entity> | Partial<Entity> | FilterOperators<Entity>): Promise<Entity[]> {
    if ('where' in options) {
      options.where['deletedAt'] = { $exists: false }
    }

    return await super.find(options)
  }
}