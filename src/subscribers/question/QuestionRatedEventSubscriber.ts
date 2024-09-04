import { Inject, Service } from 'typedi'
import EventSubscriber from '../../decorators/EventSubscriber'
import EventSubscriberInterface from '../../services/event/EventSubscriberInterface'
import User from '../../entities/user/User'
import QuestionEvent from '../../enums/question/QuestionEvent'
import Question from '../../entities/question/Question'
import QuestionRatingSyncer from '../../services/question/QuestionRatingSyncer'
import UserCategoryRatingMarksSyncer from '../../services/user/UserCategoryRatingMarksSyncer'

@Service()
@EventSubscriber(QuestionEvent.Rated)
export default class QuestionRatedEventSubscriber implements EventSubscriberInterface {

  public constructor(
    @Inject() private readonly userCategoryRatingMarksSyncer: UserCategoryRatingMarksSyncer,
    @Inject() private readonly questionRatingSyncer: QuestionRatingSyncer,
  ) {
  }

  public async handle({ question, user }: { question: Question, user: User }): Promise<void> {
    await this.userCategoryRatingMarksSyncer.syncUserCategoryRatingMarks(user, Question)
    await this.questionRatingSyncer.syncQuestionRating(question)
  }
}