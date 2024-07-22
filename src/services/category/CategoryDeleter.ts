import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Category from '../../entities/Category'
import User from '../../entities/User'
import CategoryPermission from '../../enums/category/CategoryPermission'
import QuestionDeleter from '../question/QuestionDeleter'
import QuestionProvider from '../question/QuestionProvider'
import Question from '../../entities/Question'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class CategoryDeleter {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject() private readonly questionProvider: QuestionProvider,
    @Inject() private readonly questionDeleter: QuestionDeleter,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {Category} category
   * @param {User} initiator
   * @returns {Promise<Category>}
   * @throws {CategoryNotFoundError}
   * @throws {AuthorizationFailedError}
   */
  public async deleteCategory(category: Category, initiator: User): Promise<Category> {
    await this.authorizationVerifier.verifyAuthorization(initiator, CategoryPermission.Delete, category)

    const questions = await this.questionProvider.getCategoryQuestions(category) as Question[]

    for (const question of questions) {
      await this.questionDeleter.deleteQuestion(question, initiator)
    }

    category.deletedAt = new Date()

    await this.entityManager.save<Category>(category)
    this.eventDispatcher.dispatch('categoryDeleted', { category })

    return category
  }
}