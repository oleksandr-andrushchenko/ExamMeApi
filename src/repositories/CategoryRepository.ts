import Category from '../entities/Category'
import Repository from '../decorators/Repository'
import { ObjectId } from 'mongodb'
import EntityRepository from './EntityRepository'

@Repository(Category)
export default class CategoryRepository extends EntityRepository<Category> {

  public async findOneByName(name: string, ignoreId: ObjectId = undefined): Promise<Category | null> {
    const where = { name }

    if (ignoreId) {
      where['_id'] = { $ne: ignoreId }
    }

    return await this.findOneBy(where)
  }
}