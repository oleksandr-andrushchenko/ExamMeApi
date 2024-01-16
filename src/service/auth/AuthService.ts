import { Inject, Service } from "typedi";
import { Action } from "routing-controllers";
import User from "../../entity/User";
import Token, { TokenType } from "../../entity/Token";
import UserRepository from "../../repository/UserRepository";
import TokenService, { GeneratedToken } from "../token/TokenService";
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

    public getAuthorizationChecker(): (action: Action, roles: any[]) => Promise<boolean> | boolean {
        return async (action: Action, roles: string[]) => {
            // return false;
            const token: Token | null = await this.verifyToken(action.request);

            action.request.token = token;

            // @todo get user and check permissions (roles)
            return token !== null;
        };
    }

    public getCurrentUserChecker(): (action: Action) => Promise<UserTransfer | null> {
        return async (action: Action) => {
            // return null;
            const token: Token = action.request.hasOwnProperty('token') ? action.request.token : await this.verifyToken(action.request);

            if (!token) {
                return null;
            }

            return await this.userRepository.findOneBy({ _id: token.userId });
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

    /**
     * @todo check if need, if getCurrentUserChecker called - then getAuthorizationChecker should be executed, so in this case - no need to call twice, just pass from previous step call
     * @param req
     * @private
     */
    private async verifyToken(req: Request): Promise<Token | null> {
        const token: string | undefined = req.header('Authorization');

        if (!token) {
            return null;
        }

        return await this.tokenService.verifyToken(token, TokenType.ACCESS);
    }
}