import { Inject, Service } from 'typedi'
import User from '../../entities/User'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Permission from '../../enums/Permission'
import CreateMe from '../../schema/user/CreateMe'
import ValidatorInterface from '../validator/ValidatorInterface'
import UserService from './UserService'
import UpdateMe from '../../schema/user/UpdateMe'

@Service()
export default class MeService {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject('validator') private readonly validator: ValidatorInterface,
    @Inject() private readonly userService: UserService,
  ) {
  }

  /**
   * @param {CreateMe} createMe
   * @returns {Promise<User>}
   * @throws {AuthorizationFailedError}
   * @throws {UserEmailTakenError}
   */
  public async createMe(createMe: CreateMe): Promise<User> {
    await this.validator.validate(createMe)

    const email = createMe.email
    await this.userService.verifyUserEmailNotExists(email)

    const user = new User()
    user.email = email
    user.password = createMe.password
    user.permissions = [ Permission.REGULAR ]

    if ('name' in createMe) {
      user.name = createMe.name
    }

    user.createdAt = new Date()

    await this.entityManager.save<User>(user)

    this.eventDispatcher.dispatch('meCreated', { me: user })

    return user
  }

  public async updateMe(updateMe: UpdateMe, initiator: User): Promise<User> {
    await this.validator.validate(updateMe)

    if ('email' in updateMe) {
      const email = updateMe.email
      await this.userService.verifyUserEmailNotExists(email)
      initiator.email = email
    }

    if ('name' in updateMe) {
      initiator.name = updateMe.name
    }

    if ('password' in updateMe) {
      initiator.password = updateMe.password
    }

    initiator.updatedAt = new Date()

    await this.entityManager.save<User>(initiator)

    this.eventDispatcher.dispatch('meUpdated', { me: initiator })

    return initiator
  }

  public async deleteMe(initiator: User): Promise<User> {
    initiator.deletedAt = new Date()

    await this.entityManager.save<User>(initiator)

    this.eventDispatcher.dispatch('meDeleted', { me: initiator })

    return initiator
  }
}