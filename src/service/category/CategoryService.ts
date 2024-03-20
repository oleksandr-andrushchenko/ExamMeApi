import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorator/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorator/InjectEntityManager'
import Category from '../../entity/Category'
import CategoryRepository from '../../repository/CategoryRepository'
import CategoryNameTakenError from '../../error/category/CategoryNameTakenError'
import User from '../../entity/User'
import CategoryNotFoundError from '../../error/category/CategoryNotFoundError'
import CategoryOwnershipError from '../../error/category/CategoryOwnershipError'
import CategorySchema from '../../schema/category/CategorySchema'
import AuthService from '../auth/AuthService'
import Permission from '../../enum/auth/Permission'
import { ObjectId } from 'mongodb'
import CategoryUpdateSchema from '../../schema/category/CategoryUpdateSchema'
import ValidatorInterface from '../validator/ValidatorInterface'
import PaginationSchema from '../../schema/pagination/PaginationSchema'
import Cursor from '../../model/Cursor'
import PaginatedSchema from '../../schema/pagination/PaginatedSchema'

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
    await this.authService.verifyAuthorization(initiator, Permission.CREATE_CATEGORY)

    await this.validator.validate(transfer)

    const name = transfer.name
    await this.verifyCategoryNameNotExists(name)

    const category: Category = (new Category())
      .setName(name)
      .setCreator(initiator.getId())

    await this.entityManager.save<Category>(category)

    this.eventDispatcher.dispatch('categoryCreated', { category })

    return category
  }

  /**
   * @param {string} id
   * @returns {Promise<Category>}
   * @throws {CategoryNotFoundError}
   */
  public async getCategory(id: string): Promise<Category> {
    this.validator.validateId(id)
    const category: Category = await this.categoryRepository.findOneById(id)

    if (!category) {
      throw new CategoryNotFoundError(id)
    }

    return category
  }

  /**
   * @param {PaginationSchema} pagination
   * @returns {Promise<PaginatedSchema<Category>>}
   * @throws {ValidatorError}
   */
  public async queryCategories(pagination: PaginationSchema): Promise<PaginatedSchema<Category>> {
    await this.validator.validate(pagination)

    const cursor = new Cursor<Category>(pagination)
    cursor.setRepository(this.categoryRepository)

    return cursor.getPaginated()
  }

  /**
   * @param {string} id
   * @param {CategoryUpdateSchema} transfer
   * @param {User} initiator
   * @returns {Promise<Category>}
   * @throws {CategoryNotFoundError}
   * @throws {AuthorizationFailedError}
   * @throws {CategoryOwnershipError}
   * @throws {CategoryNameTakenError}
   */
  public async updateCategory(id: string, transfer: CategoryUpdateSchema, initiator: User): Promise<Category> {
    this.validator.validateId(id)
    const category: Category = await this.getCategory(id)

    await this.authService.verifyAuthorization(initiator, Permission.UPDATE_CATEGORY)
    this.verifyCategoryOwnership(category, initiator)

    await this.validator.validate(transfer)

    if (transfer.hasOwnProperty('name')) {
      const name = transfer.name
      await this.verifyCategoryNameNotExists(name, category.getId())

      category.setName(name)
    }

    await this.entityManager.save<Category>(category)

    this.eventDispatcher.dispatch('categoryUpdated', { category })

    return category
  }

  /**
   * @param {string} id
   * @param {CategorySchema} transfer
   * @param {User} initiator
   * @returns {Promise<Category>}
   * @throws {CategoryNotFoundError}
   * @throws {AuthorizationFailedError}
   * @throws {CategoryOwnershipError}
   * @throws {CategoryNameTakenError}
   */
  public async replaceCategory(id: string, transfer: CategorySchema, initiator: User): Promise<Category> {
    this.validator.validateId(id)
    const category: Category = await this.getCategory(id)

    await this.authService.verifyAuthorization(initiator, Permission.REPLACE_CATEGORY)
    this.verifyCategoryOwnership(category, initiator)

    await this.validator.validate(transfer)

    const name = transfer.name
    await this.verifyCategoryNameNotExists(name, category.getId())

    category.setName(name)
    await this.entityManager.save<Category>(category)

    this.eventDispatcher.dispatch('categoryReplaced', { category })

    return category
  }

  /**
   * @param {string} id
   * @param {User} initiator
   * @returns {Promise<Category>}
   * @throws {CategoryNotFoundError}
   * @throws {AuthorizationFailedError}
   * @throws {CategoryOwnershipError}
   */
  public async deleteCategory(id: string, initiator: User): Promise<Category> {
    this.validator.validateId(id)
    const category: Category = await this.getCategory(id)

    await this.authService.verifyAuthorization(initiator, Permission.DELETE_CATEGORY)
    this.verifyCategoryOwnership(category, initiator)

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

  /**
   * @param {Category} category
   * @param {User} initiator
   * @throws {CategoryOwnershipError}
   */
  public verifyCategoryOwnership(category: Category, initiator: User): void {
    if (category.getCreator().toString() !== initiator.getId().toString()) {
      throw new CategoryOwnershipError(category.getId().toString())
    }
  }
}