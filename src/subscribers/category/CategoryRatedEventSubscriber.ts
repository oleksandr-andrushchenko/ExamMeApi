import { Inject, Service } from 'typedi'
import Category from '../../entities/category/Category'
import EventSubscriber from '../../decorators/EventSubscriber'
import EventSubscriberInterface from '../../services/event/EventSubscriberInterface'
import CategoryEvent from '../../enums/category/CategoryEvent'
import CategoryActivityCreator from '../../services/category/CategoryActivityCreator'
import User from '../../entities/user/User'
import UserRatingMarksSyncer from '../../services/user/UserRatingMarksSyncer'
import RatingSyncer from '../../services/rating/RatingSyncer'

@Service()
@EventSubscriber(CategoryEvent.Rated)
export default class CategoryRatedEventSubscriber implements EventSubscriberInterface {

  public constructor(
    @Inject() private readonly categoryActivityCreator: CategoryActivityCreator,
    @Inject() private readonly userRatingMarksSyncer: UserRatingMarksSyncer,
    @Inject() private readonly ratingSyncer: RatingSyncer,
  ) {
  }

  public async handle({ category, user }: { category: Category, user: User }): Promise<void> {
    await this.categoryActivityCreator.createCategoryActivity(category, CategoryEvent.Rated)
    await this.userRatingMarksSyncer.syncUserRatingMarks(user, Category)
    await this.ratingSyncer.syncRating(category)
  }
}