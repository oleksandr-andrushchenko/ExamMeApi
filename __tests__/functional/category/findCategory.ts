import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { api, error, fakeId, fixture } from '../../index'
import Category from '../../../src/entity/Category'

describe('GET /categories/:category_id', () => {
  const app = api()

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
    expect(res.body).toMatchObject({ id: id.toString(), name: category.getName() })
  })
})