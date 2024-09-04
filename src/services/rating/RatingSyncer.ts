import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Rating from '../../entities/rating/Rating'
import RatingMarkRepository from '../../repositories/RatingMarkRepository'
import { RatingMarkTargetType } from '../../types/rating/RatingMarkTargetType'

@Service()
export default class RatingSyncer {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly ratingMarkRepository: RatingMarkRepository,
  ) {
  }

  public async syncRating(target: RatingMarkTargetType): Promise<RatingMarkTargetType> {
    const markCount = await this.ratingMarkRepository.countByTarget(target)
    const markSum = await this.ratingMarkRepository.sumByTarget(target)

    target.rating = new Rating()
    target.rating.markCount = markCount
    target.rating.averageMark = markSum / markCount
    target.updatedAt = new Date()

    await this.entityManager.save(target)

    return target
  }
}