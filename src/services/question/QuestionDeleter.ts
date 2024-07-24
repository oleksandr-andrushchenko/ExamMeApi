import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import User from '../../entities/User'
import Question from '../../entities/Question'
import CategoryProvider from '../category/CategoryProvider'
import QuestionPermission from '../../enums/question/QuestionPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import QuestionRepository from '../../repositories/QuestionRepository'
import CategoryRepository from '../../repositories/CategoryRepository'

@Service()
export default class QuestionDeleter {

  public constructor(
    @Inject() private readonly categoryProvider: CategoryProvider,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject() private readonly questionRepository: QuestionRepository,
    @Inject() private readonly categoryRepository: CategoryRepository,
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

    await this.questionRepository.updateOneByEntity(question, { deletedAt: new Date() })

    const newQuestionCount = Math.max(0, await this.questionRepository.countByCategory(category) - 1)
    await this.categoryRepository.updateOneByEntity(category, {
      questionCount: newQuestionCount === 0 ? undefined : newQuestionCount,
      updatedAt: new Date(),
    })

    this.eventDispatcher.dispatch('questionDeleted', { question })

    return question
  }
}