import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/category/Category'
import User from '../../../../src/entities/user/User'
import CategoryPermission from '../../../../src/enums/category/CategoryPermission'
// @ts-ignore
import { rateCategory } from '../../graphql/category/rateCategory'
import TestFramework from '../../TestFramework'
import Activity from '../../../../src/entities/activity/Activity'
import CategoryEvent from '../../../../src/enums/category/CategoryEvent'
import RatingMark from '../../../../src/entities/rating/RatingMark'

const framework: TestFramework = globalThis.framework

describe('Rate category', () => {
  test('Unauthorized', async () => {
    const category = await framework.fixture<Category>(Category)
    const categoryId = category.id.toString()
    const res = await request(framework.app).post('/')
      .send(rateCategory({ categoryId, mark: 1 }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid category id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Rate ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(rateCategory({ categoryId: 'invalid', mark: 1 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Rate ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(rateCategory({ categoryId: id.toString(), mark: 1 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden (no permission)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [] })
    const category = await framework.fixture<Category>(Category)
    const categoryId = category.id.toString()
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(rateCategory({ categoryId, mark: 1 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Rated', async () => {
    await framework.clear(RatingMark)
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Rate ] })
    const token = (await framework.auth(user)).token
    const categoryId = category.id.toString()
    const res = await request(framework.app).post('/')
      .send(rateCategory({ categoryId, mark: 4 }, [ 'id', 'ownerId' ]))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { rateCategory: { id: categoryId } } })

    const updatedCategory = await framework.load<Category>(Category, category.id)
    expect(updatedCategory).not.toHaveProperty('ownerId')

    expect(await framework.repo(Activity).countBy({
      event: CategoryEvent.Rated,
      categoryId: category.id,
    })).toEqual(1)
  })
})