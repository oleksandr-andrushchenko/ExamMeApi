import { Inject, Service } from "typedi";
import User from "../../entity/User";
import InjectEventDispatcher, { EventDispatcherInterface } from "../../decorator/InjectEventDispatcher";
import InjectEntityManager, { EntityManagerInterface } from "../../decorator/InjectEntityManager";
import { Permission } from "../../type/auth/Permission";
import MeSchema from "../../schema/user/MeSchema";
import ValidatorInterface from "../validator/ValidatorInterface";
import UserService from "./UserService";

@Service()
export default class MeService {

    constructor(
        @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
        @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
        @Inject('validator') private readonly validator: ValidatorInterface,
        @Inject() private readonly userService: UserService,
    ) {
    }

    /**
     *
     * @param {MeSchema} transfer
     * @returns {Promise<User>}
     * @throws AuthorizationFailedError
     * @throws UserEmailTakenError
     */
    public async createMe(transfer: MeSchema): Promise<User> {
        await this.validator.validate(transfer);

        const email = transfer.email;
        await this.userService.verifyUserEmailNotExists(email);

        const user: User = (new User())
            .setName(transfer.name)
            .setEmail(email)
            .setPassword(transfer.password)
            .setPermissions([Permission.REGULAR])
        ;
        await this.entityManager.save<User>(user);

        this.eventDispatcher.dispatch('meCreated', { user });

        return user;
    }
}