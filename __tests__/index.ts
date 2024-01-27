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

export const api = (): Application => {
    const { app, up, down } = application().api();

    const clear = async () => {
        await Container.get<UserRepository>(UserRepository).clear();
        await Container.get<CategoryRepository>(CategoryRepository).clear();
    };

    beforeAll(() => up());
    beforeEach(() => clear());
    afterAll(() => down());

    return app;
}

export const fixture = async <Entity>(entity: any): Promise<Entity> => {
    let object: any;

    switch (entity) {
        case User:
            object = new User();
            object.name = faker.person.fullName();
            object.email = faker.internet.email();
            object.password = faker.internet.password();
            break;
        case Category:
            object = new Category();
            object.name = faker.lorem.word();
            object.createdBy = (await fixture(User) as User)._id;
            break;
        default:
            throw new Error(`Unknown "${entity.toString()}" type passed`);
    }

    await Container.get(ConnectionManager).get('default').manager.save(object);

    return object;
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