import { Inject, Service } from 'typedi'
import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import User from '../entities/User'
import UserService from '../services/user/UserService'
import CreateUser from '../schema/user/CreateUser'
import GetUsers from '../schema/user/GetUsers'
import PaginatedUsers from '../schema/user/PaginatedUsers'

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
    @Arg('createUser') createUser: CreateUser,
    @Ctx('user') currentUser: User,
  ): Promise<User> {
    return await this.userService.createUser(createUser, currentUser)
  }

  @Authorized()
  @Query(_returns => [ User ], { name: 'users' })
  public async getUsers(
    @Args() getUsers: GetUsers,
    @Ctx('user') currentUser: User,
  ): Promise<User[]> {
    return await this.userService.getUsers(getUsers, false, currentUser) as User[]
  }

  @Authorized()
  @Query(_returns => PaginatedUsers, { name: 'paginatedUsers' })
  public async getPaginatedUsers(
    @Args() getUsers: GetUsers,
    @Ctx('user') currentUser: User,
  ): Promise<PaginatedUsers> {
    return await this.userService.getUsers(getUsers, true, currentUser) as PaginatedUsers
  }
}