import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { api, fixture } from '../../index'
import Category from '../../../src/entity/Category'

describe('GET /categories', () => {
  const app = api()

  test('Empty', async () => {
    const res = await request(app).get('/categories')

    expect(res.status).toEqual(200)
    expect(res.body.data).toEqual([])
  })

  test('Not empty', async () => {
    const categories = await Promise.all([ fixture<Category>(Category), fixture<Category>(Category) ])

    const res = await request(app).get('/categories').query({ size: 50 })

    expect(res.status).toEqual(200)
    expect(res.body.data).toHaveLength(categories.length)
    const body = res.body.data.sort((a, b) => a.name.localeCompare(b.name))
    categories.sort((a, b) => a.getName().localeCompare(b.getName())).forEach((category, index) => {
      expect(body[index]).toMatchObject({ name: category.getName() })
    })
  })
})