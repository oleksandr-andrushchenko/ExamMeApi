import { Service } from 'typedi'
import User from '../../entities/User'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'

@Service()
export default class MeDeleter {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
  ) {
  }

  public async deleteMe(initiator: User): Promise<User> {
    initiator.deletedAt = new Date()

    await this.entityManager.save<User>(initiator)
    this.eventDispatcher.dispatch('meDeleted', { me: initiator })

    return initiator
  }
}