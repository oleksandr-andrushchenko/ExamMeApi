import { Inject, Service } from 'typedi'
import Category from '../../entities/Category'
import LoggerInterface from '../../services/logger/LoggerInterface'
import EventSubscriber from '../../decorators/EventSubscriber'
import EventSubscriberInterface from '../../services/event/EventSubscriberInterface'

@Service()
@EventSubscriber('categoryCreated')
export default class CategoryCreatedEventSubscriber implements EventSubscriberInterface {

  public constructor(
    @Inject('logger') private readonly logger: LoggerInterface,
  ) {
  }

  public handle({ category }: { category: Category }): void {
    this.logger.info('categoryCreated', { category })
  }
}