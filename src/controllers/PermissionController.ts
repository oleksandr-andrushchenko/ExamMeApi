import { Authorized, Get, JsonController } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import { OpenAPI } from 'routing-controllers-openapi'
import Permission from '../enums/Permission'
import CategoryPermission from '../enums/category/CategoryPermission'
import QuestionPermission from '../enums/question/QuestionPermission'
import AuthService from '../services/auth/AuthService'
import PermissionHierarchySchema from '../schema/auth/PermissionHierarchySchema'

@Service()
@JsonController('/permissions')
export default class PermissionController {

  public constructor(
    @Inject() private readonly authService: AuthService,
  ) {
  }

  @Authorized()
  @Get()
  @OpenAPI({
    security: [ { bearerAuth: [] } ],
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { type: 'string', enum: Object.values(Permission) },
              example: Object.values(Permission),
            },
          },
        },
      },
    },
  })
  public async queryPermissions(): Promise<Permission[]> {
    return this.authService.queryPermissions()
  }

  @Authorized()
  @Get('/hierarchy')
  @OpenAPI({
    security: [ { bearerAuth: [] } ],
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  [Permission.ROOT]: {
                    type: 'array',
                    items: { type: 'string', enum: [ Permission.ALL ] },
                  },
                },
              },
              example: {
                [Permission.REGULAR]: [ CategoryPermission.CREATE, QuestionPermission.UPDATE ],
              },
            },
          },
        },
      },
    },
  })
  public async getPermissionHierarchy(): Promise<PermissionHierarchySchema> {
    return this.authService.getPermissionHierarchy()
  }
}