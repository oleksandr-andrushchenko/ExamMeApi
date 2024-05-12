import { Inject, Service } from 'typedi'
import User from '../../entities/User'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Permission from '../../enums/Permission'
import MeSchema from '../../schema/user/MeSchema'
import ValidatorInterface from '../validator/ValidatorInterface'
import UserService from './UserService'
import MeUpdateSchema from '../../schema/user/MeUpdateSchema'

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
   * @param {MeSchema} transfer
   * @returns {Promise<User>}
   * @throws {AuthorizationFailedError}
   * @throws {UserEmailTakenError}
   */
  public async createMe(transfer: MeSchema): Promise<User> {
    await this.validator.validate(transfer)

    const email = transfer.email
    await this.userService.verifyUserEmailNotExists(email)

    const user = new User()
    user.email = email
    user.password = transfer.password
    user.permissions = [ Permission.REGULAR ]

    if ('name' in transfer) {
      user.name = transfer.name
    }

    user.createdAt = new Date()

    await this.entityManager.save<User>(user)

    this.eventDispatcher.dispatch('meCreated', { me: user })

    return user
  }

  /**
   * @param {MeSchema} transfer
   * @param {User} initiator
   * @returns {Promise<User>}
   * @throws {UserEmailTakenError}
   */
  public async replaceMe(transfer: MeSchema, initiator: User): Promise<User> {
    await this.validator.validate(transfer)

    const email = transfer.email
    await this.userService.verifyUserEmailNotExists(email)

    initiator.name = transfer.name
    initiator.email = email
    initiator.password = transfer.password

    if ('name' in transfer) {
      initiator.name = transfer.name
    }

    initiator.updatedAt = new Date()

    await this.entityManager.save<User>(initiator)

    this.eventDispatcher.dispatch('meReplaced', { me: initiator })

    return initiator
  }

  public async updateMe(transfer: MeUpdateSchema, initiator: User): Promise<User> {
    await this.validator.validate(transfer)

    if ('email' in transfer) {
      const email = transfer.email
      await this.userService.verifyUserEmailNotExists(email)
      initiator.email = email
    }

    if ('name' in transfer) {
      initiator.name = transfer.name
    }

    if ('password' in transfer) {
      initiator.password = transfer.password
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