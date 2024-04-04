import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { api, auth, error, fakeId, fixture, load } from '../../index'
import Category from '../../../src/entity/Category'
import User from '../../../src/entity/User'
import Permission from '../../../src/enum/auth/Permission'

describe('DELETE /categories/:categoryId', () => {
  const app = api()

  test('Unauthorized', async () => {
    const category = await fixture<Category>(Category)
    const id = category.getId()
    const res = await request(app).delete(`/categories/${ id.toString() }`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })

  test('Bad request (invalid id)', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.DELETE_CATEGORY ] })
    const token = (await auth(user)).token
    const id = 'invalid'
    const res = await request(app).delete(`/categories/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })

  test('Not found', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.DELETE_CATEGORY ] })
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).delete(`/categories/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })

  test('Forbidden (no permissions)', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.REGULAR ] })
    const category = await fixture<Category>(Category)
    const id = category.getId()
    const token = (await auth(user)).token
    const res = await request(app).delete(`/categories/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })

  test('Forbidden (no ownership)', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.DELETE_CATEGORY ] })
    const category = await fixture<Category>(Category)
    const id = category.getId()
    const token = (await auth(user)).token
    const res = await request(app).delete(`/categories/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })

  test('Deleted', async () => {
    const category = await fixture<Category>(Category, { permissions: [ Permission.DELETE_CATEGORY ] })
    const id = category.getId()
    const user = await load<User>(User, category.getCreator())
    const token = (await auth(user)).token
    const res = await request(app).delete(`/categories/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    expect(await load<Category>(Category, id)).toBeNull()
  })
})