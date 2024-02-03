import { describe, expect, test } from '@jest/globals';
import request from "supertest";
// @ts-ignore
import { api, fixture, error, auth, load } from "../../index";
import User from "../../../src/entity/User";
import { Permission } from "../../../src/type/auth/Permission";
import { ObjectId } from "mongodb";

describe('POST /users', () => {
    const app = api();

    test('Unauthorized', async () => {
        const res = await request(app).post('/users');

        expect(res.status).toEqual(401);
        expect(res.body).toMatchObject(error('AuthorizationRequiredError'));
    });

    test('Bad request (empty body)', async () => {
        const user = await fixture<User>(User, { permissions: [Permission.CREATE_USER] });
        const token = (await auth(user)).token;
        const res = await request(app).post('/users').auth(token, { type: 'bearer' });

        expect(res.status).toEqual(400);
        expect(res.body).toMatchObject(error('BadRequestError'));
    });

    test('Forbidden', async () => {
        const user = await fixture<User>(User, { permissions: [Permission.REGULAR] });
        const token = (await auth(user)).token;
        const res = await request(app).post('/users').send({
            name: 'any',
            email: 'a@a.com',
            password: '123123'
        }).auth(token, { type: 'bearer' });

        expect(res.status).toEqual(403);
        expect(res.body).toMatchObject(error('ForbiddenError'));
    });

    test('Conflict', async () => {
        const user1 = await fixture<User>(User);
        const user = await fixture<User>(User, { permissions: [Permission.CREATE_USER] });
        const token = (await auth(user)).token;
        const res = await request(app).post('/users').send({
            name: 'any',
            email: user1.getEmail(),
            password: '123123'
        }).auth(token, { type: 'bearer' });

        expect(res.status).toEqual(409);
        expect(res.body).toMatchObject(error('ConflictError'));
    });

    test('Created', async () => {
        const user = await fixture<User>(User, { permissions: [Permission.CREATE_USER] });
        const token = (await auth(user)).token;
        const schema = { name: 'any', email: 'a@a.com' };
        const res = await request(app).post('/users').send({ ...schema, ...{ password: '123123' } }).auth(token, { type: 'bearer' });

        expect(res.status).toEqual(201);
        expect(res.body).toHaveProperty('id');
        const id = new ObjectId(res.body.id);
        expect(res.body).toMatchObject(schema);
        expect(await load<User>(User, id)).toMatchObject(schema);
    });
});