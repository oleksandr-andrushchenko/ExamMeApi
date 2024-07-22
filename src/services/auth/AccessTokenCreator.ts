import { Inject, Service } from 'typedi'
import User from '../../entities/User'
import TokenService from '../token/TokenService'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import Token from '../../schema/auth/Token'

@Service()
export default class AccessTokenCreator {

  public constructor(
    @Inject() private readonly tokenService: TokenService,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    private readonly tokenExpiresIn: number = 60 * 60 * 24 * 7,
  ) {
  }

  public async createAccessToken(user: User): Promise<Token> {
    const token = await this.tokenService.generateAccessToken(user, this.tokenExpiresIn)

    this.eventDispatcher.dispatch('authenticationCreated', { user })

    return token
  }
}