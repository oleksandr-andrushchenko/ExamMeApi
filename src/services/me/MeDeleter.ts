import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import EventDispatcher from '../event/EventDispatcher'

@Service()
export default class MeDeleter {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly eventDispatcher: EventDispatcher,
  ) {
  }

  public async deleteMe(initiator: User): Promise<User> {
    initiator.deletedAt = new Date()

    await this.entityManager.save<User>(initiator)
    this.eventDispatcher.dispatch('meDeleted', { me: initiator })

    return initiator
  }
}