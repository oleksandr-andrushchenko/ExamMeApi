import Category from '../entities/category/Category'
import Repository from '../decorators/Repository'
import EntityRepository from './EntityRepository'
import User from '../entities/user/User'
import RatingMark from '../entities/rating/RatingMark'

@Repository(RatingMark)
export default class RatingMarkRepository extends EntityRepository<RatingMark> {

  public async findOneByCategoryAndCreator(category: Category, creator: User): Promise<RatingMark | null> {
    return await this.findOneBy({ categoryId: category.id, creatorId: creator.id })
  }

  public async countByCategory(category: Category): Promise<number> {
    return await this.count({ categoryId: category.id })
  }

  public async sumByCategory(category: Category): Promise<number> {
    return await this.sum('mark', { categoryId: category.id })
  }

  public async findByCreator(creator: User): Promise<RatingMark[]> {
    return await this.findBy({ creatorId: creator.id })
  }
}