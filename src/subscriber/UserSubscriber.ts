import { EntitySubscriberInterface, EventSubscriber, InsertEvent } from "typeorm";
import User from "../entity/User";
import { Inject, Service } from "typedi";
import UserService from "../service/user/UserService";

@Service()
@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface {

    constructor(
        @Inject() private readonly userService: UserService,
    ) {
    }

    public listenTo(): Function | string {
        return User;
    }

    public async beforeInsert(event: InsertEvent<User>): Promise<any> {
        const user: User = event.entity;
        user.password = await this.userService.hashUserPassword(user.password);
    }
}