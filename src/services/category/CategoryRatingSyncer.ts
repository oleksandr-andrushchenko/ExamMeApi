import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Category from '../../entities/category/Category'
import Rating from '../../entities/rating/Rating'
import RatingMarkRepository from '../../repositories/RatingMarkRepository'

@Service()
export default class CategoryRatingSyncer {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly ratingMarkRepository: RatingMarkRepository,
  ) {
  }

  public async syncCategoryRating(category: Category): Promise<Category> {
    const markCount = await this.ratingMarkRepository.countByCategory(category)
    const markSum = await this.ratingMarkRepository.sumByCategory(category)

    category.rating = new Rating()
    category.rating.markCount = markCount
    category.rating.mark = markSum / markCount
    category.updatedAt = new Date()

    await this.entityManager.save<Category>(category)

    return category
  }
}