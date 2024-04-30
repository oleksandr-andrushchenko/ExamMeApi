import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorator/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorator/InjectEntityManager'
import Category from '../../entity/Category'
import User from '../../entity/User'
import AuthService from '../auth/AuthService'
import { ObjectId } from 'mongodb'
import ValidatorInterface from '../validator/ValidatorInterface'
import Question, { QuestionType } from '../../entity/Question'
import QuestionSchema from '../../schema/question/QuestionSchema'
import QuestionRepository from '../../repository/QuestionRepository'
import QuestionTitleTakenError from '../../error/question/QuestionTitleTakenError'
import CategoryService from '../category/CategoryService'
import QuestionNotFoundError from '../../error/question/QuestionNotFoundError'
import QuestionUpdateSchema from '../../schema/question/QuestionUpdateSchema'
import PaginatedSchema from '../../schema/pagination/PaginatedSchema'
import Cursor from '../../model/Cursor'
import QuestionQuerySchema from '../../schema/question/QuestionQuerySchema'
import QuestionPermission from '../../enum/question/QuestionPermission'
import QuestionTypeError from '../../error/question/QuestionTypeError'

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

    const category: Category = await this.categoryService.getCategory(transfer.category)

    const title = transfer.title
    await this.verifyQuestionTitleNotExists(title)

    const question: Question = (new Question())
      .setCategory(category.getId())
      .setType(transfer.type)
      .setDifficulty(transfer.difficulty)
      .setTitle(title)
      .setCreator(initiator.getId())
      .setOwner(initiator.getId())

    if (question.getType() === QuestionType.TYPE) {
      question
        .setAnswers(transfer.answers)
    } else if (question.getType() === QuestionType.CHOICE) {
      question
        .setChoices(transfer.choices)
    }

    category.setQuestionCount(category.getQuestionCount() + 1)

    await this.entityManager.transaction(async (entityManager: EntityManagerInterface) => {
      await entityManager.save<Question>(question)
      await entityManager.save<Category>(category)
    })

    this.eventDispatcher.dispatch('questionCreated', { question })

    return question
  }

  /**
   * @param {QuestionQuerySchema} query
   * @param {boolean} meta
   * @returns {Promise<Question[] | PaginatedSchema<Question>>}
   * @throws {ValidatorError}
   */
  public async queryQuestions(
    query: QuestionQuerySchema,
    meta: boolean = false,
  ): Promise<Question[] | PaginatedSchema<Question>> {
    await this.validator.validate(query)

    const cursor = new Cursor<Question>(query, this.questionRepository)

    const where = {}

    if (query.category) {
      where['category'] = new ObjectId(query.category)
    }

    if (query.price) {
      where['price'] = query.price
    }

    if (query.search) {
      where['title'] = { $regex: query.search, $options: 'i' }
    }

    if (query.difficulty) {
      where['difficulty'] = query.difficulty
    }

    if (query.type) {
      where['type'] = query.type
    }

    return await cursor.getPaginated(where, meta)
  }

  /**
   * @param {Category} category
   * @param {QuestionQuerySchema} query
   * @param {boolean} meta
   * @returns {Promise<Question[] | PaginatedSchema<Question>>}
   * @throws {ValidatorError}
   */
  public async queryCategoryQuestions(
    category: Category,
    query: QuestionQuerySchema = undefined,
    meta: boolean = false,
  ): Promise<Question[] | PaginatedSchema<Question>> {
    query = query === undefined ? new QuestionQuerySchema() : query
    query.category = category.getId().toString()

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

    const question: Question = await this.questionRepository.findOneById(id)

    if (!question || (categoryId && question.getCategory().toString() !== categoryId.toString())) {
      throw new QuestionNotFoundError(id)
    }

    return question
  }

  /**
   * @param {Question} question
   * @param {QuestionSchema} transfer
   * @param {User} initiator
   * @returns {Promise<Question>}
   * @throws {QuestionNotFoundError}
   * @throws {CategoryNotFoundError}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionTitleTakenError}
   */
  public async replaceQuestion(question: Question, transfer: QuestionSchema, initiator: User): Promise<Question> {
    await this.validator.validate(transfer)
    await this.authService.verifyAuthorization(initiator, QuestionPermission.REPLACE, question)

    const category: Category = await this.categoryService.getCategory(transfer.category)

    const title = transfer.title
    await this.verifyQuestionTitleNotExists(title)

    question
      .setCategory(category.getId())
      .setType(transfer.type)
      .setDifficulty(transfer.difficulty)
      .setTitle(title)

    if (question.getType() === QuestionType.TYPE) {
      question
        .setAnswers(transfer.answers)
    } else if (question.getType() === QuestionType.CHOICE) {
      question
        .setChoices(transfer.choices)
    }
    await this.entityManager.save<Question>(question)

    this.eventDispatcher.dispatch('questionReplaced', { question })

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

    if (transfer.hasOwnProperty('category')) {
      const category: Category = await this.categoryService.getCategory(transfer.category)
      question.setCategory(category.getId())
    }

    if (transfer.hasOwnProperty('title')) {
      const title = transfer.title
      await this.verifyQuestionTitleNotExists(title)
      question.setTitle(title)
    }

    if (transfer.hasOwnProperty('type')) {
      question.setType(transfer.type)
    }

    if (transfer.hasOwnProperty('difficulty')) {
      question.setDifficulty(transfer.difficulty)
    }

    if (question.getType() === QuestionType.TYPE) {
      if (transfer.hasOwnProperty('answers')) {
        question.setAnswers(transfer.answers)
      }
    } else if (question.getType() === QuestionType.CHOICE) {
      if (transfer.hasOwnProperty('choices')) {
        question.setChoices(transfer.choices)
      }
    }

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

    const category: Category = await this.categoryService.getCategory(question.getCategory().toString())
    category.setQuestionCount(category.getQuestionCount() - 1)

    await this.entityManager.transaction(async (entityManager: EntityManagerInterface) => {
      // todo: soft delete
      await entityManager.remove<Question>(question)
      await entityManager.save<Category>(category)
    })

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
    if (question.getType() !== QuestionType.CHOICE) {
      throw new QuestionTypeError(question.getType())
    }

    return question.getChoices()[choice]?.isCorrect()
  }

  /**
   * @param {string} answer
   * @param {Question} question
   * @returns {boolean}
   * @throws {QuestionTypeError}
   */
  public checkAnswer(answer: string, question: Question): boolean {
    if (question.getType() !== QuestionType.TYPE) {
      throw new QuestionTypeError(question.getType())
    }

    for (const questionAnswer of question.getAnswers()) {
      if (questionAnswer.isCorrect()) {
        return questionAnswer.getVariants().indexOf(answer) !== -1
      }
    }

    return false
  }
}