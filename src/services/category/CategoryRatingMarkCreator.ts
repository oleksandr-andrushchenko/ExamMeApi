import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import Category from '../../entities/category/Category'
import CategoryPermission from '../../enums/category/CategoryPermission'
import EventDispatcher from '../event/EventDispatcher'
import CategoryEvent from '../../enums/category/CategoryEvent'
import RatingMark from '../../entities/rating/RatingMark'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import RatingMarkRepository from '../../repositories/RatingMarkRepository'
import CategoryRatedAlready from '../../errors/category/CategoryRatedAlready'

@Service()
export default class CategoryRatingMarkCreator {

  public constructor(
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly ratingMarkRepository: RatingMarkRepository,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
  ) {
  }

  /**
   * @param {Category} category
   * @param {number} mark
   * @param {User} initiator
   * @returns {Promise<Category>}
   * @throws {AuthorizationFailedError}
   */
  public async createCategoryRatingMark(category: Category, mark: number, initiator: User): Promise<Category> {
    await this.authorizationVerifier.verifyAuthorization(initiator, CategoryPermission.Rate, category)

    const existingRatingMark = await this.ratingMarkRepository.findOneByCategoryAndCreator(category, initiator)

    if (existingRatingMark) {
      throw new CategoryRatedAlready(category)
    }

    const ratingMark = new RatingMark()
    ratingMark.categoryId = category.id
    ratingMark.mark = mark
    ratingMark.creatorId = initiator.id
    ratingMark.createdAt = new Date()

    await this.entityManager.save<RatingMark>(ratingMark)
    this.eventDispatcher.dispatch(CategoryEvent.Rated, { category, user: initiator })

    return category
  }
}