import { Inject, Service } from 'typedi'
import User from '../../entities/User'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import CreateUser from '../../schema/user/CreateUser'
import Permission from '../../enums/Permission'
import ValidatorInterface from '../validator/ValidatorInterface'
import UserPermission from '../../enums/user/UserPermission'
import UserVerifier from './UserVerifier'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class UserCreator {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly userVerifier: UserVerifier,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {CreateUser} createUser
   * @param {User} initiator
   * @returns {Promise<User>}
   * @throws {AuthorizationFailedError}
   * @throws {UserEmailTakenError}
   */
  public async createUser(createUser: CreateUser, initiator: User): Promise<User> {
    await this.authorizationVerifier.verifyAuthorization(initiator, UserPermission.Create)

    await this.validator.validate(createUser)

    const email = createUser.email
    await this.userVerifier.verifyUserEmailNotExists(email)

    const user = new User()
    user.email = email
    user.password = createUser.password
    user.permissions = createUser.permissions ?? [ Permission.Regular ]
    user.creatorId = initiator.id

    if ('name' in createUser) {
      user.name = createUser.name
    }

    user.createdAt = new Date()

    await this.entityManager.save<User>(user)
    this.eventDispatcher.dispatch('userCreated', { user })

    return user
  }
}