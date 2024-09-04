import Category from '../entities/category/Category'
import Repository from '../decorators/Repository'
import EntityRepository from './EntityRepository'
import User from '../entities/user/User'
import RatingMark from '../entities/rating/RatingMark'
import { RatingMarkTargetType } from '../types/rating/RatingMarkTargetType'
import { RatingMarkTargetConstructorType } from '../types/rating/RatingMarkTargetConstructorType'

@Repository(RatingMark)
export default class RatingMarkRepository extends EntityRepository<RatingMark> {

  public async countByTarget(target: RatingMarkTargetType): Promise<number> {
    return await this.countBy({ [`${ target.constructor.name.toLowerCase() }Id`]: target.id })
  }

  public async sumByTarget(target: RatingMarkTargetType): Promise<number> {
    return await this.sumBy('mark', { [`${ target.constructor.name.toLowerCase() }Id`]: target.id })
  }

  public async findWithTargetByCreator(targetConstructor: RatingMarkTargetConstructorType, creator: User): Promise<RatingMark[]> {
    return await this.findBy({
      creatorId: creator.id,
      [`${ targetConstructor.name.toLowerCase() }Id`]: { $exists: true },
    })
  }

  public async findWithCategoryByCreator(creator: User): Promise<RatingMark[]> {
    return await this.findBy({
      creatorId: creator.id,
      categoryId: { $exists: true },
    })
  }

  public async findByCategoriesAndCreator(categories: Category[], creator: User): Promise<RatingMark[]> {
    return await this.findBy({
      categoryId: { $in: categories.map(category => category.id) },
      creatorId: creator.id,
    })
  }

  public async findOneByTargetAndCreator(target: RatingMarkTargetType, creator: User): Promise<RatingMark | null> {
    return await this.findOneBy({
      [`${ target.constructor.name.toLowerCase() }Id`]: target.id,
      creatorId: creator.id,
    })
  }
}