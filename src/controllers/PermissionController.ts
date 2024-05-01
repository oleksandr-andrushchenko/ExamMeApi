import { Authorized, Get, JsonController } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import { OpenAPI } from 'routing-controllers-openapi'
import Permission from '../enums/Permission'
import PermissionHierarchy from '../types/auth/PermissionHierarchy'
import CategoryPermission from '../enums/category/CategoryPermission'
import QuestionPermission from '../enums/question/QuestionPermission'

@Service()
@JsonController('/permissions')
export default class PermissionController {

  public constructor(
    @Inject('authPermissions') private readonly permissionHierarchy: PermissionHierarchy,
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
    return Object.values(Permission) as Permission[]
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
  public async getPermissionHierarchy(): Promise<PermissionHierarchy> {
    return this.permissionHierarchy
  }
}