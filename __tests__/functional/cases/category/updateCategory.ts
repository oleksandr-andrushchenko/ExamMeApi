import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/Category'
import User from '../../../../src/entities/User'
import CategoryPermission from '../../../../src/enums/category/CategoryPermission'
// @ts-ignore
import { updateCategoryMutation } from '../../graphql/category/updateCategoryMutation'
import CategoryUpdateSchema from '../../../../src/schema/category/CategoryUpdateSchema'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Update category', () => {
  test('Unauthorized', async () => {
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).patch(`/categories/${ category.id.toString() }`).send({ name: 'any' })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(framework.error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid category id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).patch('/categories/invalid')
      .send({ name: 'Any category' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app)
      .patch(`/categories/${ id.toString() }`)
      .send({ name: 'any' })
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(framework.error('NotFoundError'))
  })
  test.each([
    { case: 'name too short', body: { name: 'a' } },
    { case: 'name too long', body: { name: 'abc'.repeat(99) } },
    { case: 'required score is string', body: { requiredScore: 'any' } },
    { case: 'required score is float', body: { requiredScore: 0.1 } },
    { case: 'required score is negative', body: { requiredScore: -1 } },
    { case: 'required score is greater then 100', body: { requiredScore: 101 } },
  ])('Bad request ($case)', async ({ body }) => {
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).patch(`/categories/${ category.id.toString() }`)
      .send(body).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Forbidden (no permissions)', async () => {
    const user = await framework.fixture<User>(User)
    const category = await framework.fixture<Category>(Category)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).patch(`/categories/${ category.id.toString() }`)
      .send({ name: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(framework.error('ForbiddenError'))
  })
  test('Forbidden (no ownership)', async () => {
    const user = await framework.fixture<User>(User)
    const category = await framework.fixture<Category>(Category)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).patch(`/categories/${ category.id.toString() }`)
      .send({ name: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(framework.error('ForbiddenError'))
  })
  test('Conflict', async () => {
    const category1 = await framework.fixture<Category>(Category)
    const category = await framework.fixture<Category>(Category, { permissions: [ CategoryPermission.UPDATE ] })
    const user = await framework.load<User>(User, category.creatorId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).patch(`/categories/${ category.id.toString() }`)
      .send({ name: category1.name }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(framework.error('ConflictError'))
  })
  test('Updated (has ownership)', async () => {
    await framework.clear(Category)
    const category = await framework.fixture<Category>(Category)
    const user = await framework.load<User>(User, category.creatorId)
    const token = (await framework.auth(user)).token
    const schema = { name: 'any' }
    const res = await request(framework.app).patch(`/categories/${ category.id.toString() }`)
      .send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await framework.load<Category>(Category, category.id)).toMatchObject(schema)
  })
  test('Updated (has permission)', async () => {
    await framework.clear(Category)
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const schema = { name: 'any' }
    const res = await request(framework.app).patch(`/categories/${ category.id.toString() }`)
      .send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await framework.load<Category>(Category, category.id)).toMatchObject(schema)
  })
  test('Unauthorized (GraphQL)', async () => {
    const category = await framework.fixture<Category>(Category)
    const categoryId = category.id.toString()
    const res = await request(framework.app).post('/graphql')
      .send(updateCategoryMutation({ categoryId, categoryUpdate: { name: 'Any' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid category id) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(updateCategoryMutation({ categoryId: 'invalid', categoryUpdate: { name: 'Any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/graphql')
      .send(updateCategoryMutation({ categoryId: id.toString(), categoryUpdate: { name: 'Any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test.each([
    { case: 'name too short', categoryUpdate: { name: 'a' } },
    { case: 'name too long', categoryUpdate: { name: 'abc'.repeat(99) } },
    { case: 'required score is string', categoryUpdate: { requiredScore: 'any' } },
    { case: 'required score is float', categoryUpdate: { requiredScore: 0.1 } },
    { case: 'required score is negative', categoryUpdate: { requiredScore: -1 } },
    { case: 'required score is greater then 100', categoryUpdate: { requiredScore: 101 } },
  ])('Bad request ($case) (GraphQL)', async ({ categoryUpdate }) => {
    const category = await framework.fixture<Category>(Category)
    const categoryId = category.id.toString()
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(updateCategoryMutation({ categoryId, categoryUpdate: categoryUpdate as CategoryUpdateSchema }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Forbidden (no permissions) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const category = await framework.fixture<Category>(Category)
    const categoryId = category.id.toString()
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(updateCategoryMutation({ categoryId, categoryUpdate: { name: 'Any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Forbidden (no ownership) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const category = await framework.fixture<Category>(Category)
    const categoryId = category.id.toString()
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(updateCategoryMutation({ categoryId, categoryUpdate: { name: 'Any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict (GraphQL)', async () => {
    const category1 = await framework.fixture<Category>(Category)
    const category = await framework.fixture<Category>(Category, { permissions: [ CategoryPermission.UPDATE ] })
    const categoryId = category.id.toString()
    const user = await framework.load<User>(User, category.creatorId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(updateCategoryMutation({ categoryId, categoryUpdate: { name: category1.name } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Updated (has ownership) (GraphQL)', async () => {
    await framework.clear(Category)
    const category = await framework.fixture<Category>(Category)
    const user = await framework.load<User>(User, category.creatorId)
    const token = (await framework.auth(user)).token
    const categoryId = category.id.toString()
    const categoryUpdate = { name: 'any' }
    const res = await request(framework.app).post('/graphql')
      .send(updateCategoryMutation({ categoryId, categoryUpdate }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateCategory: { id: categoryId } } })
    expect(await framework.load<Category>(Category, category.id)).toMatchObject(categoryUpdate)
  })
  test('Updated (has permission) (GraphQL)', async () => {
    await framework.clear(Category)
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const categoryId = category.id.toString()
    const categoryUpdate = { name: 'any' }
    const res = await request(framework.app).post('/graphql')
      .send(updateCategoryMutation({ categoryId, categoryUpdate }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateCategory: { id: categoryId } } })
    expect(await framework.load<Category>(Category, category.id)).toMatchObject(categoryUpdate)
  })
})