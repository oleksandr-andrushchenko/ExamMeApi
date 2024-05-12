import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/Category'
import User from '../../../../src/entities/User'
import { ObjectId } from 'mongodb'
import CategoryPermission from '../../../../src/enums/category/CategoryPermission'
// @ts-ignore
import { addCategoryMutation } from '../../graphql/category/addCategoryMutation'
import CategorySchema from '../../../../src/schema/category/CategorySchema'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Create category', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).post('/categories').send({ name: 'any' })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(framework.error('AuthorizationRequiredError'))
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
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/categories').send(body).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User, { permissions: [] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/categories').send({ name: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(framework.error('ForbiddenError'))
  })
  test('Conflict', async () => {
    await framework.clear(Category)
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/categories').send({ name: category.name }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(framework.error('ConflictError'))
  })
  test('Created', async () => {
    await framework.clear(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const category = { name: 'any', requiredScore: 80 }
    const now = Date.now()
    const res = await request(framework.app).post('/categories').send(category).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(201)
    expect(res.body).toMatchObject(category)
    expect(res.body).toHaveProperty('id')
    const id = new ObjectId(res.body.id)
    const latestCategory = await framework.load<Category>(Category, id)
    expect(latestCategory).toMatchObject(category)
    expect(res.body).toEqual({
      id: latestCategory.id.toString(),
      name: latestCategory.name,
      ownerId: latestCategory.ownerId.toString(),
      questionCount: latestCategory.questionCount,
      requiredScore: latestCategory.requiredScore,
      voters: latestCategory.voters,
      rating: latestCategory.rating,
      createdAt: latestCategory.createdAt.getTime(),
    })
    expect(latestCategory.createdAt.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body).not.toHaveProperty([ 'creatorId', 'updatedAt', 'deletedAt' ])
  })
  test('Unauthorized (GraphQL)', async () => {
    const res = await request(framework.app).post('/graphql').send(addCategoryMutation({ category: { name: 'any' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
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
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/graphql')
      .send(addCategoryMutation({ category: category as CategorySchema }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Forbidden (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/graphql')
      .send(addCategoryMutation({ category: { name: 'any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict (GraphQL)', async () => {
    await framework.clear(Category)
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/graphql')
      .send(addCategoryMutation({ category: { name: category.name } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Created (GraphQL)', async () => {
    await framework.clear(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const category = { name: 'any', requiredScore: 80 }
    const fields = [ 'id', 'name', 'questionCount', 'requiredScore', 'voters', 'rating', 'createdAt', 'updatedAt' ]
    const now = Date.now()
    const res = await request(framework.app)
      .post('/graphql')
      .send(addCategoryMutation({ category }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { addCategory: category } })
    expect(res.body.data.addCategory).toHaveProperty('id')
    const id = new ObjectId(res.body.data.addCategory.id)
    const latestCategory = await framework.load<Category>(Category, id)
    expect(latestCategory).toMatchObject(category)
    expect(res.body.data.addCategory).toEqual({
      id: latestCategory.id.toString(),
      name: latestCategory.name,
      questionCount: latestCategory.questionCount,
      requiredScore: latestCategory.requiredScore,
      voters: latestCategory.voters,
      rating: latestCategory.rating,
      createdAt: latestCategory.createdAt.getTime(),
      updatedAt: null,
    })
    expect(latestCategory.createdAt.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body.data.addCategory).not.toHaveProperty([ 'creatorId', 'deletedAt' ])
  })
})