import { Inject, Service } from 'typedi'
import Category from '../../entities/category/Category'
import RatingSchema from '../../schema/rating/RatingSchema'
import User from '../../entities/user/User'
import UserRatingMarkMarkProvider from '../user/UserRatingMarkMarkProvider'

@Service()
export default class CategoryRatingProvider {

  public constructor(
    @Inject() private readonly userRatingMarkMarkProvider: UserRatingMarkMarkProvider,
  ) {
  }

  public getCategoryRating(category: Category, initiator: User): RatingSchema | undefined {
    if (!category.rating) {
      return undefined
    }

    const rating = new RatingSchema()

    rating.averageMark = category.rating.averageMark
    rating.markCount = category.rating.markCount
    rating.mark = this.userRatingMarkMarkProvider.getUserRatingMarkMark(initiator.categoryRatingMarks, category.id)

    return rating
  }
}