import { Inject, Service } from 'typedi'
import EventSubscriber from '../../decorators/EventSubscriber'
import EventSubscriberInterface from '../../services/event/EventSubscriberInterface'
import User from '../../entities/user/User'
import QuestionEvent from '../../enums/question/QuestionEvent'
import Question from '../../entities/question/Question'
import UserRatingMarksSyncer from '../../services/user/UserRatingMarksSyncer'
import RatingSyncer from '../../services/rating/RatingSyncer'

@Service()
@EventSubscriber(QuestionEvent.Rated)
export default class QuestionRatedEventSubscriber implements EventSubscriberInterface {

  public constructor(
    @Inject() private readonly userRatingMarksSyncer: UserRatingMarksSyncer,
    @Inject() private readonly ratingSyncer: RatingSyncer,
  ) {
  }

  public async handle({ question, user }: { question: Question, user: User }): Promise<void> {
    await this.userRatingMarksSyncer.syncUserRatingMarks(user, Question)
    await this.ratingSyncer.syncRating(question)
  }
}