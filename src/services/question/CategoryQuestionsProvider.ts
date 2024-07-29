import { Inject, Service } from 'typedi'
import Category from '../../entities/Category'
import Question from '../../entities/Question'
import GetQuestions from '../../schema/question/GetQuestions'
import PaginatedQuestions from '../../schema/question/PaginatedQuestions'
import QuestionsProvider from './QuestionsProvider'
import User from '../../entities/User'

@Service()
export default class CategoryQuestionsProvider {

  public constructor(
    @Inject() private readonly questionsProvider: QuestionsProvider,
  ) {
  }

  /**
   * @param {Category} category
   * @param {GetQuestions} getQuestions
   * @param {boolean} meta
   * @param {User} initiator
   * @returns {Promise<Question[] | PaginatedQuestions>}
   * @throws {ValidatorError}
   */
  public async getCategoryQuestions(
    category: Category,
    getQuestions: GetQuestions = undefined,
    meta: boolean = false,
    initiator?: User,
  ): Promise<Question[] | PaginatedQuestions> {
    getQuestions = getQuestions === undefined ? new GetQuestions() : getQuestions
    getQuestions.category = category.id.toString()

    return this.questionsProvider.getQuestions(getQuestions, meta, initiator)
  }
}