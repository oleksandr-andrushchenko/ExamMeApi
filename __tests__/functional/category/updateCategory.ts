import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, graphqlError, load, server as app } from '../../index'
import Category from '../../../src/entities/Category'
import User from '../../../src/entities/User'
import CategoryPermission from '../../../src/enums/category/CategoryPermission'
// @ts-ignore
import { updateCategoryMutation } from '../../graphql/category/updateCategoryMutation'
import CategoryUpdateSchema from '../../../src/schema/category/CategoryUpdateSchema'

describe('Update category', () => {
  test('Unauthorized', async () => {
    const category = await fixture<Category>(Category)
    const id = category.id
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
    const id = category.id
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).patch(`/categories/${ id.toString() }`).send(body).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Forbidden (no permissions)', async () => {
    const user = await fixture<User>(User)
    const category = await fixture<Category>(Category)
    const id = category.id
    const token = (await auth(user)).token
    const res = await request(app).patch(`/categories/${ id.toString() }`).send({ name: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Forbidden (no ownership)', async () => {
    const user = await fixture<User>(User)
    const category = await fixture<Category>(Category, { owner: await fixture<User>(User) })
    const id = category.id
    const token = (await auth(user)).token
    const res = await request(app).patch(`/categories/${ id.toString() }`).send({ name: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Conflict', async () => {
    const category1 = await fixture<Category>(Category)
    const category = await fixture<Category>(Category, { permissions: [ CategoryPermission.UPDATE ] })
    const id = category.id
    const user = await load<User>(User, category.creator)
    const token = (await auth(user)).token
    const res = await request(app).patch(`/categories/${ id.toString() }`).send({ name: category1.name }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(error('ConflictError'))
  })
  test('Updated (has ownership)', async () => {
    const category = await fixture<Category>(Category)
    const id = category.id
    const user = await load<User>(User, category.creator)
    const token = (await auth(user)).token
    const schema = { name: 'any' }
    const res = await request(app).patch(`/categories/${ id.toString() }`).send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await load<Category>(Category, id)).toMatchObject(schema)
  })
  test('Updated (has permission)', async () => {
    const category = await fixture<Category>(Category)
    const id = category.id
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
  test('Unauthorized (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const categoryId = category.id.toString()
    const res = await request(app).post('/graphql')
      .send(updateCategoryMutation({ categoryId, categoryUpdate: { name: 'Any' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid category id) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(updateCategoryMutation({ categoryId: 'invalid', categoryUpdate: { name: 'Any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Not found (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).post('/graphql')
      .send(updateCategoryMutation({ categoryId: id.toString(), categoryUpdate: { name: 'Any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('NotFoundError'))
  })
  test.each([
    { case: 'name too short', categoryUpdate: { name: 'a' } },
    { case: 'name too long', categoryUpdate: { name: 'abc'.repeat(99) } },
    { case: 'required score is string', categoryUpdate: { requiredScore: 'any' } },
    { case: 'required score is float', categoryUpdate: { requiredScore: 0.1 } },
    { case: 'required score is negative', categoryUpdate: { requiredScore: -1 } },
    { case: 'required score is greater then 100', categoryUpdate: { requiredScore: 101 } },
  ])('Bad request ($case) (GraphQL)', async ({ categoryUpdate }) => {
    const category = await fixture<Category>(Category)
    const categoryId = category.id.toString()
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(updateCategoryMutation({ categoryId, categoryUpdate: categoryUpdate as CategoryUpdateSchema }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Forbidden (no permissions) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const category = await fixture<Category>(Category)
    const categoryId = category.id.toString()
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(updateCategoryMutation({ categoryId, categoryUpdate: { name: 'Any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Forbidden (no ownership) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const category = await fixture<Category>(Category, { owner: await fixture<User>(User) })
    const categoryId = category.id.toString()
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(updateCategoryMutation({ categoryId, categoryUpdate: { name: 'Any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Conflict (GraphQL)', async () => {
    const category1 = await fixture<Category>(Category)
    const category = await fixture<Category>(Category, { permissions: [ CategoryPermission.UPDATE ] })
    const categoryId = category.id.toString()
    const user = await load<User>(User, category.creator)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(updateCategoryMutation({ categoryId, categoryUpdate: { name: category1.name } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ConflictError'))
  })
  test('Updated (has ownership) (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const user = await load<User>(User, category.creator)
    const token = (await auth(user)).token
    const categoryId = category.id.toString()
    const categoryUpdate = { name: 'any' }
    const res = await request(app).post('/graphql')
      .send(updateCategoryMutation({ categoryId, categoryUpdate }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateCategory: { id: categoryId } } })
    expect(await load<Category>(Category, category.id)).toMatchObject(categoryUpdate)
  })
  test('Updated (has permission) (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const permissions = [
      CategoryPermission.UPDATE,
    ]
    const user = await fixture<User>(User, { permissions })
    const token = (await auth(user)).token
    const categoryId = category.id.toString()
    const categoryUpdate = { name: 'any' }
    const res = await request(app).post('/graphql')
      .send(updateCategoryMutation({ categoryId, categoryUpdate }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateCategory: { id: categoryId } } })
    expect(await load<Category>(Category, category.id)).toMatchObject(categoryUpdate)
  })
})