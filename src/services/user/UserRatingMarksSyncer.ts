import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import RatingMarkRepository from '../../repositories/RatingMarkRepository'
import UserRepository from '../../repositories/UserRepository'
import { RatingMarkTargetConstructorType } from '../../types/rating/RatingMarkTargetConstructorType'

@Service()
export default class UserRatingMarksSyncer {

  public constructor(
    @Inject() private readonly ratingMarkRepository: RatingMarkRepository,
    @Inject() private readonly userRepository: UserRepository,
  ) {
  }

  public async syncUserRatingMarks(user: User, targetConstructor: RatingMarkTargetConstructorType): Promise<User> {
    const ratingMarks = await this.ratingMarkRepository.findWithTargetByCreator(targetConstructor, user)

    const ratingMarkArray = []

    for (let index = 0; index < 5; index++) {
      ratingMarkArray[index] = []
    }

    for (const ratingMark of ratingMarks) {
      ratingMarkArray[ratingMark.mark - 1].push(ratingMark.questionId)
    }

    await this.userRepository.updateRatingMarks(user, targetConstructor, ratingMarkArray, { updatedAt: new Date() })

    return user
  }
}