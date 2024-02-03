import application from "../src/application";
import { afterAll, beforeAll, beforeEach } from "@jest/globals";
import { Application } from "express";
import Category from "../src/entity/Category";
import User from "../src/entity/User";
import { faker } from "@faker-js/faker";
import { ConnectionManager } from "typeorm";
import { Container } from "typedi";
import AuthService from "../src/service/auth/AuthService";
import TokenSchema from "../src/schema/auth/TokenSchema";
import CategoryRepository from "../src/repository/CategoryRepository";
import UserRepository from "../src/repository/UserRepository";
import { Permission } from "../src/type/auth/Permission";
import { ObjectId } from "mongodb";
import QuestionRepository from "../src/repository/QuestionRepository";
import Question, { QuestionChoice, QuestionDifficulty, QuestionType } from "../src/entity/Question";

export const api = (): Application => {
    const { app, up, down } = application().api();

    const clear = async () => {
        await Container.get<UserRepository>(UserRepository).clear();
        await Container.get<CategoryRepository>(CategoryRepository).clear();
        await Container.get<QuestionRepository>(QuestionRepository).clear();
    };

    beforeAll(() => up());
    beforeEach(() => clear());
    afterAll(() => down());

    return app;
}

export const fixture = async <Entity>(entity: any, options: object = {}): Promise<Entity> => {
    let object: any;

    switch (entity) {
        case User:
            object = (new User())
                .setName(faker.person.fullName())
                .setEmail(faker.internet.email())
                .setPassword(faker.internet.password())
                .setPermissions(options['permissions'] ?? [Permission.REGULAR])
            ;
            break;
        case Category:
            object = (new Category())
                .setName(faker.lorem.word())
                .setCreator((await fixture(User, options) as User).getId())
            ;
            break;
        case Question:
            object = (new Question())
                .setCategory((await fixture(Category, options) as Category).getId())
                .setType(faker.helpers.enumValue(QuestionType))
                .setDifficulty(faker.helpers.enumValue(QuestionDifficulty))
                .setTitle(faker.lorem.word())
                .setCreator((await fixture(User, options) as User).getId())
            ;

            if (object.getType() === QuestionType.CHOICE) {
                object.setChoices([
                    (new QuestionChoice())
                        .setTitle(faker.lorem.word())
                        .setIsCorrect(faker.datatype.boolean()),
                ]);
            }

            break;
        default:
            throw new Error(`Unknown "${entity.toString()}" type passed`);
    }

    await Container.get<ConnectionManager>(ConnectionManager).get('default').manager.save(object);

    return object;
}

export const load = async <Entity>(entity: any, id: ObjectId): Promise<Entity> => {
    switch (entity) {
        case User:
            return Container.get<UserRepository>(UserRepository).findOneById(id.toString()) as any;
        case Category:
            return Container.get<CategoryRepository>(CategoryRepository).findOneById(id.toString()) as any;
        case Question:
            return Container.get<QuestionRepository>(QuestionRepository).findOneById(id.toString()) as any;
        default:
            throw new Error(`Unknown "${entity.toString()}" type passed`);
    }
}

export const error = (name: string = '', message: string = '', errors: string[] = []) => {
    const body = {};

    if (name) {
        body['name'] = name;
    }

    if (message) {
        body['message'] = message;
    }

    if (errors.length > 0) {
        body['errors'] = errors;
    }

    return body;
};

export const auth = async (user: User): Promise<TokenSchema> => {
    const authService: AuthService = Container.get<AuthService>(AuthService);

    return await authService.createAuth(user);
};

export const fakeId = async (): Promise<ObjectId> => ObjectId.createFromTime(Date.now());