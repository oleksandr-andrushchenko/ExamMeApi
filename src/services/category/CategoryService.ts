import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Category from '../../entities/Category'
import CategoryRepository from '../../repositories/CategoryRepository'
import CategoryNameTakenError from '../../errors/category/CategoryNameTakenError'
import User from '../../entities/User'
import CategoryNotFoundError from '../../errors/category/CategoryNotFoundError'
import CreateCategory from '../../schema/category/CreateCategory'
import AuthService from '../auth/AuthService'
import { ObjectId } from 'mongodb'
import UpdateCategory from '../../schema/category/UpdateCategory'
import ValidatorInterface from '../validator/ValidatorInterface'
import Cursor from '../../models/Cursor'
import GetCategories from '../../schema/category/GetCategories'
import CategoryPermission from '../../enums/category/CategoryPermission'
import PaginatedCategories from '../../schema/category/PaginatedCategories'

@Service()
export default class CategoryService {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly categoryRepository: CategoryRepository,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject() private readonly authService: AuthService,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {CreateCategory} createCategory
   * @param {User} initiator
   * @returns {Promise<Category>}
   * @throws {AuthorizationFailedError}
   * @throws {CategoryNameTakenError}
   */
  public async createCategory(createCategory: CreateCategory, initiator: User): Promise<Category> {
    await this.validator.validate(createCategory)

    await this.authService.verifyAuthorization(initiator, CategoryPermission.CREATE)

    const name = createCategory.name
    await this.verifyCategoryNameNotExists(name)

    const category: Category = new Category()
    category.name = name
    category.requiredScore = createCategory.requiredScore
    category.creatorId = initiator.id
    category.ownerId = initiator.id
    category.createdAt = new Date()

    await this.entityManager.save<Category>(category)

    this.eventDispatcher.dispatch('categoryCreated', { category })

    return category
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

    return await cursor.getPaginated(where, meta)
  }

  /**
   * @param {Category} category
   * @param {UpdateCategory} updateCategory
   * @param {User} initiator
   * @returns {Promise<Category>}
   * @throws {CategoryNotFoundError}
   * @throws {AuthorizationFailedError}
   * @throws {CategoryNameTakenError}
   */
  public async updateCategory(category: Category, updateCategory: UpdateCategory, initiator: User): Promise<Category> {
    await this.validator.validate(updateCategory)

    await this.authService.verifyAuthorization(initiator, CategoryPermission.UPDATE, category)

    if ('name' in updateCategory) {
      const name = updateCategory.name
      await this.verifyCategoryNameNotExists(name, category.id)

      category.name = name
    }

    if ('requiredScore' in updateCategory) {
      category.requiredScore = updateCategory.requiredScore
    }

    category.updatedAt = new Date()

    await this.entityManager.save<Category>(category)

    this.eventDispatcher.dispatch('categoryUpdated', { category })

    return category
  }

  /**
   * @param {Category} category
   * @param {User} initiator
   * @returns {Promise<Category>}
   * @throws {CategoryNotFoundError}
   * @throws {AuthorizationFailedError}
   */
  public async deleteCategory(category: Category, initiator: User): Promise<Category> {
    await this.authService.verifyAuthorization(initiator, CategoryPermission.DELETE, category)

    category.deletedAt = new Date()

    await this.entityManager.save<Category>(category)

    this.eventDispatcher.dispatch('categoryDeleted', { category })

    return category
  }

  /**
   * @param {string} name
   * @param {ObjectId} ignoreId
   * @returns {Promise<void>}
   * @throws {CategoryNameTakenError}
   */
  public async verifyCategoryNameNotExists(name: string, ignoreId: ObjectId = undefined): Promise<void> {
    if (await this.categoryRepository.findOneByName(name, ignoreId)) {
      throw new CategoryNameTakenError(name)
    }
  }
}