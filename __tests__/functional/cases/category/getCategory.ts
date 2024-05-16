import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/Category'
// @ts-ignore
import { categoryQuery } from '../../graphql/category/categoryQuery'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Get category', () => {
  test('Not found', async () => {
    const id = await framework.fakeId()
    const variables = { categoryId: id.toString() }
    const res = await request(framework.app).post('/').send(categoryQuery(variables))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Bad request (invalid id)', async () => {
    const variables = { categoryId: 'invalid' }
    const res = await request(framework.app).post('/').send(categoryQuery(variables))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Found', async () => {
    const category = await framework.fixture<Category>(Category)
    const fields = [ 'id', 'name', 'questionCount', 'requiredScore', 'voters', 'rating', 'createdAt', 'updatedAt' ]
    const res = await request(framework.app).post('/').send(categoryQuery({ categoryId: category.id.toString() }, fields))

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({
      data: {
        category: {
          id: category.id.toString(),
          name: category.name,
          questionCount: category.questionCount,
          requiredScore: category.requiredScore,
          voters: category.voters,
          rating: category.rating,
          createdAt: category.createdAt.getTime(),
          updatedAt: category.updatedAt?.getTime() ?? null,
        },
      },
    })
    expect(res.body.data.category).not.toHaveProperty([ 'creatorId', 'deletedAt' ])
  })
})