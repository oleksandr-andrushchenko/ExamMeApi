import { Authorized, Body, CurrentUser, HttpCode, JsonController, Post } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import User from '../entity/User'
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi'
import UserService from '../service/user/UserService'
import UserSchema from '../schema/user/UserSchema'

@Service()
@JsonController('/users')
export default class UserController {

  public constructor(
    @Inject() private readonly userService: UserService,
  ) {
  }

  @Post()
  @Authorized()
  @HttpCode(201)
  @OpenAPI({
    security: [ { bearerAuth: [] } ],
    responses: {
      201: { description: 'Created' },
      400: { description: 'Bad Request' },
      401: { description: 'Unauthorized' },
      403: { description: 'Forbidden' },
      409: { description: 'Conflict' },
    },
  })
  @ResponseSchema(User)
  public async createUser(
    @Body({ type: UserSchema, required: true }) user: UserSchema,
    @CurrentUser({ required: true }) currentUser: User,
  ): Promise<User> {
    return await this.userService.createUser(user, currentUser)
  }
}