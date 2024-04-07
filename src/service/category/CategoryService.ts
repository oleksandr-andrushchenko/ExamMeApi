import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorator/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorator/InjectEntityManager'
import Category from '../../entity/Category'
import CategoryRepository from '../../repository/CategoryRepository'
import CategoryNameTakenError from '../../error/category/CategoryNameTakenError'
import User from '../../entity/User'
import CategoryNotFoundError from '../../error/category/CategoryNotFoundError'
import CategorySchema from '../../schema/category/CategorySchema'
import AuthService from '../auth/AuthService'
import { ObjectId } from 'mongodb'
import CategoryUpdateSchema from '../../schema/category/CategoryUpdateSchema'
import ValidatorInterface from '../validator/ValidatorInterface'
import Cursor from '../../model/Cursor'
import PaginatedSchema from '../../schema/pagination/PaginatedSchema'
import CategoryQuerySchema from '../../schema/category/CategoryQuerySchema'
import CategoryPermission from '../../enum/category/CategoryPermission'

@Service()
export default class CategoryService {

  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly categoryRepository: CategoryRepository,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject() private readonly authService: AuthService,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {CategorySchema} transfer
   * @param {User} initiator
   * @returns {Promise<Category>}
   * @throws {AuthorizationFailedError}
   * @throws {CategoryNameTakenError}
   */
  public async createCategory(transfer: CategorySchema, initiator: User): Promise<Category> {
    await this.validator.validate(transfer)

    await this.authService.verifyAuthorization(initiator, CategoryPermission.CREATE)

    const name = transfer.name
    await this.verifyCategoryNameNotExists(name)

    const category: Category = (new Category())
      .setName(name)
      .setRequiredScore(transfer.requiredScore)
      .setCreator(initiator.getId())
      .setOwner(initiator.getId())

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

    const category: Category = await this.categoryRepository.findOneById(id)

    if (!category) {
      throw new CategoryNotFoundError(id)
    }

    return category
  }

  /**
   *
   * @param {CategoryQuerySchema} query
   * @param {boolean} meta
   * @returns {Promise<Category[] | PaginatedSchema<Category>>}
   * @throws {ValidatorError}
   */
  public async queryCategories(
    query: CategoryQuerySchema,
    meta: boolean = false,
  ): Promise<Category[] | PaginatedSchema<Category>> {
    await this.validator.validate(query)

    const cursor = new Cursor<Category>(query, this.categoryRepository)

    const where = {}

    if (query.price) {
      where['price'] = query.price
    }

    if (query.search) {
      where['name'] = { $regex: query.search, $options: 'i' }
    }

    return await cursor.getPaginated(where, meta)
  }

  /**
   * @param {Category} category
   * @param {CategoryUpdateSchema} transfer
   * @param {User} initiator
   * @returns {Promise<Category>}
   * @throws {CategoryNotFoundError}
   * @throws {AuthorizationFailedError}
   * @throws {CategoryNameTakenError}
   */
  public async updateCategory(category: Category, transfer: CategoryUpdateSchema, initiator: User): Promise<Category> {
    await this.validator.validate(transfer)

    await this.authService.verifyAuthorization(initiator, CategoryPermission.UPDATE, category)

    if (transfer.hasOwnProperty('name')) {
      const name = transfer.name
      await this.verifyCategoryNameNotExists(name, category.getId())

      category.setName(name)
    }

    if (transfer.hasOwnProperty('requiredScore')) {
      category.setRequiredScore(transfer.requiredScore)
    }

    await this.entityManager.save<Category>(category)

    this.eventDispatcher.dispatch('categoryUpdated', { category })

    return category
  }

  /**
   * @param {Category} category
   * @param {CategorySchema} transfer
   * @param {User} initiator
   * @returns {Promise<Category>}
   * @throws {CategoryNotFoundError}
   * @throws {AuthorizationFailedError}
   * @throws {CategoryNameTakenError}
   */
  public async replaceCategory(category: Category, transfer: CategorySchema, initiator: User): Promise<Category> {
    await this.validator.validate(transfer)

    await this.authService.verifyAuthorization(initiator, CategoryPermission.REPLACE, category)

    const name = transfer.name
    await this.verifyCategoryNameNotExists(name, category.getId())

    category.setName(name)
      .setRequiredScore(transfer.requiredScore)

    await this.entityManager.save<Category>(category)

    this.eventDispatcher.dispatch('categoryReplaced', { category })

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

    // todo: soft delete
    await this.entityManager.remove<Category>(category)

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