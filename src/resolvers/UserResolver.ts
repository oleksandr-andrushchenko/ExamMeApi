import { Inject, Service } from 'typedi'
import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import User from '../entities/User'
import UserService from '../services/user/UserService'
import CreateUser from '../schema/user/CreateUser'
import GetUsers from '../schema/user/GetUsers'
import PaginatedUsers from '../schema/user/PaginatedUsers'
import UpdateUser from '../schema/user/UpdateUser'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import GetUser from '../schema/user/GetUser'

@Service()
@Resolver(User)
export class UserResolver {

  public constructor(
    @Inject() private readonly userService: UserService,
    @Inject('validator') private readonly validator: ValidatorInterface,
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
  @Mutation(_returns => User)
  public async updateUser(
    @Args() getUser: GetUser,
    @Arg('updateUser') updateUser: UpdateUser,
    @Ctx('user') currentUser: User,
  ): Promise<User> {
    await this.validator.validate(getUser)
    const user = await this.userService.getUser(getUser.userId)

    return await this.userService.updateUser(user, updateUser, currentUser)
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