import { Inject, Service } from 'typedi'
import User from '../../entities/User'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Permission from '../../enums/Permission'
import CreateMe from '../../schema/user/CreateMe'
import ValidatorInterface from '../validator/ValidatorInterface'
import UserVerifier from '../user/UserVerifier'
import EventDispatcher from '../event/EventDispatcher'

@Service()
export default class MeCreator {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject('validator') private readonly validator: ValidatorInterface,
    @Inject() private readonly userVerifier: UserVerifier,
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
    await this.userVerifier.verifyUserEmailNotExists(email)

    const user = new User()
    user.email = email
    user.password = createMe.password
    user.permissions = [ Permission.Regular ]

    if ('name' in createMe) {
      user.name = createMe.name
    }

    user.createdAt = new Date()

    await this.entityManager.save<User>(user)
    this.eventDispatcher.dispatch('meCreated', { me: user })

    return user
  }
}