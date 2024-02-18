import { JsonController, Get, Authorized } from "routing-controllers";
import { Inject, Service } from "typedi";
import { OpenAPI } from "routing-controllers-openapi";
import Permission from "../enum/auth/Permission";
import PermissionHierarchy from "../type/auth/PermissionHierarchy";

@Service()
@JsonController('/permissions')
export default class PermissionController {

    constructor(
        @Inject('authPermissionHierarchy') private readonly permissionHierarchy: PermissionHierarchy,
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
                            example: Object.values(Permission)
                        }
                    }
                }
            }
        }
    })
    public async queryPermissions(): Promise<Permission[]> {
        return Object.values(Permission) as Permission[];
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
                                        items: { type: 'string', enum: [ Permission.ALL ] }
                                    }
                                },
                            },
                            example: {
                                [Permission.REGULAR]: [ Permission.CREATE_CATEGORY, Permission.UPDATE_QUESTION ]
                            }
                        }
                    }
                }
            }
        }
    })
    public async queryPermissionHierarchy(): Promise<PermissionHierarchy> {
        return this.permissionHierarchy;
    }
}