import { Inject, Service } from 'typedi'
import { Authorized, Query, Resolver } from 'type-graphql'
import AuthService from '../services/auth/AuthService'
import PermissionSchema from '../schema/auth/PermissionSchema'

@Service()
@Resolver()
export class PermissionResolver {

  public constructor(
    @Inject() private readonly authService: AuthService,
  ) {
  }

  @Authorized()
  @Query(_returns => PermissionSchema)
  public async permission(): Promise<PermissionSchema> {
    const permission = new PermissionSchema()
    permission.items = this.authService.queryPermissions()
    permission.hierarchy = this.authService.getPermissionHierarchy()

    return permission
  }
}