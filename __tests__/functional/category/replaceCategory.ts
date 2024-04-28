import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, load, server as app } from '../../index'
import Category from '../../../src/entity/Category'
import User from '../../../src/entity/User'
import CategoryPermission from '../../../src/enum/category/CategoryPermission'

describe('PUT /categories/:categoryId', () => {
  test('Unauthorized', async () => {
    const category = await fixture<Category>(Category)
    const id = category.getId()
    const res = await request(app).put(`/categories/${ id.toString() }`).send({ name: 'any' })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })

  test('Bad request (invalid id)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = 'invalid'
    const res = await request(app).put(`/categories/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })

  test('Not found', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).put(`/categories/${ id.toString() }`).send({ name: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })

  test.each([
    { case: 'empty body', body: {} },
    { case: 'no name', body: { requiredScore: 80 } },
    { case: 'name is null', body: { name: null, requiredScore: 80 } },
    { case: 'name is undefined', body: { name: undefined, requiredScore: 80 } },
    { case: 'name too short', body: { name: 'a', requiredScore: 80 } },
    { case: 'name too long', body: { name: 'abc'.repeat(99), requiredScore: 80 } },
    { case: 'required score is null', body: { name: 'Any category', requiredScore: null } },
    { case: 'required score is string', body: { name: 'Any category', requiredScore: 'any' } },
    { case: 'required score is float', body: { name: 'Any category', requiredScore: 0.1 } },
    { case: 'required score is negative', body: { name: 'Any category', requiredScore: -1 } },
    { case: 'required score is greater then 100', body: { name: 'Any category', requiredScore: 101 } },
  ])('Bad request ($case)', async ({ body }) => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const category = await fixture<Category>(Category)
    const id = category.getId()
    const res = await request(app).put(`/categories/${ id.toString() }`).send(body).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })

  test('Forbidden (no permissions)', async () => {
    const user = await fixture<User>(User)
    const category = await fixture<Category>(Category)
    const id = category.getId()
    const token = (await auth(user)).token
    const res = await request(app).put(`/categories/${ id.toString() }`).send({ name: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })

  test('Forbidden (no ownership)', async () => {
    const user = await fixture<User>(User)
    const category = await fixture<Category>(Category, { owner: await fixture<User>(User) })
    const id = category.getId()
    const token = (await auth(user)).token
    const res = await request(app).put(`/categories/${ id.toString() }`).send({ name: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })

  test('Conflict', async () => {
    const category1 = await fixture<Category>(Category)
    const category = await fixture<Category>(Category, { permissions: [ CategoryPermission.REPLACE ] })
    const id = category.getId()
    const user = await load<User>(User, category.getCreator())
    const token = (await auth(user)).token
    const res = await request(app).put(`/categories/${ id.toString() }`).send({ name: category1.getName() }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(error('ConflictError'))
  })

  test('Replaced (has ownership)', async () => {
    const category = await fixture<Category>(Category)
    const id = category.getId()
    const user = await load<User>(User, category.getCreator())
    const token = (await auth(user)).token
    const schema = { name: 'any' }
    const res = await request(app).put(`/categories/${ id.toString() }`).send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await load<Category>(Category, id)).toMatchObject(schema)
  })

  test('Replaced (has permission)', async () => {
    const category = await fixture<Category>(Category)
    const id = category.getId()
    const permissions = [
      CategoryPermission.REPLACE,
    ]
    const user = await fixture<User>(User, { permissions })
    const token = (await auth(user)).token
    const schema = { name: 'any' }
    const res = await request(app).put(`/categories/${ id.toString() }`).send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await load<Category>(Category, id)).toMatchObject(schema)
  })
})