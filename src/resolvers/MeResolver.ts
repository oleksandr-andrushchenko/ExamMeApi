import { Inject, Service } from 'typedi'
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import User from '../entities/User'
import MeService from '../services/user/MeService'
import CreateMe from '../schema/user/CreateMe'
import UpdateMe from '../schema/user/UpdateMe'

@Service()
@Resolver(User)
export class MeResolver {

  public constructor(
    @Inject() private readonly meService: MeService,
  ) {
  }

  @Mutation(_returns => User)
  public async createMe(
    @Arg('createMe') createMe: CreateMe,
  ): Promise<User> {
    return await this.meService.createMe(createMe)
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
    @Arg('updateMe') updateMe: UpdateMe,
    @Ctx('user') user: User,
  ): Promise<User> {
    return await this.meService.updateMe(updateMe, user)
  }

  @Authorized()
  @Mutation(_returns => Boolean)
  public async deleteMe(
    @Ctx('user') user: User,
  ): Promise<boolean> {
    await this.meService.deleteMe(user)

    return true
  }
}