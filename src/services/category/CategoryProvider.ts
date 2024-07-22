import { Inject, Service } from 'typedi'
import Category from '../../entities/Category'
import CategoryRepository from '../../repositories/CategoryRepository'
import CategoryNotFoundError from '../../errors/category/CategoryNotFoundError'
import { ObjectId } from 'mongodb'
import ValidatorInterface from '../validator/ValidatorInterface'
import Cursor from '../../models/Cursor'
import GetCategories from '../../schema/category/GetCategories'
import PaginatedCategories from '../../schema/category/PaginatedCategories'

@Service()
export default class CategoryProvider {

  public constructor(
    @Inject() private readonly categoryRepository: CategoryRepository,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {ObjectId | string} id
   * @returns {Promise<Category>}
   * @throws {CategoryNotFoundError}
   */
  public async getCategory(id: ObjectId | string): Promise<Category> {
    if (typeof id === 'string') {
      this.validator.validateId(id)
      id = new ObjectId(id)
    }

    const category = await this.categoryRepository.findOneById(id)

    if (!category) {
      throw new CategoryNotFoundError(id)
    }

    return category
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