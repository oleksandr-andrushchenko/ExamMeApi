import { Inject, Service } from "typedi";
import { Action } from "routing-controllers";
import User from "../../entity/User";
import UserRepository from "../../repository/UserRepository";
import TokenService, { TokenPayload } from "../token/TokenService";
import { Request } from "express";
import UserService from "../user/UserService";
import InjectEventDispatcher, { EventDispatcherInterface } from "../../decorator/InjectEventDispatcher";
import TokenSchema from "../../schema/auth/TokenSchema";

@Service()
export default class AuthService {

    constructor(
        @Inject() private readonly tokenService: TokenService,
        @Inject() private readonly userService: UserService,
        @Inject() private readonly userRepository: UserRepository,
        @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
        private readonly tokenExpiresIn: number = 60 * 60 * 24 * 7,
    ) {
    }

    public getAuthorizationChecker(): (action: Action) => Promise<boolean> {
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

    public async createAuth(user: User): Promise<TokenSchema> {
        const access = await this.tokenService.generateAccessToken(user, this.tokenExpiresIn);

        this.eventDispatcher.dispatch('authCreated', { user });

        return access;
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