import { MongoRepository } from 'typeorm'
import Category from '../entity/Category'
import Repository from '../decorator/Repository'
import { ObjectId } from 'mongodb'
import Cursor from '../model/Cursor'

@Repository(Category)
export default class CategoryRepository extends MongoRepository<Category> {

  public async findOneById(id: string): Promise<Category | undefined> {
    return await this.findOneBy({ _id: new ObjectId(id) })
  }

  public async findOneByName(name: string, ignoreId: ObjectId = undefined): Promise<Category | undefined> {
    const where = { name }

    if (ignoreId) {
      where['_id'] = { $ne: ignoreId }
    }

    return await this.findOneBy(where)
  }

  public async findAll(cursor: Cursor<Category> = undefined): Promise<Category[]> {
    return await this.find(cursor?.getWhere() || {})
  }
}