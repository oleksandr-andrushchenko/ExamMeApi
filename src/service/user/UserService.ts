import { Inject, Service } from "typedi";
import User from "../../entity/User";
import UserTransfer from "../../transfer/user/UserTransfer";
import { validate } from "class-validator";
import InjectEventDispatcher, { EventDispatcherInterface } from "../../decorator/InjectEventDispatcher";
import UserCredentialsTransfer from "../../transfer/user/UserCredentialsTransfer";
import UserRepository from "../../repository/UserRepository";
import * as bcrypt from "bcrypt";
import LoggerInterface from "../../logger/LoggerInterface";
import UserNotFoundError from "../../error/user/UserNotFoundError";
import UserWrongCredentialsError from "../../error/user/UserWrongCredentialsError";
import UserEmailTakenError from "../../error/user/UserEmailTakenError";
import InjectEntityManager, { EntityManagerInterface } from "../../decorator/InjectEntityManager";

@Service()
export default class UserService {

    constructor(
        @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
        @Inject() private readonly userRepository: UserRepository,
        @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
        @Inject('logger') private readonly logger: LoggerInterface,
    ) {
    }

    public async createUser(transfer: UserTransfer): Promise<User> {
        await validate(transfer);

        const email = transfer.email;

        if (await this.userRepository.findOneByEmail(email)) {
            throw new UserEmailTakenError(`Email "${email}" is already taken`);
        }

        const user: User = new User();
        user.name = transfer.name;
        user.email = email;
        user.password = transfer.password;
        await this.entityManager.save<UserTransfer>(user);

        this.eventDispatcher.dispatch('userCreated', { user });

        return user;
    }

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