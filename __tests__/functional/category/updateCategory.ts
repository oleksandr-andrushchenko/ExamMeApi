import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { api, auth, error, fakeId, fixture, load } from '../../index'
import Category from '../../../src/entity/Category'
import User from '../../../src/entity/User'
import CategoryPermission from '../../../src/enum/category/CategoryPermission'

describe('PATCH /categories/:categoryId', () => {
  const app = api()

  test('Unauthorized', async () => {
    const category = await fixture<Category>(Category)
    const id = category.getId()
    const res = await request(app).patch(`/categories/${ id.toString() }`).send({ name: 'any' })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })

  test('Bad request (invalid category id)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = 'invalid'
    const res = await request(app).patch(`/categories/${ id.toString() }`).send({ name: 'Any category' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })

  test('Not found', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app)
      .patch(`/categories/${ id.toString() }`)
      .send({ name: 'any' })
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })

  test.each([
    { case: 'name too short', body: { name: 'a' } },
    { case: 'name too long', body: { name: 'abc'.repeat(99) } },
    { case: 'required score is string', body: { requiredScore: 'any' } },
    { case: 'required score is float', body: { requiredScore: 0.1 } },
    { case: 'required score is negative', body: { requiredScore: -1 } },
    { case: 'required score is greater then 100', body: { requiredScore: 101 } },
  ])('Bad request ($case)', async ({ body }) => {
    const category = await fixture<Category>(Category)
    const id = category.getId()
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).patch(`/categories/${ id.toString() }`).send(body).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })

  test('Forbidden (no permissions)', async () => {
    const user = await fixture<User>(User)
    const category = await fixture<Category>(Category)
    const id = category.getId()
    const token = (await auth(user)).token
    const res = await request(app).patch(`/categories/${ id.toString() }`).send({ name: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })

  test('Forbidden (no ownership)', async () => {
    const user = await fixture<User>(User)
    const category = await fixture<Category>(Category, { owner: await fixture<User>(User) })
    const id = category.getId()
    const token = (await auth(user)).token
    const res = await request(app).patch(`/categories/${ id.toString() }`).send({ name: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })

  test('Conflict', async () => {
    const category1 = await fixture<Category>(Category)
    const category = await fixture<Category>(Category, { permissions: [ CategoryPermission.UPDATE ] })
    const id = category.getId()
    const user = await load<User>(User, category.getCreator())
    const token = (await auth(user)).token
    const res = await request(app).patch(`/categories/${ id.toString() }`).send({ name: category1.getName() }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(error('ConflictError'))
  })

  test('Updated (has ownership)', async () => {
    const category = await fixture<Category>(Category)
    const id = category.getId()
    const user = await load<User>(User, category.getCreator())
    const token = (await auth(user)).token
    const schema = { name: 'any' }
    const res = await request(app).patch(`/categories/${ id.toString() }`).send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await load<Category>(Category, id)).toMatchObject(schema)
  })

  test('Updated (has permission)', async () => {
    const category = await fixture<Category>(Category)
    const id = category.getId()
    const permissions = [
      CategoryPermission.UPDATE,
    ]
    const user = await fixture<User>(User, { permissions })
    const token = (await auth(user)).token
    const schema = { name: 'any' }
    const res = await request(app).patch(`/categories/${ id.toString() }`).send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await load<Category>(Category, id)).toMatchObject(schema)
  })
})