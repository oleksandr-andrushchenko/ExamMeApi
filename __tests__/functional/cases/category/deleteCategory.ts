import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/Category'
import User from '../../../../src/entities/User'
import CategoryPermission from '../../../../src/enums/category/CategoryPermission'
// @ts-ignore
import { removeCategoryMutation } from '../../graphql/category/removeCategoryMutation'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Delete category', () => {
  test('Unauthorized', async () => {
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).delete(`/categories/${ category.id.toString() }`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(framework.error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).delete('/categories/invalid').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).delete(`/categories/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(framework.error('NotFoundError'))
  })
  test('Forbidden (no permissions)', async () => {
    const user = await framework.fixture<User>(User)
    const category = await framework.fixture<Category>(Category)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).delete(`/categories/${ category.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(framework.error('ForbiddenError'))
  })
  test('Forbidden (no ownership)', async () => {
    const user = await framework.fixture<User>(User)
    const category = await framework.fixture<Category>(Category, { owner: await framework.fixture<User>(User) })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).delete(`/categories/${ category.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(framework.error('ForbiddenError'))
  })
  test('Deleted (has ownership)', async () => {
    const category = await framework.fixture<Category>(Category)
    const user = await framework.load<User>(User, category.creator)
    const token = (await framework.auth(user)).token
    const now = Date.now()
    const res = await request(framework.app).delete(`/categories/${ category.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    const latestCategory = await framework.load<Category>(Category, category.id)
    expect(latestCategory).not.toBeNull()
    expect(latestCategory.deleted.getTime()).toBeGreaterThanOrEqual(now)
  })
  test('Deleted (has permission)', async () => {
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const now = Date.now()
    const res = await request(framework.app).delete(`/categories/${ category.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    const latestCategory = await framework.load<Category>(Category, category.id)
    expect(latestCategory).not.toBeNull()
    expect(latestCategory.deleted.getTime()).toBeGreaterThanOrEqual(now)
  })
  test('Unauthorized (GraphQL)', async () => {
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).post('/graphql')
      .send(removeCategoryMutation({ categoryId: category.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(removeCategoryMutation({ categoryId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/graphql')
      .send(removeCategoryMutation({ categoryId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden (no permissions) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const category = await framework.fixture<Category>(Category)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(removeCategoryMutation({ categoryId: category.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Forbidden (no ownership) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const category = await framework.fixture<Category>(Category, { owner: await framework.fixture<User>(User) })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(removeCategoryMutation({ categoryId: category.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Deleted (has ownership) (GraphQL)', async () => {
    const category = await framework.fixture<Category>(Category)
    const user = await framework.load<User>(User, category.creator)
    const token = (await framework.auth(user)).token
    const now = Date.now()
    const res = await request(framework.app).post('/graphql')
      .send(removeCategoryMutation({ categoryId: category.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { removeCategory: true } })
    const latestCategory = await framework.load<Category>(Category, category.id)
    expect(latestCategory).not.toBeNull()
    expect(latestCategory.deleted.getTime()).toBeGreaterThanOrEqual(now)
  })
  test('Deleted (has permission) (GraphQL)', async () => {
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const now = Date.now()
    const res = await request(framework.app).post('/graphql')
      .send(removeCategoryMutation({ categoryId: category.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { removeCategory: true } })
    const latestCategory = await framework.load<Category>(Category, category.id)
    expect(latestCategory).not.toBeNull()
    expect(latestCategory.deleted.getTime()).toBeGreaterThanOrEqual(now)
  })
})