import { Inject, Service } from 'typedi'
import EventSubscriber from '../../decorators/EventSubscriber'
import EventSubscriberInterface from '../../services/event/EventSubscriberInterface'
import User from '../../entities/user/User'
import QuestionEvent from '../../enums/question/QuestionEvent'
import UserQuestionRatingMarksSyncer from '../../services/user/UserQuestionRatingMarksSyncer'
import QuestionRatingSyncer from '../../services/question/QuestionRatingSyncer'
import Question from '../../entities/question/Question'

@Service()
@EventSubscriber(QuestionEvent.Rated)
export default class QuestionRatedEventSubscriber implements EventSubscriberInterface {

  public constructor(
    @Inject() private readonly userQuestionRatingMarksSyncer: UserQuestionRatingMarksSyncer,
    @Inject() private readonly questionRatingSyncer: QuestionRatingSyncer,
  ) {
  }

  public async handle({ question, user }: { question: Question, user: User }): Promise<void> {
    await this.userQuestionRatingMarksSyncer.syncUserQuestionRatingMarks(user)
    await this.questionRatingSyncer.syncQuestionRating(question)
  }
}