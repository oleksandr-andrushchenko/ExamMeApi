import { Inject, Service } from 'typedi'
import User from '../../entities/User'
import TokenService, { TokenPayload } from '../token/TokenService'
import { Request } from 'express'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import Token from '../../schema/auth/Token'
import AuthorizationFailedError from '../../errors/auth/AuthorizationFailedError'
import Permission from '../../enums/Permission'
import { ObjectId } from 'mongodb'
import PermissionHierarchySchema from '../../schema/auth/PermissionHierarchySchema'

@Service()
export default class AuthService {

  public constructor(
    @Inject() private readonly tokenService: TokenService,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject('authPermissions') private readonly permissions: PermissionHierarchySchema,
    private readonly tokenExpiresIn: number = 60 * 60 * 24 * 7,
  ) {
  }

  /**
   * @param {User} user
   * @param {string} permission
   * @param {{ownerId => ObjectId}} resource
   * @param {string[]} permissions
   * @returns {Promise<boolean>}
   * @throws {AuthorizationFailedError}
   */
  public async verifyAuthorization(
    user: User,
    permission: string,
    resource: { ownerId: ObjectId } = undefined,
    permissions: string[] = undefined,
  ): Promise<boolean> {
    if (resource) {
      if (resource instanceof User) {
        resource = { ...resource, ownerId: resource.id }
      }

      if (resource.ownerId.toString() === user.id.toString()) {
        return true
      }
    }

    permissions = permissions ?? user.permissions

    if (permissions.indexOf(Permission.ALL) !== -1) {
      return true
    }

    if (permissions.indexOf(permission) !== -1) {
      return true
    }

    for (const userPermission of permissions) {
      if (this.permissions.hasOwnProperty(userPermission)) {
        if (await this.verifyAuthorization(user, permission, resource, this.permissions[userPermission])) {
          return true
        }
      }
    }

    throw new AuthorizationFailedError(permission)
  }

  public async createAuth(user: User): Promise<Token> {
    const access = await this.tokenService.generateAccessToken(user, this.tokenExpiresIn)

    this.eventDispatcher.dispatch('authCreated', { user })

    return access
  }

  public async verifyAccessToken(req: Request): Promise<string | null> {
    const header: string | undefined = req.header('Authorization')

    if (!header) {
      return null
    }

    const parts: string[] = header.split(' ')

    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      return null
    }

    const payload: TokenPayload | null = await this.tokenService.verifyAccessToken(parts[1])

    if (!payload || !payload.userId) {
      return null
    }

    return payload.userId
  }

  public queryPermissions(): Permission[] {
    return Object.values(Permission)
  }

  public getPermissionHierarchy(): PermissionHierarchySchema {
    return this.permissions
  }
}