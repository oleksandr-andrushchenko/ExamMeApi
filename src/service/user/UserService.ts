import { Inject, Service } from "typedi";
import User from "../../entity/User";
import InjectEventDispatcher, { EventDispatcherInterface } from "../../decorator/InjectEventDispatcher";
import UserRepository from "../../repository/UserRepository";
import * as bcrypt from "bcrypt";
import UserNotFoundError from "../../error/user/UserNotFoundError";
import UserWrongCredentialsError from "../../error/user/UserWrongCredentialsError";
import UserEmailTakenError from "../../error/user/UserEmailTakenError";
import InjectEntityManager, { EntityManagerInterface } from "../../decorator/InjectEntityManager";
import UserSchema from "../../schema/user/UserSchema";
import AuthSchema from "../../schema/auth/AuthSchema";
import { Permission } from "../../type/auth/Permission";
import AuthService from "../auth/AuthService";
import Validator from "../Validator";

@Service()
export default class UserService {

    constructor(
        @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
        @Inject() private readonly userRepository: UserRepository,
        @Inject() private readonly authService: AuthService,
        @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
        @Inject() private readonly validator: Validator,
    ) {
    }

    /**
     * @param transfer
     * @param initiator
     * @throws AuthorizationFailedError
     */
    public async createUser(transfer: UserSchema, initiator: User): Promise<User> {
        await this.authService.verifyAuthorization(initiator, Permission.CREATE_USER);

        await this.validator.validate(transfer);

        const email = transfer.email;

        await this.verifyUserEmailNotExists(email);

        const user: User = new User();
        user.name = transfer.name;
        user.email = email;
        user.password = transfer.password;
        user.permissions = transfer.permissions;
        user.createdBy = initiator._id;
        await this.entityManager.save<User>(user);

        this.eventDispatcher.dispatch('userCreated', { user });

        return user;
    }

    public async getUserByAuth(transfer: AuthSchema): Promise<User | null> {
        await this.validator.validate(transfer);

        const email: string = transfer.email;
        const user: User = await this.getUserByEmail(email);

        if (!await this.compareUserPassword(user, transfer.password)) {
            throw new UserWrongCredentialsError(`Passwords not matched`);
        }

        return user;
    }

    public async hashUserPassword(password: string): Promise<string> {
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, 10, (err, hash) => {
                if (err) {
                    return reject(err);
                }

                resolve(hash);
            });
        });
    }

    public async compareUserPassword(user: User, password: string): Promise<boolean> {
        return new Promise((resolve) => {
            bcrypt.compare(password, user.password, (err, res) => {
                resolve(res === true);
            });
        });
    }

    public async getUserByEmail(email: string): Promise<User> {
        const user: User = await this.userRepository.findOneByEmail(email);

        if (!user) {
            throw new UserNotFoundError(`Email not found "${email}"`);
        }

        return user;
    }

    public async verifyUserEmailNotExists(email: string): Promise<void> {
        if (await this.userRepository.findOneByEmail(email)) {
            throw new UserEmailTakenError(email);
        }
    }
}