import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Category from '../../entities/Category'
import User from '../../entities/User'
import AuthService from '../auth/AuthService'
import { ObjectId } from 'mongodb'
import ValidatorInterface from '../validator/ValidatorInterface'
import Question from '../../entities/Question'
import CreateQuestion from '../../schema/question/CreateQuestion'
import QuestionRepository from '../../repositories/QuestionRepository'
import QuestionTitleTakenError from '../../errors/question/QuestionTitleTakenError'
import CategoryService from '../category/CategoryService'
import QuestionNotFoundError from '../../errors/question/QuestionNotFoundError'
import UpdateQuestion from '../../schema/question/UpdateQuestion'
import Cursor from '../../models/Cursor'
import GetQuestions from '../../schema/question/GetQuestions'
import QuestionPermission from '../../enums/question/QuestionPermission'
import PaginatedQuestions from '../../schema/question/PaginatedQuestions'
import QuestionType from '../../entities/question/QuestionType'

@Service()
export default class QuestionService {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly categoryService: CategoryService,
    @Inject() private readonly questionRepository: QuestionRepository,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject() private readonly authService: AuthService,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }


  /**
   * @param {CreateQuestion} createQuestion
   * @param {User} initiator
   * @returns {Promise<Question>}
   * @throws {CategoryNotFoundError}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionTitleTakenError}
   */
  public async createQuestion(createQuestion: CreateQuestion, initiator: User): Promise<Question> {
    await this.validator.validate(createQuestion)
    await this.authService.verifyAuthorization(initiator, QuestionPermission.Create)

    const category = await this.categoryService.getCategory(createQuestion.categoryId)

    const title = createQuestion.title
    await this.verifyQuestionTitleNotExists(title)

    const question: Question = new Question()
    question.categoryId = category.id
    question.type = createQuestion.type
    question.difficulty = createQuestion.difficulty
    question.title = title
    question.creatorId = initiator.id
    question.ownerId = initiator.id

    if (question.type === QuestionType.CHOICE) {
      question.choices = createQuestion.choices
    }

    question.createdAt = new Date()
    category.questionCount = (category.questionCount ?? 0) + 1

    await this.entityManager.save([ question, category ])

    this.eventDispatcher.dispatch('questionCreated', { question })

    return question
  }

  /**
   * @param {GetQuestions} getQuestions
   * @param {boolean} meta
   * @returns {Promise<Question[] | PaginatedQuestions>}
   * @throws {ValidatorError}
   */
  public async getQuestions(
    getQuestions: GetQuestions,
    meta: boolean = false,
  ): Promise<Question[] | PaginatedQuestions> {
    await this.validator.validate(getQuestions)

    const cursor = new Cursor<Question>(getQuestions, this.questionRepository)

    const where = {}

    if ('categoryId' in getQuestions) {
      where['categoryId'] = new ObjectId(getQuestions.categoryId)
    }

    if ('price' in getQuestions) {
      where['price'] = getQuestions.price
    }

    if ('search' in getQuestions) {
      where['title'] = { $regex: getQuestions.search, $options: 'i' }
    }

    if ('difficulty' in getQuestions) {
      where['difficulty'] = getQuestions.difficulty
    }

    if ('type' in getQuestions) {
      where['type'] = getQuestions.type
    }

    return await cursor.getPaginated({ where, meta })
  }

  /**
   * @param {Category} category
   * @param {GetQuestions} getQuestions
   * @param {boolean} meta
   * @returns {Promise<Question[] | PaginatedQuestions>}
   * @throws {ValidatorError}
   */
  public async getCategoryQuestions(
    category: Category,
    getQuestions: GetQuestions = undefined,
    meta: boolean = false,
  ): Promise<Question[] | PaginatedQuestions> {
    getQuestions = getQuestions === undefined ? new GetQuestions() : getQuestions
    getQuestions.categoryId = category.id.toString()

    return this.getQuestions(getQuestions, meta)
  }

  /**
   * @param {ObjectId | string} id
   * @param {ObjectId | string} categoryId
   * @returns {Promise<Question>}
   * @throws {QuestionNotFoundError}
   */
  public async getQuestion(id: ObjectId | string, categoryId: ObjectId | string = undefined): Promise<Question> {
    if (typeof id === 'string') {
      this.validator.validateId(id)
      id = new ObjectId(id)
    }

    const question = await this.questionRepository.findOneById(id)

    if (!question || (categoryId && question.categoryId.toString() !== categoryId.toString())) {
      throw new QuestionNotFoundError(id)
    }

    return question
  }

  /**
   * @param {Question} question
   * @param {UpdateQuestion} updateQuestion
   * @param {User} initiator
   * @returns {Promise<Question>}
   * @throws {QuestionNotFoundError}
   * @throws {CategoryNotFoundError}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionTitleTakenError}
   */
  public async updateQuestion(question: Question, updateQuestion: UpdateQuestion, initiator: User): Promise<Question> {
    await this.validator.validate(updateQuestion)
    await this.authService.verifyAuthorization(initiator, QuestionPermission.Update, question)

    if ('categoryId' in updateQuestion) {
      const category = await this.categoryService.getCategory(updateQuestion.categoryId)
      question.categoryId = category.id
    }

    if ('title' in updateQuestion) {
      const title = updateQuestion.title
      await this.verifyQuestionTitleNotExists(title, question.id)
      question.title = title
    }

    if ('type' in updateQuestion) {
      question.type = updateQuestion.type
    }

    if ('difficulty' in updateQuestion) {
      question.difficulty = updateQuestion.difficulty
    }

    if (question.type === QuestionType.CHOICE) {
      if ('choices' in updateQuestion) {
        question.choices = updateQuestion.choices
      }
    }

    question.updatedAt = new Date()

    await this.entityManager.save<Question>(question)

    this.eventDispatcher.dispatch('questionUpdated', { question })

    return question
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

  /**
   * @param {string} title
   * @param {ObjectId} ignoreId
   * @returns {Promise<void>}
   * @throws {QuestionTitleTakenError}
   */
  public async verifyQuestionTitleNotExists(title: string, ignoreId: ObjectId = undefined): Promise<void> {
    const question = await this.questionRepository.findOneByTitle(title)

    if (!question) {
      return
    }

    if (ignoreId && question.id.toString() === ignoreId.toString()) {
      return
    }

    throw new QuestionTitleTakenError(title)
  }

  /**
   * @param {number} choice
   * @param {Question} question
   * @returns {boolean}
   * @throws {QuestionTypeError}
   */
  public checkChoice(choice: number, question: Question): boolean {
    // if (question.type !== QuestionType.CHOICE) {
    //   throw new QuestionTypeError(question.type)
    // }

    return (question.choices || [])[choice]?.correct
  }
}