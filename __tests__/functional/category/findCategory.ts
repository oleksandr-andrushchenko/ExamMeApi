import { describe, expect, test } from '@jest/globals';
import request from "supertest";
// @ts-ignore
import { api, fixture, error } from "../../index";
import Category from "../../../src/entity/Category";

describe('GET /categories/:id', () => {
    const app = api();

    test('Not found', async () => {
        const res = await request(app).get('/categories/any');

        expect(res.status).toEqual(404);
        expect(res.body).toMatchObject(error('NotFoundError'));
    });

    test('Found', async () => {
        const category = await fixture<Category>(Category);
        const id = category._id.toString();
        const res = await request(app).get(`/categories/${id}`);

        expect(res.status).toEqual(200);
        expect(res.body).toMatchObject({ id: id, name: category.name });
    });
});