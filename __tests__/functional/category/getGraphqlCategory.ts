import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { fakeId, fixture, graphqlError, server as app } from '../../index'
import Category from '../../../src/entity/Category'

describe('POST /graphql category', () => {
  test('Not found', async () => {
    const id = await fakeId()
    const res = await request(app)
      .post(`/graphql`)
      .send({
        query: `query Category($categoryId: String!) {
          category(id: $categoryId) {
            id
          }
        }`,
        variables: {
          categoryId: id.toString(),
        },
      })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('NotFoundError'))
  })
  test('Bad request (invalid id)', async () => {
    const id = 'invalid'
    const res = await request(app)
      .post(`/graphql`)
      .send({
        query: `query Category($categoryId: String!) {
          category(id: $categoryId) {
            id
          }
        }`,
        variables: {
          categoryId: id.toString(),
        },
      })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Found', async () => {
    const category = await fixture<Category>(Category)
    const id = category.getId()
    const res = await request(app)
      .post(`/graphql`)
      .send({
        query: `query Category($categoryId: String!) {
          category(id: $categoryId) {
            id
            name
            questionCount
            requiredScore
            voters
            rating
          }
        }`,
        variables: {
          categoryId: id.toString(),
        },
      })

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({
      data: {
        category: {
          id: id.toString(),
          name: category.getName(),
          questionCount: category.getQuestionCount(),
          requiredScore: category.getRequiredScore(),
          voters: category.getVoters(),
          rating: category.getRating(),
        },
      },
    })
  })
})