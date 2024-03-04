import { describe, expect, test } from '@jest/globals';
import request from "supertest";
// @ts-ignore
import { api, fixture, error, auth, load, fakeId } from "../../index";
import Category from "../../../src/entity/Category";
import User from "../../../src/entity/User";
import Permission from "../../../src/enum/auth/Permission";

describe('PUT /categories/:category_id', () => {
  const app = api();

  test('Unauthorized', async () => {
    const category = await fixture<Category>(Category);
    const id = category.getId();
    const res = await request(app).put(`/categories/${ id.toString() }`).send({ name: 'any' });

    expect(res.status).toEqual(401);
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'));
  });

  test('Not found', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.REPLACE_CATEGORY ] });
    const token = (await auth(user)).token;
    const id = await fakeId();
    const res = await request(app)
      .put(`/categories/${ id.toString() }`)
      .send({ name: 'any' })
      .auth(token, { type: 'bearer' })
    ;

    expect(res.status).toEqual(404);
    expect(res.body).toMatchObject(error('NotFoundError'));
  });

  test('Bad request (empty body)', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.REPLACE_CATEGORY ] });
    const token = (await auth(user)).token;
    const category = await fixture<Category>(Category);
    const id = category.getId();
    const res = await request(app).put(`/categories/${ id.toString() }`).auth(token, { type: 'bearer' });

    expect(res.status).toEqual(400);
    expect(res.body).toMatchObject(error('BadRequestError'));
  });

  test('Forbidden (no permissions)', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.REGULAR ] });
    const category = await fixture<Category>(Category);
    const id = category.getId();
    const token = (await auth(user)).token;
    const res = await request(app)
      .put(`/categories/${ id.toString() }`)
      .send({ name: 'any' })
      .auth(token, { type: 'bearer' })
    ;

    expect(res.status).toEqual(403);
    expect(res.body).toMatchObject(error('ForbiddenError'));
  });

  test('Forbidden (no ownership)', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.REPLACE_CATEGORY ] });
    const category = await fixture<Category>(Category);
    const id = category.getId();
    const token = (await auth(user)).token;
    const res = await request(app)
      .put(`/categories/${ id.toString() }`)
      .send({ name: 'any' })
      .auth(token, { type: 'bearer' })
    ;

    expect(res.status).toEqual(403);
    expect(res.body).toMatchObject(error('ForbiddenError'));
  });

  test('Conflict', async () => {
    const category1 = await fixture<Category>(Category);
    const category = await fixture<Category>(Category, { permissions: [ Permission.REPLACE_CATEGORY ] });
    const id = category.getId();
    const user = await load<User>(User, category.getCreator());
    const token = (await auth(user)).token;
    const res = await request(app)
      .put(`/categories/${ id.toString() }`)
      .send({ name: category1.getName() })
      .auth(token, { type: 'bearer' })
    ;

    expect(res.status).toEqual(409);
    expect(res.body).toMatchObject(error('ConflictError'));
  });

  test('Replaced', async () => {
    const category = await fixture<Category>(Category, { permissions: [ Permission.REPLACE_CATEGORY ] });
    const id = category.getId();
    const user = await load<User>(User, category.getCreator());
    const token = (await auth(user)).token;
    const schema = { name: 'any' };
    const res = await request(app).put(`/categories/${ id.toString() }`).send(schema).auth(token, { type: 'bearer' });

    expect(res.status).toEqual(205);
    expect(res.body).toEqual('');
    expect(await load<Category>(Category, id)).toMatchObject(schema);
  });
});