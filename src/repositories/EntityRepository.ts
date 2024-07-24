import { MongoRepository } from 'typeorm'
import { ObjectId } from 'mongodb'
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral'
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions'
import { CountOptions, Document, FilterOperators } from 'typeorm/driver/mongodb/typings'
import { UpdateResult } from 'typeorm/query-builder/result/UpdateResult'

export default class EntityRepository<Entity extends ObjectLiteral> extends MongoRepository<Entity> {

  public async findOneBy(where: any): Promise<Entity | null> {
    where.deletedAt = { $exists: false }

    return await super.findOneBy(where)
  }

  public async findOneById(id: string | number | Date | ObjectId): Promise<Entity | null> {
    return await this.findOneBy({ _id: id })
  }

  public async find(options?: FindManyOptions<Entity> | Partial<Entity> | FilterOperators<Entity>): Promise<Entity[]> {
    if ('where' in options) {
      options.where.deletedAt = { $exists: false }
    } else {
      options.where = { deletedAt: { $exists: false } }
    }

    return await super.find(options)
  }

  public async count(query?: ObjectLiteral, options?: CountOptions): Promise<number> {
    query['deletedAt'] = { $exists: false }

    return await super.count(query, options)
  }

  public async updateOneByEntity(
    entity: Entity,
    set: Partial<Entity> = {},
  ): Promise<Document | UpdateResult> {
    const update: { $set: Partial<Entity>, $unset: Record<string, ''> } = { $set: {}, $unset: {} }

    for (const prop in set) {
      if (set.hasOwnProperty(prop)) {
        if (set[prop] === undefined) {
          delete entity[prop]
          update.$unset[prop as string] = ''
        } else {
          entity[prop] = update.$set[prop] = set[prop]
        }
      }
    }

    if (Object.keys(update.$set).length === 0) {
      delete update.$set
    }

    if (Object.keys(update.$unset).length === 0) {
      delete update.$unset
    }

    return await this.updateOne({ _id: entity.id }, update)
  }
}