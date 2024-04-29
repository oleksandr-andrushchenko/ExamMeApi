import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { auth, error, fixture, graphqlError, load, server as app } from '../../index'
import User from '../../../src/entity/User'
// @ts-ignore
import { addCategoryMutation } from '../../graphql/category/addCategoryMutation'
import Category from '../../../src/entity/Category'
import CategoryPermission from '../../../src/enum/category/CategoryPermission'
import { ObjectId } from 'mongodb'

describe('POST /graphql addCategory', () => {
  test('Unauthorized', async () => {
    const res = await request(app).post(`/graphql`).send(addCategoryMutation([ 'id' ], { category: { name: 'any' } }))

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
  ])('Bad request ($case)', async ({ category }) => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app)
      .post(`/graphql`)
      .send(addCategoryMutation([ 'id' ], { category }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await fixture<User>(User, { permissions: [] })
    const token = (await auth(user)).token
    const res = await request(app)
      .post(`/graphql`)
      .send(addCategoryMutation([ 'id' ], { category: { name: 'any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Conflict', async () => {
    const category = await fixture<Category>(Category)
    const user = await fixture<User>(User, { permissions: [ CategoryPermission.CREATE ] })
    const token = (await auth(user)).token
    const res = await request(app)
      .post(`/graphql`)
      .send(addCategoryMutation([ 'id' ], { category: { name: category.getName() } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ConflictError'))
  })
  test('Created', async () => {
    const user = await fixture<User>(User, { permissions: [ CategoryPermission.CREATE ] })
    const token = (await auth(user)).token
    const category = { name: 'any', requiredScore: 80 }
    const res = await request(app)
      .post(`/graphql`)
      .send(addCategoryMutation([ 'id', 'name', 'requiredScore' ], { category }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { addCategory: category } })
    expect(res.body.data.addCategory).toHaveProperty('id')
    const id = new ObjectId(res.body.data.addCategory.id)
    expect(await load<Category>(Category, id)).toMatchObject(category)
  })
})