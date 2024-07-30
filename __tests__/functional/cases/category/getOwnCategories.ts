import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { getOwnCategories } from '../../graphql/category/getOwnCategories'
import TestFramework from '../../TestFramework'
import User from '../../../../src/entities/user/User'
import Category from '../../../../src/entities/category/Category'

const framework: TestFramework = globalThis.framework

describe('Get own categories', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).post('/')
      .send(getOwnCategories())

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Empty', async () => {
    await framework.clear(Category)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(getOwnCategories())
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({ data: { ownCategories: [] } })
  })
  test('Not empty', async () => {
    await framework.clear(Category)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const ownerId = user.id
    const categories = (await Promise.all([
      framework.fixture<Category>(Category, { ownerId }),
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category, { ownerId }),
    ])).sort((a: Category, b: Category) => a.id.toString().localeCompare(b.id.toString()))

    const res = await request(framework.app).post('/')
      .send(getOwnCategories())
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('ownCategories')

    const ownCategories = categories.filter(category => category.ownerId.toString() === ownerId.toString())
    expect(res.body.data.ownCategories).toHaveLength(ownCategories.length)

    const resCategories = res.body.data.ownCategories.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in resCategories) {
      expect(resCategories[index]).toMatchObject({
        id: resCategories[index].id.toString(),
      })
    }
  })
})