import { Inject, Service } from 'typedi'
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import User from '../entities/User'
import MeService from '../services/user/MeService'
import MeSchema from '../schema/user/MeSchema'
import MeUpdateSchema from '../schema/user/MeUpdateSchema'

@Service()
@Resolver(User)
export class MeResolver {

  public constructor(
    @Inject() private readonly meService: MeService,
  ) {
  }

  @Mutation(_returns => User)
  public async createMe(
    @Arg('me') me: MeSchema,
  ): Promise<User> {
    return await this.meService.createMe(me)
  }

  @Authorized()
  @Query(_returns => User, { name: 'me' })
  public async getMe(
    @Ctx('user') user: User,
  ): Promise<User> {
    return user
  }

  @Authorized()
  @Mutation(_returns => User)
  public async updateMe(
    @Arg('meUpdate') meUpdate: MeUpdateSchema,
    @Ctx('user') user: User,
  ): Promise<User> {
    return await this.meService.updateMe(meUpdate, user)
  }

  @Authorized()
  @Mutation(_returns => Boolean)
  public async removeMe(
    @Ctx('user') user: User,
  ): Promise<boolean> {
    await this.meService.deleteMe(user)

    return true
  }
}