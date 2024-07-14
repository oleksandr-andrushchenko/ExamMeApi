import Category from '../entities/Category'
import Repository from '../decorators/Repository'
import { ObjectId } from 'mongodb'
import EntityRepository from './EntityRepository'

@Repository(Category)
export default class CategoryRepository extends EntityRepository<Category> {

  public async findOneByName(name: string): Promise<Category | null> {
    return await this.findOneBy({ name })
  }
}