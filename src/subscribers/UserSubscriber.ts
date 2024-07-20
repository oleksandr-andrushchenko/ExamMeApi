import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm'
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

  public async beforeUpdate(event: UpdateEvent<User>): Promise<void> {
    const user = event.databaseEntity
    const newUser = event.entity as User

    if (newUser.password !== user.password) {
      newUser.password = await this.userService.hashUserPassword(newUser.password)
    }
  }
}