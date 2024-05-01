import { MongoRepository } from 'typeorm'
import Category from '../entities/Category'
import Repository from '../decorators/Repository'
import { ObjectId } from 'mongodb'

@Repository(Category)
export default class CategoryRepository extends MongoRepository<Category> {

  public async findOneById(id: ObjectId): Promise<Category | null> {
    return await this.findOneBy({ _id: id })
  }

  public async findOneByName(name: string, ignoreId: ObjectId = undefined): Promise<Category | null> {
    const where = { name }

    if (ignoreId) {
      where['_id'] = { $ne: ignoreId }
    }

    return await this.findOneBy(where)
  }
}