import { Service } from 'typedi'
import Category from '../../entities/category/Category'
import RatingSchema from '../../schema/rating/RatingSchema'
import User from '../../entities/user/User'

@Service()
export default class CategoryRatingProvider {

  public getCategoryRating(category: Category, initiator: User): RatingSchema | undefined {
    if (!category.rating) {
      return undefined
    }

    const rating = new RatingSchema()

    rating.averageMark = category.rating.averageMark
    rating.markCount = category.rating.markCount

    if (initiator.categoryRatingMarks) {
      const ratingMarks = initiator.categoryRatingMarks
      const objectId = category.id

      if (Array.isArray(ratingMarks)) {
        for (let index = 0; index < 5; index++) {
          const ratingMarkArray = ratingMarks[index]

          if (Array.isArray(ratingMarkArray) && ratingMarkArray.includes(objectId)) {
            rating.mark = index + 1
            break
          }
        }
      }
    }

    return rating
  }
}