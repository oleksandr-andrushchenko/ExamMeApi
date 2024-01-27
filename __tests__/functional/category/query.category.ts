import { describe, expect, test } from '@jest/globals';
import request from "supertest";
// @ts-ignore
import { api, fixture } from "../../index";
import Category from "../../../src/entity/Category";

describe('GET /categories', () => {
    const app = api();

    test('Empty', async () => {
        const res = await request(app).get('/categories');

        expect(res.status).toEqual(200);
        expect(res.body).toEqual([]);
    });

    test('Not empty', async () => {
        const categories = await Promise.all([fixture<Category>(Category), fixture<Category>(Category)]);

        const res = await request(app).get('/categories');

        expect(res.status).toEqual(200);
        expect(res.body).toHaveLength(categories.length);
        const body = res.body.sort((a, b) => a.name.localeCompare(b.name));
        categories.sort((a, b) => a.name.localeCompare(b.name)).forEach((category, index) => {
            expect(body[index]).toMatchObject({ name: category.name });
        });
    });
});