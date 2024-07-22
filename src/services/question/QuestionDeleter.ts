import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/User'
import AuthService from '../auth/AuthService'
import Question from '../../entities/Question'
import CategoryService from '../category/CategoryService'
import QuestionPermission from '../../enums/question/QuestionPermission'

@Service()
export default class QuestionDeleter {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly categoryService: CategoryService,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject() private readonly authService: AuthService,
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
    await this.authService.verifyAuthorization(initiator, QuestionPermission.Delete, question)

    const category = await this.categoryService.getCategory(question.categoryId.toString())
    category.questionCount = Math.max(0, (category.questionCount ?? 0) - 1)

    question.deletedAt = new Date()

    await this.entityManager.save([ question, category ])

    this.eventDispatcher.dispatch('questionDeleted', { question })

    return question
  }
}