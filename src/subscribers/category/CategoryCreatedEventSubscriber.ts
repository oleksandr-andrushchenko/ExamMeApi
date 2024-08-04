import { Inject, Service } from 'typedi'
import Category from '../../entities/category/Category'
import LoggerInterface from '../../services/logger/LoggerInterface'
import EventSubscriber from '../../decorators/EventSubscriber'
import EventSubscriberInterface from '../../services/event/EventSubscriberInterface'
import CategoryEvent from '../../enums/category/CategoryEvent'

@Service()
@EventSubscriber(CategoryEvent.Created)
export default class CategoryCreatedEventSubscriber implements EventSubscriberInterface {

  public constructor(
    @Inject('logger') private readonly logger: LoggerInterface,
  ) {
  }

  public handle({ category }: { category: Category }): void {
    this.logger.info(CategoryEvent.Created, { category })
  }
}