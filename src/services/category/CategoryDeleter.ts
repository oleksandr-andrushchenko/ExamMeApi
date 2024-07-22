import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Category from '../../entities/Category'
import User from '../../entities/User'
import AuthService from '../auth/AuthService'
import CategoryPermission from '../../enums/category/CategoryPermission'
import QuestionDeleter from '../question/QuestionDeleter'
import QuestionService from '../question/QuestionService'
import Question from '../../entities/Question'

@Service()
export default class CategoryDeleter {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject() private readonly questionService: QuestionService,
    @Inject() private readonly questionDeleter: QuestionDeleter,
    @Inject() private readonly authService: AuthService,
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
    await this.authService.verifyAuthorization(initiator, CategoryPermission.Delete, category)

    const questions = await this.questionService.getCategoryQuestions(category) as Question[]

    for (const question of questions) {
      await this.questionDeleter.deleteQuestion(question, initiator)
    }

    category.deletedAt = new Date()

    await this.entityManager.save<Category>(category)

    this.eventDispatcher.dispatch('categoryDeleted', { category })

    return category
  }
}