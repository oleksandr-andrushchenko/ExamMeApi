import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/Category'
import User from '../../../../src/entities/User'
import CategoryPermission from '../../../../src/enums/category/CategoryPermission'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Replace category', () => {
  test('Unauthorized', async () => {
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).put(`/categories/${ category.id.toString() }`).send({ name: 'any' })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(framework.error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.REPLACE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).put('/categories/invalid').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.REPLACE ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).put(`/categories/${ id.toString() }`)
      .send({ name: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(framework.error('NotFoundError'))
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
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.REPLACE ] })
    const token = (await framework.auth(user)).token
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).put(`/categories/${ category.id.toString() }`)
      .send(body).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Forbidden (no permissions)', async () => {
    const user = await framework.fixture<User>(User)
    const category = await framework.fixture<Category>(Category)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).put(`/categories/${ category.id.toString() }`)
      .send({ name: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(framework.error('ForbiddenError'))
  })
  test('Forbidden (no ownership)', async () => {
    const user = await framework.fixture<User>(User)
    const category = await framework.fixture<Category>(Category)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).put(`/categories/${ category.id.toString() }`)
      .send({ name: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(framework.error('ForbiddenError'))
  })
  test('Conflict', async () => {
    const category1 = await framework.fixture<Category>(Category)
    const category = await framework.fixture<Category>(Category, { permissions: [ CategoryPermission.REPLACE ] })
    const user = await framework.load<User>(User, category.creatorId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).put(`/categories/${ category.id.toString() }`)
      .send({ name: category1.name })
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(framework.error('ConflictError'))
  })
  test('Replaced (has ownership)', async () => {
    await framework.clear(Category)
    const category = await framework.fixture<Category>(Category)
    const user = await framework.load<User>(User, category.creatorId)
    const token = (await framework.auth(user)).token
    const schema = { name: 'any' }
    const res = await request(framework.app).put(`/categories/${ category.id.toString() }`)
      .send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await framework.load<Category>(Category, category.id)).toMatchObject(schema)
  })
  test('Replaced (has permission)', async () => {
    await framework.clear(Category)
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.REPLACE ] })
    const token = (await framework.auth(user)).token
    const schema = { name: 'any' }
    const res = await request(framework.app).put(`/categories/${ category.id.toString() }`)
      .send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await framework.load<Category>(Category, category.id)).toMatchObject(schema)
  })
})