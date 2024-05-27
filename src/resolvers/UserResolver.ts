import { Inject, Service } from 'typedi'
import { Arg, Authorized, Ctx, Mutation, Resolver } from 'type-graphql'
import User from '../entities/User'
import UserService from '../services/user/UserService'
import UserSchema from '../schema/user/UserSchema'

@Service()
@Resolver(User)
export class UserResolver {

  public constructor(
    @Inject() private readonly userService: UserService,
  ) {
  }

  @Authorized()
  @Mutation(_returns => User)
  public async createUser(
    @Arg('user') user: UserSchema,
    @Ctx('user') currentUser: User,
  ): Promise<User> {
    return await this.userService.createUser(user, currentUser)
  }
}