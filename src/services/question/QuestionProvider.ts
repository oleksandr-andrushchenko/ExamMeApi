import { Inject, Service } from 'typedi'
import Category from '../../entities/Category'
import { ObjectId } from 'mongodb'
import ValidatorInterface from '../validator/ValidatorInterface'
import Question from '../../entities/Question'
import QuestionRepository from '../../repositories/QuestionRepository'
import QuestionNotFoundError from '../../errors/question/QuestionNotFoundError'
import Cursor from '../../models/Cursor'
import GetQuestions from '../../schema/question/GetQuestions'
import PaginatedQuestions from '../../schema/question/PaginatedQuestions'

@Service()
export default class QuestionProvider {

  public constructor(
    @Inject() private readonly questionRepository: QuestionRepository,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
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

    if ('category' in getQuestions) {
      where['categoryId'] = new ObjectId(getQuestions.category)
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
    getQuestions.category = category.id.toString()

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
}