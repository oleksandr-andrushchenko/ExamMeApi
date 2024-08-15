import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import RatingMarkRepository from '../../repositories/RatingMarkRepository'
import UserRepository from '../../repositories/UserRepository'

@Service()
export default class UserCategoryRatingMarksSyncer {

  public constructor(
    @Inject() private readonly ratingMarkRepository: RatingMarkRepository,
    @Inject() private readonly userRepository: UserRepository,
  ) {
  }

  public async syncUserCategoryRatingMarks(user: User): Promise<User> {
    const ratingMarks = await this.ratingMarkRepository.findWithCategoryByCreator(user)

    const categoryRatingMarks = []

    for (let index = 0; index < 5; index++) {
      categoryRatingMarks[index] = []
    }

    for (const ratingMark of ratingMarks) {
      categoryRatingMarks[ratingMark.mark - 1].push(ratingMark.categoryId)
    }

    await this.userRepository.updateOneByEntity(user, { categoryRatingMarks, updatedAt: new Date() })

    return user
  }
}