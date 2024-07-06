import { Inject, Service } from 'typedi'
import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import User from '../entities/User'
import UserService from '../services/user/UserService'
import UserSchema from '../schema/user/UserSchema'
import UserQuerySchema from '../schema/user/UserQuerySchema'
import UserPermission from '../enums/user/UserPermission'

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

  @Authorized(UserPermission.Get)
  @Query(_returns => [ User ], { name: 'users' })
  public async getUsers(
    @Args() userQuery: UserQuerySchema,
    @Ctx('user') currentUser: User,
  ): Promise<User[]> {
    return await this.userService.getUsers(userQuery, false, currentUser) as User[]
  }
}