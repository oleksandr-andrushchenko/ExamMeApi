import { Inject, Service } from 'typedi'
import User from '../../entities/User'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import UserPermission from '../../enums/user/UserPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class UserDeleter {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
  ) {
  }

  /**
   * @param {User} user
   * @param {User} initiator
   * @returns {Promise<User>}
   * @throws {AuthorizationFailedError}
   */
  public async deleteUser(user: User, initiator: User): Promise<User> {
    await this.authorizationVerifier.verifyAuthorization(initiator, UserPermission.Delete, user)

    user.deletedAt = new Date()

    await this.entityManager.save(user)
    this.eventDispatcher.dispatch('userDeleted', { user })

    return user
  }
}