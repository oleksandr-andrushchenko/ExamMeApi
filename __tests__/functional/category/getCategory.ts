import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { error, fakeId, fixture, server as app } from '../../index'
import Category from '../../../src/entity/Category'

describe('GET /categories/:categoryId', () => {
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
    const id = category.getId()
    const res = await request(app).get(`/categories/${ id.toString() }`)

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      id: id.toString(),
      name: category.getName(),
      requiredScore: category.getRequiredScore(),
    })

    for (const allowed of [ 'created', 'updated' ]) {
      expect(res.body).toHaveProperty(allowed)
    }

    for (const forbidden of [ 'creator', 'owner' ]) {
      expect(res.body).not.toHaveProperty(forbidden)
    }
  })
})