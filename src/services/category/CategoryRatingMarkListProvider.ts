import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import Category from '../../entities/category/Category'
import RatingMark from '../../entities/rating/RatingMark'
import RatingMarkRepository from '../../repositories/RatingMarkRepository'

@Service()
export default class CategoryRatingMarkListProvider {

  public constructor(
    @Inject() private readonly ratingMarkRepository: RatingMarkRepository,
  ) {
  }

  /**
   * @param {Category[]} categories
   * @param {User} initiator
   * @returns {Promise<Exam[]>}
   */
  public async getCategoryRatingMarks(categories: Category[], initiator: User): Promise<RatingMark[]> {
    return await this.ratingMarkRepository.findByCategoriesAndCreator(categories, initiator)
  }
}