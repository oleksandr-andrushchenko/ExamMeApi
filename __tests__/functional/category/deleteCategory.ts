import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, graphqlError, load, server as app } from '../../index'
import Category from '../../../src/entity/Category'
import User from '../../../src/entity/User'
import CategoryPermission from '../../../src/enum/category/CategoryPermission'
// @ts-ignore
import { removeCategoryMutation } from '../../graphql/category/removeCategoryMutation'

describe('Delete category', () => {
  test('Unauthorized', async () => {
    const category = await fixture<Category>(Category)
    const id = category.id
    const res = await request(app).delete(`/categories/${ id.toString() }`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = 'invalid'
    const res = await request(app).delete(`/categories/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).delete(`/categories/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Forbidden (no permissions)', async () => {
    const user = await fixture<User>(User)
    const category = await fixture<Category>(Category)
    const id = category.id
    const token = (await auth(user)).token
    const res = await request(app).delete(`/categories/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Forbidden (no ownership)', async () => {
    const user = await fixture<User>(User)
    const category = await fixture<Category>(Category, { owner: await fixture<User>(User) })
    const id = category.id
    const token = (await auth(user)).token
    const res = await request(app).delete(`/categories/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Deleted (has ownership)', async () => {
    const category = await fixture<Category>(Category)
    const id = category.id
    const user = await load<User>(User, category.creator)
    const token = (await auth(user)).token
    const res = await request(app).delete(`/categories/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    expect(await load<Category>(Category, id)).toBeNull()
  })
  test('Deleted (has permission)', async () => {
    const category = await fixture<Category>(Category)
    const id = category.id
    const permissions = [
      CategoryPermission.DELETE,
    ]
    const user = await fixture<User>(User, { permissions })
    const token = (await auth(user)).token
    const res = await request(app).delete(`/categories/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    expect(await load<Category>(Category, id)).toBeNull()
  })
  test('Unauthorized (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const id = category.id
    const res = await request(app).post(`/graphql`).send(removeCategoryMutation({ categoryId: id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = 'invalid'
    const res = await request(app)
      .post(`/graphql`)
      .send(removeCategoryMutation({ categoryId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Not found (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app)
      .post(`/graphql`)
      .send(removeCategoryMutation({ categoryId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('NotFoundError'))
  })
  test('Forbidden (no permissions) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const category = await fixture<Category>(Category)
    const id = category.id
    const token = (await auth(user)).token
    const res = await request(app).post(`/graphql`)
      .send(removeCategoryMutation({ categoryId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Forbidden (no ownership) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const category = await fixture<Category>(Category, { owner: await fixture<User>(User) })
    const id = category.id
    const token = (await auth(user)).token
    const res = await request(app).post(`/graphql`)
      .send(removeCategoryMutation({ categoryId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Deleted (has ownership) (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const id = category.id
    const user = await load<User>(User, category.creator)
    const token = (await auth(user)).token
    const res = await request(app).post(`/graphql`)
      .send(removeCategoryMutation({ categoryId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { removeCategory: true } })
    expect(await load<Category>(Category, id)).toBeNull()
  })
  test('Deleted (has permission) (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const id = category.id
    const permissions = [
      CategoryPermission.DELETE,
    ]
    const user = await fixture<User>(User, { permissions })
    const token = (await auth(user)).token
    const res = await request(app).post(`/graphql`)
      .send(removeCategoryMutation({ categoryId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { removeCategory: true } })
    expect(await load<Category>(Category, id)).toBeNull()
  })
})