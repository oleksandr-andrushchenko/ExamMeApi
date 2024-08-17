import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/user/User'
import Exam from '../../../../src/entities/exam/Exam'
import Category from '../../../../src/entities/category/Category'
// @ts-ignore
import { getCategoryRatingMarks } from '../../graphql/category/getCategoryRatingMarks'
import TestFramework from '../../TestFramework'
import GetCategoryRatingMarksRequest from '../../../../src/schema/category/GetCategoryRatingMarksRequest'
import RatingMark from '../../../../src/entities/rating/RatingMark'

const framework: TestFramework = globalThis.framework

describe('Get category rating marks', () => {
  test('Unauthorized', async () => {
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).post('/')
      .send(getCategoryRatingMarks({ categoryIds: [ category.id.toString() ] }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test.each([
    { case: 'empty body', query: {} },
    { case: 'category ids is null', query: { categoryIds: null } },
    { case: 'category ids is number', query: { categoryIds: 1 } },
    { case: 'category ids is empty array', query: { categoryIds: [] } },
    { case: 'category ids with null', query: { categoryIds: [ null ] } },
    { case: 'category ids with number', query: { categoryIds: [ 1 ] } },
    { case: 'category ids with invalid id', query: { categoryIds: [ 'any' ] } },
  ])('Bad request ($case)', async ({ query }) => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(getCategoryRatingMarks(query as GetCategoryRatingMarksRequest))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Empty', async () => {
    await framework.clear(Exam)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).post('/')
      .send(getCategoryRatingMarks({ categoryIds: [ category.id.toString() ] }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({ data: { categoryRatingMarks: [] } })
  })
  test('Non-empty', async () => {
    await framework.clear()
    const categories = (await Promise.all([
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category),
    ]))
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const ratingMarks = (await Promise.all([
      framework.fixture<RatingMark>(RatingMark, { categoryId: categories[0].id, creatorId: user.id }),
      framework.fixture<RatingMark>(RatingMark, { categoryId: categories[1].id, creatorId: user.id }),
      framework.fixture<RatingMark>(RatingMark, { categoryId: categories[2].id, creatorId: user.id }),
    ])).sort((a, b) => a.id.toString().localeCompare(b.id.toString()))

    const fields = [ 'id', 'categoryId', 'mark', 'createdAt', 'updatedAt' ]
    const res = await request(framework.app).post('/')
      .send(getCategoryRatingMarks({ categoryIds: categories.map(category => category.id.toString()) }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('categoryRatingMarks')

    expect(res.body.data.categoryRatingMarks).toHaveLength(ratingMarks.length)

    const resRatingMarks = res.body.data.categoryRatingMarks.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in ratingMarks) {
      expect(resRatingMarks[index]).toMatchObject({
        id: ratingMarks[index].id.toString(),
        categoryId: ratingMarks[index].categoryId.toString(),
        mark: ratingMarks[index].mark,
        createdAt: ratingMarks[index].createdAt.getTime(),
        updatedAt: ratingMarks[index].updatedAt?.getTime() ?? null,
      })
    }
  })
})