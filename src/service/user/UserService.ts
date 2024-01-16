import { Inject, Service } from "typedi";
import User from "../../entity/User";
import UserTransfer from "../../transfer/user/UserTransfer";
import { validate } from "class-validator";
import { EntityManager } from "typeorm";
import { EventDispatcher, EventDispatcherInterface } from "../../decorator/EventDispatcher";
import UserCredentialsTransfer from "../../transfer/user/UserCredentialsTransfer";
import UserRepository from "../../repository/UserRepository";
import * as bcrypt from "bcrypt";
import { LoggerInterface } from "../../logger/LoggerInterface";
import UserNotFoundError from "../../error/user/UserNotFoundError";
import UserWrongCredentialsError from "../../error/user/UserWrongCredentialsError";

@Service()
export default class UserService {

    constructor(
        @Inject('entityManager') private readonly entityManager: EntityManager,
        @Inject() private readonly userRepository: UserRepository,
        @EventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
        @Inject('logger') private readonly logger: LoggerInterface,
    ) {
    }

    public async createUser(transfer: UserTransfer): Promise<User> {
        await validate(transfer);

        const user: User = new User();
        user.name = transfer.name;
        user.email = transfer.email;
        user.password = transfer.password;

        await this.entityManager.save<UserTransfer>(user);

        this.eventDispatcher.dispatch('userCreated', { user });

        return user;
    }

    /**
     * @todo: raise errors
     * @param transfer
     */
    public async getUserByCredentials(transfer: UserCredentialsTransfer): Promise<User | null> {
        await validate(transfer);

        const email: string = transfer.email;
        const user: User = await this.userRepository.findOneByEmail(email);

        this.logger.debug('getUserByCredentials:user', user);

        if (!user) {
            throw new UserNotFoundError(`Email not found "${email}"`);
        }

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
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => {
                resolve(res === true);
            });
        });
    }
}