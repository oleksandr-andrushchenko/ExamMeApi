import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/Category'
import User from '../../../../src/entities/User'
import { ObjectId } from 'mongodb'
import CategoryPermission from '../../../../src/enums/category/CategoryPermission'
// @ts-ignore
import { createCategory } from '../../graphql/category/createCategory'
import CreateCategory from '../../../../src/schema/category/CreateCategory'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Create category', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).post('/').send(createCategory({ createCategory: { name: 'any' } }))

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
  ])('Bad request ($case)', async ({ category }) => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Create ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(createCategory({ createCategory: category as CreateCategory }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User, { permissions: [] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(createCategory({ createCategory: { name: 'any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict', async () => {
    await framework.clear(Category)
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Create ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(createCategory({ createCategory: { name: category.name } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Created', async () => {
    await framework.clear(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Create ] })
    const token = (await framework.auth(user)).token
    const category = { name: 'any', requiredScore: 80 }
    const fields = [ 'id', 'name', 'questionCount', 'requiredScore', 'rating {value voterCount}', 'createdAt', 'updatedAt' ]
    const now = Date.now()
    const res = await request(framework.app)
      .post('/')
      .send(createCategory({ createCategory: category }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { createCategory: category } })
    expect(res.body.data.createCategory).toHaveProperty('id')
    const id = new ObjectId(res.body.data.createCategory.id)
    const latestCategory = await framework.load<Category>(Category, id)
    expect(latestCategory).toMatchObject(category)
    expect(res.body.data.createCategory).toEqual({
      id: latestCategory.id.toString(),
      name: latestCategory.name,
      questionCount: latestCategory.questionCount,
      requiredScore: latestCategory.requiredScore,
      rating: null,
      createdAt: latestCategory.createdAt.getTime(),
      updatedAt: null,
    })
    expect(latestCategory.createdAt.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body.data.createCategory).not.toHaveProperty([ 'creatorId', 'deletedAt' ])
  })
})