import { Inject, Service } from 'typedi'
import User from '../../entities/User'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import ValidatorInterface from '../validator/ValidatorInterface'
import UpdateMe from '../../schema/user/UpdateMe'
import UserVerifier from '../user/UserVerifier'

@Service()
export default class MeUpdater {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject('validator') private readonly validator: ValidatorInterface,
    @Inject() private readonly userVerifier: UserVerifier,
  ) {
  }

  public async updateMe(updateMe: UpdateMe, initiator: User): Promise<User> {
    await this.validator.validate(updateMe)

    if ('email' in updateMe) {
      const email = updateMe.email
      await this.userVerifier.verifyUserEmailNotExists(email, initiator.id)
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
}