import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { error, fakeId, fixture, graphqlError, server as app } from '../../index'
import Category from '../../../src/entities/Category'
// @ts-ignore
import { categoryQuery } from '../../graphql/category/categoryQuery'

describe('Get category', () => {
  test('Not found', async () => {
    const id = await fakeId()
    const res = await request(app).get(`/categories/${ id.toString() }`)

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Bad request (invalid id)', async () => {
    const res = await request(app).get('/categories/invalid')

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Found', async () => {
    const category = await fixture<Category>(Category)
    const res = await request(app).get(`/categories/${ category.id.toString() }`)

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      id: category.id.toString(),
      name: category.name,
      questionCount: category.questionCount,
      requiredScore: category.requiredScore,
      voters: category.voters,
      rating: category.rating,
      owner: category.owner.toString(),
      created: category.created.getTime(),
    })

    if (category.updated) {
      expect(res.body).toMatchObject({
        updated: category.updated.getTime(),
      })
    }

    expect(res.body).not.toHaveProperty([ 'creator', 'deleted' ])
  })
  test('Not found (GraphQL)', async () => {
    const id = await fakeId()
    const variables = { categoryId: id.toString() }
    const res = await request(app).post('/graphql').send(categoryQuery(variables))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('NotFoundError'))
  })
  test('Bad request (invalid id) (GraphQL)', async () => {
    const variables = { categoryId: 'invalid' }
    const res = await request(app).post('/graphql').send(categoryQuery(variables))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Found (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const fields = [ 'id', 'name', 'questionCount', 'requiredScore', 'voters', 'rating', 'created', 'updated' ]
    const res = await request(app).post('/graphql').send(categoryQuery({ categoryId: category.id.toString() }, fields))

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
          created: category.created.getTime(),
          updated: category.updated?.getTime() ?? null,
        },
      },
    })

    expect(res.body.data.category).not.toHaveProperty([ 'creator', 'deleted' ])
  })
})