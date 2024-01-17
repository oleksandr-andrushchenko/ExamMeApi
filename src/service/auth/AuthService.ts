import { Inject, Service } from "typedi";
import { Action } from "routing-controllers";
import User from "../../entity/User";
import UserRepository from "../../repository/UserRepository";
import TokenService, { GeneratedToken, TokenPayload } from "../token/TokenService";
import { Request } from "express";
import UserService from "../user/UserService";
import { EventDispatcher, EventDispatcherInterface } from "../../decorator/EventDispatcher";
import UserTransfer from "../../transfer/user/UserTransfer";
import UserCredentialsTransfer from "../../transfer/user/UserCredentialsTransfer";
import { validate } from "class-validator";

export type AuthTokens = {
    accessToken: GeneratedToken;
    refreshToken: GeneratedToken;
}

@Service()
export default class AuthService {

    constructor(
        @Inject() private readonly tokenService: TokenService,
        @Inject() private readonly userService: UserService,
        @Inject() private readonly userRepository: UserRepository,
        @EventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
        private readonly tokenExpiresIn: number = 60 * 60 * 24 * 7,
    ) {
    }

    public getAuthorizationChecker(): (action: Action, roles: any[]) => Promise<boolean> {
        return async (action: Action): Promise<boolean> => {
            const req = action.request;
            const userId: string | null = await this.verifyAccessToken(req);

            req.userId = userId;

            // @todo get user and check permissions (roles)

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

    public async registerUser(transfer: UserTransfer): Promise<User> {
        await validate(transfer);

        const user: User = await this.userService.createUser(transfer);

        this.eventDispatcher.dispatch('userRegistered', { user });

        return user;
    }

    public async loginUser(transfer: UserCredentialsTransfer): Promise<AuthTokens> {
        await validate(transfer);

        const user: User = await this.userService.getUserByCredentials(transfer);
        const tokens = this.authorizeUser(user);

        this.eventDispatcher.dispatch('userLoggedIn', { user });

        return tokens;
    }

    public async authorizeUser(user: User): Promise<AuthTokens> {
        const accessToken = await this.tokenService.generateAccessToken(user, this.tokenExpiresIn);
        const refreshToken = await this.tokenService.generateRefreshToken(user, this.tokenExpiresIn);

        this.eventDispatcher.dispatch('userAuthorized', { user });

        return { accessToken, refreshToken };
    }

    public async verifyAccessToken(req: Request): Promise<string | null> {
        const token: string | undefined = req.header('Authorization');

        if (!token) {
            return null;
        }

        const payload: TokenPayload | null = await this.tokenService.verifyAccessToken(token);

        if (!payload || !payload.userId) {
            return null;
        }

        return payload.userId;
    }
}