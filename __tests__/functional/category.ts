import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import request from "supertest";
import application from "../../src/application";

const { app, up, down } = application().api();

beforeAll(() => up());
afterAll(() => down());

describe('GET /categories', () => {
    test('status code is 200', async () => {
        const res = await request(app).get('/categories');

        expect(res.status).toEqual(200);
    })
});