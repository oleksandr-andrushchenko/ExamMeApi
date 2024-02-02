import { describe, expect, test } from '@jest/globals';
import request from "supertest";
// @ts-ignore
import { api, fixture, error, load } from "../../index";
import User from "../../../src/entity/User";
import { ObjectId } from "mongodb";

describe('POST /me', () => {
    const app = api();

    test('Bad request', async () => {
        const res = await request(app).post('/me').send({});

        expect(res.status).toEqual(400);
        expect(res.body).toMatchObject(error('BadRequestError'));
    });

    test('Conflict', async () => {
        const user = await fixture<User>(User);
        const res = await request(app).post('/me').send({
            name: 'any',
            email: user.getEmail(),
            password: '123123'
        });

        expect(res.status).toEqual(409);
        expect(res.body).toMatchObject(error('ConflictError'));
    });

    test('Created', async () => {
        const schema = { name: 'any', email: 'a@a.com' };
        const res = await request(app).post('/me').send({ ...schema, ...{ password: '123123' } });

        expect(res.status).toEqual(201);
        expect(res.body).toHaveProperty('id');
        const id = new ObjectId(res.body.id);
        expect(res.body).toMatchObject(schema);
        expect(await load<User>(User, id)).toMatchObject(schema);
    });
});