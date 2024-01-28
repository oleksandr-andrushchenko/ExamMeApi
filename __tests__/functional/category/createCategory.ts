import { describe, expect, test } from '@jest/globals';
import request from "supertest";
// @ts-ignore
import { api, fixture, error, auth } from "../../index";
import Category from "../../../src/entity/Category";
import User from "../../../src/entity/User";
import { Permission } from "../../../src/type/auth/Permission";

describe('POST /categories', () => {
    const app = api();

    test('Unauthorized', async () => {
        const res = await request(app).post('/categories').send({ name: 'any' });

        expect(res.status).toEqual(401);
        expect(res.body).toMatchObject(error('AuthorizationRequiredError'));
    });

    test('Forbidden', async () => {
        const user = await fixture<User>(User, { permissions: [Permission.REGULAR] });
        const token = (await auth(user)).token;
        const res = await request(app).post('/categories').send({ name: 'any' }).auth(token, { type: 'bearer' });

        expect(res.status).toEqual(403);
        expect(res.body).toMatchObject(error('ForbiddenError'));
    });

    test('Conflict', async () => {
        const category = await fixture<Category>(Category);
        const user = await fixture<User>(User, { permissions: [Permission.ROOT] });
        const token = (await auth(user)).token;
        const res = await request(app).post('/categories').send({ name: category.name }).auth(token, { type: 'bearer' });

        expect(res.status).toEqual(409);
        expect(res.body).toMatchObject(error('Error', `Name "${category.name}" is already taken`));
    });

    test('Created', async () => {
        const user = await fixture<User>(User, { permissions: [Permission.CREATE_CATEGORY] });
        const token = (await auth(user)).token;
        const name = 'any';
        const res = await request(app).post('/categories').send({ name }).auth(token, { type: 'bearer' });

        expect(res.status).toEqual(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toMatchObject({ name });
    });

    test('Bad request', async () => {
        const user = await fixture<User>(User, { permissions: [Permission.CREATE_CATEGORY] });
        const token = (await auth(user)).token;
        const res = await request(app).post('/categories').send({}).auth(token, { type: 'bearer' });

        expect(res.status).toEqual(400);
        expect(res.body).toMatchObject(error('BadRequestError', 'Invalid body, check \'errors\' property for more info.'));
    });
});