import {
  Authorized,
  Body,
  CurrentUser,
  Delete,
  Get,
  HttpCode,
  JsonController,
  OnUndefined,
  Patch,
  Post,
  Put,
} from 'routing-controllers'
import { Inject, Service } from 'typedi'
import User from '../entities/User'
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi'
import MeSchema from '../schema/user/MeSchema'
import MeService from '../services/user/MeService'
import MeUpdateSchema from '../schema/user/MeUpdateSchema'

@Service()
@JsonController('/me')
export default class MeController {

  public constructor(
    @Inject() private readonly meService: MeService,
  ) {
  }

  @Post()
  @HttpCode(201)
  @OpenAPI({
    responses: {
      201: { description: 'Created' },
      400: { description: 'Bad Request' },
      409: { description: 'Conflict' },
    },
  })
  @ResponseSchema(User)
  public async createMe(
    @Body({ type: MeSchema, required: true }) me: MeSchema,
  ): Promise<User> {
    return await this.meService.createMe(me)
  }

  @Get()
  @Authorized()
  @OpenAPI({
    security: [ { bearerAuth: [] } ],
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized' },
    },
  })
  @ResponseSchema(User)
  public async getMe(
    @CurrentUser({ required: true }) user: User,
  ): Promise<User> {
    return user
  }

  @Put()
  @Authorized()
  @HttpCode(205)
  @OnUndefined(205)
  @OpenAPI({
    security: [ { bearerAuth: [] } ],
    responses: {
      205: { description: 'Reset Content' },
      400: { description: 'Bad Request' },
      401: { description: 'Unauthorized' },
      409: { description: 'Conflict' },
    },
  })
  public async replaceMe(
    @Body({ type: MeSchema, required: true }) me: MeSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    await this.meService.replaceMe(me, user)
  }

  @Patch()
  @Authorized()
  @HttpCode(205)
  @OnUndefined(205)
  @OpenAPI({
    security: [ { bearerAuth: [] } ],
    responses: {
      205: { description: 'Reset Content' },
      400: { description: 'Bad Request' },
      401: { description: 'Unauthorized' },
      409: { description: 'Conflict' },
    },
  })
  public async updateMe(
    @Body({ type: MeUpdateSchema, required: true }) meUpdate: MeUpdateSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    await this.meService.updateMe(meUpdate, user)
  }

  @Delete()
  @Authorized()
  @HttpCode(204)
  @OnUndefined(204)
  @OpenAPI({
    security: [ { bearerAuth: [] } ],
    responses: {
      204: { description: 'No Content' },
      401: { description: 'Unauthorized' },
    },
  })
  public async deleteMe(
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    await this.meService.deleteMe(user)
  }
}