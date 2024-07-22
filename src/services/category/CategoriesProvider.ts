import { Inject, Service } from 'typedi'
import Category from '../../entities/Category'
import CategoryRepository from '../../repositories/CategoryRepository'
import ValidatorInterface from '../validator/ValidatorInterface'
import Cursor from '../../models/Cursor'
import GetCategories from '../../schema/category/GetCategories'
import PaginatedCategories from '../../schema/category/PaginatedCategories'

@Service()
export default class CategoriesProvider {

  public constructor(
    @Inject() private readonly categoryRepository: CategoryRepository,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   *
   * @param {GetCategories} getCategories
   * @param {boolean} meta
   * @returns {Promise<Category[] | PaginatedCategories>}
   * @throws {ValidatorError}
   */
  public async getCategories(
    getCategories: GetCategories,
    meta: boolean = false,
  ): Promise<Category[] | PaginatedCategories> {
    await this.validator.validate(getCategories)

    const cursor = new Cursor<Category>(getCategories, this.categoryRepository)

    const where = {}

    if ('price' in getCategories) {
      where['price'] = getCategories.price
    }

    if ('search' in getCategories) {
      where['name'] = { $regex: getCategories.search, $options: 'i' }
    }

    return await cursor.getPaginated({ where, meta })
  }
}