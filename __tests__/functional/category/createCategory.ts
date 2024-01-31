import { describe, expect, test } from '@jest/globals';
import request from "supertest";
// @ts-ignore
import { api, fixture, error, auth, load } from "../../index";
import Category from "../../../src/entity/Category";
import User from "../../../src/entity/User";
import { Permission } from "../../../src/type/auth/Permission";
import { ObjectId } from "mongodb";

describe('POST /categories', () => {
    const app = api();

    test('Unauthorized', async () => {
        const res = await request(app).post('/categories').send({ name: 'any' });

        expect(res.status).toEqual(401);
        expect(res.body).toMatchObject(error('AuthorizationRequiredError'));
    });

    test('Bad request', async () => {
        const user = await fixture<User>(User, { permissions: [Permission.CREATE_CATEGORY] });
        const token = (await auth(user)).token;
        const res = await request(app).post('/categories').send({}).auth(token, { type: 'bearer' });

        expect(res.status).toEqual(400);
        expect(res.body).toMatchObject(error('BadRequestError'));
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
        const res = await request(app).post('/categories').send({ name: category.getName() }).auth(token, { type: 'bearer' });

        expect(res.status).toEqual(409);
        expect(res.body).toMatchObject(error('Error'));
    });

    test('Created', async () => {
        const user = await fixture<User>(User, { permissions: [Permission.CREATE_CATEGORY] });
        const token = (await auth(user)).token;
        const name = 'any';
        const res = await request(app).post('/categories').send({ name }).auth(token, { type: 'bearer' });

        expect(res.status).toEqual(201);
        expect(res.body).toHaveProperty('id');
        const id = new ObjectId(res.body.id);
        expect(res.body).toMatchObject({ name });
        expect(await load<Category>(Category, id)).toMatchObject({ name });
    });
});