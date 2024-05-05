import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { auth, error, fixture, graphqlError, load, server as app } from '../../index'
import Category from '../../../src/entities/Category'
import User from '../../../src/entities/User'
import { ObjectId } from 'mongodb'
import CategoryPermission from '../../../src/enums/category/CategoryPermission'
// @ts-ignore
import { addCategoryMutation } from '../../graphql/category/addCategoryMutation'
import CategorySchema from '../../../src/schema/category/CategorySchema'

describe('Create category', () => {
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
    const user = await fixture<User>(User, { permissions: [ CategoryPermission.CREATE ] })
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
    const res = await request(app).post('/categories').send({ name: category.name }).auth(token, { type: 'bearer' })

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
  test('Unauthorized (GraphQL)', async () => {
    const res = await request(app).post('/graphql').send(addCategoryMutation({ category: { name: 'any' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('AuthorizationRequiredError'))
  })
  test.each([
    { case: 'empty category', category: {} },
    { case: 'no name', category: { requiredScore: 80 } },
    { case: 'name is null', category: { name: null, requiredScore: 80 } },
    { case: 'name is undefined', category: { name: undefined, requiredScore: 80 } },
    { case: 'name too short', category: { name: 'a', requiredScore: 80 } },
    { case: 'name too long', category: { name: 'abc'.repeat(99), requiredScore: 80 } },
    { case: 'required score is null', category: { name: 'Any category', requiredScore: null } },
    { case: 'required score is string', category: { name: 'Any category', requiredScore: 'any' } },
    { case: 'required score is float', category: { name: 'Any category', requiredScore: 0.1 } },
    { case: 'required score is negative', category: { name: 'Any category', requiredScore: -1 } },
    { case: 'required score is greater then 100', category: { name: 'Any category', requiredScore: 101 } },
  ])('Bad request ($case) (GraphQL)', async ({ category }) => {
    const user = await fixture<User>(User, { permissions: [ CategoryPermission.CREATE ] })
    const token = (await auth(user)).token
    const res = await request(app)
      .post('/graphql')
      .send(addCategoryMutation({ category: category as CategorySchema }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Forbidden (GraphQL)', async () => {
    const user = await fixture<User>(User, { permissions: [] })
    const token = (await auth(user)).token
    const res = await request(app)
      .post('/graphql')
      .send(addCategoryMutation({ category: { name: 'any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Conflict (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const user = await fixture<User>(User, { permissions: [ CategoryPermission.CREATE ] })
    const token = (await auth(user)).token
    const res = await request(app)
      .post('/graphql')
      .send(addCategoryMutation({ category: { name: category.name } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ConflictError'))
  })
  test('Created (GraphQL)', async () => {
    const user = await fixture<User>(User, { permissions: [ CategoryPermission.CREATE ] })
    const token = (await auth(user)).token
    const category = { name: 'any', requiredScore: 80 }
    const res = await request(app)
      .post('/graphql')
      .send(addCategoryMutation({ category }, [ 'id', 'name', 'requiredScore' ]))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { addCategory: category } })
    expect(res.body.data.addCategory).toHaveProperty('id')
    const id = new ObjectId(res.body.data.addCategory.id)
    expect(await load<Category>(Category, id)).toMatchObject(category)
  })
})