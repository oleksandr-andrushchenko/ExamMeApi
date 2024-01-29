import { Inject, Service } from "typedi";
import { Action } from "routing-controllers";
import User from "../../entity/User";
import UserRepository from "../../repository/UserRepository";
import TokenService, { TokenPayload } from "../token/TokenService";
import { Request } from "express";
import InjectEventDispatcher, { EventDispatcherInterface } from "../../decorator/InjectEventDispatcher";
import TokenSchema from "../../schema/auth/TokenSchema";
import AuthorizationFailedError from "../../error/auth/AuthorizationFailedError";
import { Permission } from "../../type/auth/Permission";

@Service()
export default class AuthService {

    constructor(
        @Inject() private readonly tokenService: TokenService,
        @Inject() private readonly userRepository: UserRepository,
        @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
        @Inject('authPermissions') private readonly permissions: { [permission: string]: Permission[] },
        private readonly tokenExpiresIn: number = 60 * 60 * 24 * 7,
    ) {
    }

    /**
     * @param user
     * @param permission
     * @param userPermissions
     * @throws AuthorizationFailedError
     */
    public async verifyAuthorization(user: User, permission: Permission, userPermissions: Permission[] = null): Promise<boolean> {
        userPermissions = userPermissions === null ? user.getPermissions() : userPermissions;

        if (userPermissions.indexOf(Permission.ALL) !== -1) {
            return true;
        }

        if (userPermissions.indexOf(permission) !== -1) {
            return true;
        }

        for (const userPermission of userPermissions) {
            if (this.permissions.hasOwnProperty(userPermission)) {
                if (await this.verifyAuthorization(user, permission, this.permissions[userPermission])) {
                    return true;
                }
            }
        }

        throw new AuthorizationFailedError(permission);
    }

    public getAuthorizationChecker(): (action: Action) => Promise<boolean> {
        return async (action: Action): Promise<boolean> => {
            const req = action.request;
            const userId: string | null = await this.verifyAccessToken(req);

            req.userId = userId;

            return userId !== null;
        };
    }

    public getCurrentUserChecker(): (action: Action) => Promise<User | null> {
        return async (action: Action) => {
            const req = action.request;
            const userId: string | null = req.hasOwnProperty('userId') ? req.userId : await this.verifyAccessToken(req);

            if (userId === null) {
                return null;
            }

            return this.userRepository.findOneById(userId);
        };
    }

    public async createAuth(user: User): Promise<TokenSchema> {
        const access = await this.tokenService.generateAccessToken(user, this.tokenExpiresIn);

        this.eventDispatcher.dispatch('authCreated', { user });

        return access;
    }

    public async verifyAccessToken(req: Request): Promise<string | null> {
        const header: string | undefined = req.header('Authorization');

        if (!header) {
            return null;
        }

        const parts: string[] = header.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
            return null;
        }

        const payload: TokenPayload | null = await this.tokenService.verifyAccessToken(parts[1]);

        if (!payload || !payload.userId) {
            return null;
        }

        return payload.userId;
    }
}