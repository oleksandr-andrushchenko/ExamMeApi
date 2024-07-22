import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/User'
import Question from '../../entities/Question'
import CategoryProvider from '../category/CategoryProvider'
import QuestionPermission from '../../enums/question/QuestionPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class QuestionDeleter {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly categoryProvider: CategoryProvider,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {Question} question
   * @param {User} initiator
   * @returns {Promise<Question>}
   * @throws {QuestionNotFoundError}
   * @throws {AuthorizationFailedError}
   */
  public async deleteQuestion(question: Question, initiator: User): Promise<Question> {
    await this.authorizationVerifier.verifyAuthorization(initiator, QuestionPermission.Delete, question)

    const category = await this.categoryProvider.getCategory(question.categoryId.toString())
    category.questionCount = Math.max(0, (category.questionCount ?? 0) - 1)

    question.deletedAt = new Date()

    await this.entityManager.save([ question, category ])
    this.eventDispatcher.dispatch('questionDeleted', { question })

    return question
  }
}