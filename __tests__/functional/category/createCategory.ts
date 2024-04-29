import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { auth, error, fixture, load, server as app } from '../../index'
import Category from '../../../src/entity/Category'
import User from '../../../src/entity/User'
import { ObjectId } from 'mongodb'
import CategoryPermission from '../../../src/enum/category/CategoryPermission'

describe('POST /categories', () => {
  test('Unauthorized', async () => {
    const res = await request(app).post('/categories').send({ name: 'any' })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
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
    const res = await request(app).post('/categories').send(body).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await fixture<User>(User, { permissions: [] })
    const token = (await auth(user)).token
    const res = await request(app).post('/categories').send({ name: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Conflict', async () => {
    const category = await fixture<Category>(Category)
    const user = await fixture<User>(User, { permissions: [ CategoryPermission.CREATE ] })
    const token = (await auth(user)).token
    const res = await request(app).post('/categories').send({ name: category.getName() }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(error('ConflictError'))
  })
  test('Created', async () => {
    const user = await fixture<User>(User, { permissions: [ CategoryPermission.CREATE ] })
    const token = (await auth(user)).token
    const schema = { name: 'any', requiredScore: 80 }
    const res = await request(app).post('/categories').send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(201)
    expect(res.body).toHaveProperty('id')
    const id = new ObjectId(res.body.id)
    expect(res.body).toMatchObject(schema)
    expect(await load<Category>(Category, id)).toMatchObject(schema)
  })
})