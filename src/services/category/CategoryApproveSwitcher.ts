import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import User from '../../entities/User'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import Category from '../../entities/Category'
import CategoryPermission from '../../enums/category/CategoryPermission'
import CategoryRepository from '../../repositories/CategoryRepository'

@Service()
export default class CategoryApproveSwitcher {

  public constructor(
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject() private readonly categoryRepository: CategoryRepository,
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

    await this.categoryRepository.updateOneByEntity(category, {
      ownerId: this.isCategoryApproved(category) ? category.creatorId : undefined,
      updatedAt: new Date(),
    })

    this.eventDispatcher.dispatch('categoryApproveToggled', { category, initiator })

    return category
  }

  public isCategoryApproved(category: Category): boolean {
    return !category.ownerId
  }
}