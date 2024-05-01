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
    const id = 'invalid'
    const res = await request(app).get(`/categories/${ id.toString() }`)

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Found', async () => {
    const category = await fixture<Category>(Category)
    const id = category.id
    const res = await request(app).get(`/categories/${ id.toString() }`)

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      id: id.toString(),
      name: category.name,
      requiredScore: category.requiredScore,
    })

    for (const allowed of [ 'created', 'updated' ]) {
      expect(res.body).toHaveProperty(allowed)
    }

    for (const forbidden of [ 'creator', 'owner' ]) {
      expect(res.body).not.toHaveProperty(forbidden)
    }
  })
  test('Not found (GraphQL)', async () => {
    const id = await fakeId()
    const variables = { categoryId: id.toString() }
    const res = await request(app).post(`/graphql`).send(categoryQuery([ 'id' ], variables))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('NotFoundError'))
  })
  test('Bad request (invalid id) (GraphQL)', async () => {
    const id = 'invalid'
    const variables = { categoryId: id.toString() }
    const res = await request(app).post(`/graphql`).send(categoryQuery([ 'id' ], variables))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Found (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const id = category.id
    const fields = [ 'id', 'name', 'questionCount', 'requiredScore', 'voters', 'rating' ]
    const variables = { categoryId: id.toString() }
    const res = await request(app).post(`/graphql`).send(categoryQuery(fields, variables))

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({
      data: {
        category: {
          id: id.toString(),
          name: category.name,
          questionCount: category.questionCount,
          requiredScore: category.requiredScore,
          voters: category.voters,
          rating: category.rating,
        },
      },
    })
  })
})