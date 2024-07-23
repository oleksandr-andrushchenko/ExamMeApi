import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/User'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import Category from '../../entities/Category'
import CategoryPermission from '../../enums/category/CategoryPermission'

@Service()
export default class CategoryApproveSwitcher {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {Category} category
   * @param {User} initiator
   * @returns {Promise<Question>}
   * @throws {AuthorizationFailedError}
   */
  public async toggleCategoryApprove(category: Category, initiator: User): Promise<Category> {
    await this.authorizationVerifier.verifyAuthorization(initiator, CategoryPermission.Approve)

    if (this.isCategoryApproved(category)) {
      category.ownerId = category.creatorId
    } else {
      category.ownerId = null
    }

    category.updatedAt = new Date()

    await this.entityManager.save<Category>(category)
    this.eventDispatcher.dispatch('categoryApproveToggled', { category, initiator })

    return category
  }

  public isCategoryApproved(category: Category): boolean {
    return !category.ownerId
  }
}