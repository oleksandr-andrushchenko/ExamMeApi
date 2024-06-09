import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Category from '../../entities/Category'
import User from '../../entities/User'
import AuthService from '../auth/AuthService'
import { ObjectId } from 'mongodb'
import ValidatorInterface from '../validator/ValidatorInterface'
import Question from '../../entities/Question'
import QuestionSchema from '../../schema/question/QuestionSchema'
import QuestionRepository from '../../repositories/QuestionRepository'
import QuestionTitleTakenError from '../../errors/question/QuestionTitleTakenError'
import CategoryService from '../category/CategoryService'
import QuestionNotFoundError from '../../errors/question/QuestionNotFoundError'
import QuestionUpdateSchema from '../../schema/question/QuestionUpdateSchema'
import Cursor from '../../models/Cursor'
import QuestionQuerySchema from '../../schema/question/QuestionQuerySchema'
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
   * @param {QuestionSchema} transfer
   * @param {User} initiator
   * @returns {Promise<Question>}
   * @throws {CategoryNotFoundError}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionTitleTakenError}
   */
  public async createQuestion(transfer: QuestionSchema, initiator: User): Promise<Question> {
    await this.validator.validate(transfer)
    await this.authService.verifyAuthorization(initiator, QuestionPermission.CREATE)

    const category = await this.categoryService.getCategory(transfer.categoryId)

    const title = transfer.title
    await this.verifyQuestionTitleNotExists(title)

    const question: Question = new Question()
    question.categoryId = category.id
    question.type = transfer.type
    question.difficulty = transfer.difficulty
    question.title = title
    question.creatorId = initiator.id
    question.ownerId = initiator.id

    if (question.type === QuestionType.TYPE) {
      question.answers = transfer.answers
    } else if (question.type === QuestionType.CHOICE) {
      question.choices = transfer.choices
    }

    question.createdAt = new Date()
    category.questionCount = (category.questionCount ?? 0) + 1

    await this.entityManager.save([ question, category ])

    this.eventDispatcher.dispatch('questionCreated', { question })

    return question
  }

  /**
   * @param {QuestionQuerySchema} query
   * @param {boolean} meta
   * @returns {Promise<Question[] | PaginatedQuestions>}
   * @throws {ValidatorError}
   */
  public async queryQuestions(
    query: QuestionQuerySchema,
    meta: boolean = false,
  ): Promise<Question[] | PaginatedQuestions> {
    await this.validator.validate(query)

    const cursor = new Cursor<Question>(query, this.questionRepository)

    const where = {}

    if ('categoryId' in query) {
      where['categoryId'] = new ObjectId(query.categoryId)
    }

    if ('price' in query) {
      where['price'] = query.price
    }

    if ('search' in query) {
      where['title'] = { $regex: query.search, $options: 'i' }
    }

    if ('difficulty' in query) {
      where['difficulty'] = query.difficulty
    }

    if ('type' in query) {
      where['type'] = query.type
    }

    return await cursor.getPaginated(where, meta)
  }

  /**
   * @param {Category} category
   * @param {QuestionQuerySchema} query
   * @param {boolean} meta
   * @returns {Promise<Question[] | PaginatedQuestions>}
   * @throws {ValidatorError}
   */
  public async queryCategoryQuestions(
    category: Category,
    query: QuestionQuerySchema = undefined,
    meta: boolean = false,
  ): Promise<Question[] | PaginatedQuestions> {
    query = query === undefined ? new QuestionQuerySchema() : query
    query.categoryId = category.id.toString()

    return this.queryQuestions(query, meta)
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
   * @param {QuestionUpdateSchema} transfer
   * @param {User} initiator
   * @returns {Promise<Question>}
   * @throws {QuestionNotFoundError}
   * @throws {CategoryNotFoundError}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionTitleTakenError}
   */
  public async updateQuestion(question: Question, transfer: QuestionUpdateSchema, initiator: User): Promise<Question> {
    await this.validator.validate(transfer)
    await this.authService.verifyAuthorization(initiator, QuestionPermission.UPDATE, question)

    if ('categoryId' in transfer) {
      const category = await this.categoryService.getCategory(transfer.categoryId)
      question.categoryId = category.id
    }

    if ('title' in transfer) {
      const title = transfer.title
      await this.verifyQuestionTitleNotExists(title, question.id)
      question.title = title
    }

    if ('type' in transfer) {
      question.type = transfer.type
    }

    if ('difficulty' in transfer) {
      question.difficulty = transfer.difficulty
    }

    if (question.type === QuestionType.TYPE) {
      if ('answers' in transfer) {
        question.answers = transfer.answers
      }
    } else if (question.type === QuestionType.CHOICE) {
      if ('choices' in transfer) {
        question.choices = transfer.choices
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
    await this.authService.verifyAuthorization(initiator, QuestionPermission.DELETE, question)

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
    if (await this.questionRepository.findOneByTitle(title, ignoreId)) {
      throw new QuestionTitleTakenError(title)
    }
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

  /**
   * @param {string} answer
   * @param {Question} question
   * @returns {boolean}
   * @throws {QuestionTypeError}
   */
  public checkAnswer(answer: string, question: Question): boolean {
    // if (question.type !== QuestionType.TYPE) {
    //   throw new QuestionTypeError(question.type)
    // }

    for (const questionAnswer of (question.answers || [])) {
      if (questionAnswer?.correct) {
        return questionAnswer.variants.indexOf(answer) !== -1
      }
    }

    return false
  }
}