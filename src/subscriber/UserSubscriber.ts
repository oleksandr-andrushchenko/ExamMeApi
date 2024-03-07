import { EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm'
import User from '../entity/User'
import { Inject, Service } from 'typedi'
import UserService from '../service/user/UserService'

@Service()
@EventSubscriber()
export default class UserSubscriber implements EntitySubscriberInterface {

  constructor(
    @Inject() private readonly userService: UserService,
  ) {
  }

  public listenTo(): typeof User {
    return User
  }

  public async beforeInsert(event: InsertEvent<User>): Promise<void> {
    const user: User = event.entity
    user.setPassword(await this.userService.hashUserPassword(user.getPassword()))
  }
}