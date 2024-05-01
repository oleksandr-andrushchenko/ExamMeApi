import { EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm'
import User from '../entities/User'
import { Inject, Service } from 'typedi'
import UserService from '../services/user/UserService'

@Service()
@EventSubscriber()
export default class UserSubscriber implements EntitySubscriberInterface {

  public constructor(
    @Inject() private readonly userService: UserService,
  ) {
  }

  public listenTo(): typeof User {
    return User
  }

  public async beforeInsert(event: InsertEvent<User>): Promise<void> {
    const user: User = event.entity
    user.password = await this.userService.hashUserPassword(user.password)
  }
}