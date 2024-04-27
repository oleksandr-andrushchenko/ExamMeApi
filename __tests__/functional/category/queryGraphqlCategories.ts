import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { api, fixture, graphqlError } from '../../index'
import Category from '../../../src/entity/Category'

describe('POST /graphql categories', () => {
  const app = api()

  test('Empty', async () => {
    const res = await request(app)
      .post(`/graphql`)
      .send({
        query: `query Categories {
          categories {
            id
          }
        }`,
      })

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({ data: { categories: [] } })
  })

  test.each([
    { case: 'invalid price', query: { price: 'any' } },
    { case: 'invalid cursor type', query: { cursor: 1 } },
    { case: 'not allowed cursor', query: { cursor: 'name' } },
    { case: 'invalid size type', query: { size: 'any' } },
    { case: 'negative size', query: { size: -1 } },
    { case: 'zero size', query: { size: 0 } },
    { case: 'size greater them max', query: { size: 1000 } },
    { case: 'invalid order type', query: { order: 1 } },
    { case: 'not allowed order', query: { order: 'any' } },
  ])('Bad request ($case)', async ({ query }) => {
    const res = await request(app)
      .post(`/graphql`)
      .send({
        query: `query Categories($prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String, $price: String, $search: String) {
          categories(prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order, price: $price, search: $search) {
            id
          }
        }`,
        variables: query,
      })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })

  test.each([
    { size: 1 },
    { size: 2 },
    { size: 3 },
    { size: 4 },
  ])('Cursor (id, id:asc, size: $size)', async ({ size }) => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const query = { cursor: 'id', size, order: 'asc' }
    const res = await request(app)
      .post(`/graphql`)
      .send({
        query: `query Categories($prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String, $price: String, $search: String) {
          categories(prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order, price: $price, search: $search) {
            id
          }
        }`,
        variables: query,
      })

    expect(res.status).toEqual(200)
    const firstInStoragePosition = 0
    const lastInStoragePosition = Math.min(categories.length, size) - 1
    expect(res.body.data.categories).toHaveLength(lastInStoragePosition - firstInStoragePosition + 1)

    const firstInBodyId = res.body.data.categories[0].id
    const firstInStorageId = categories[firstInStoragePosition].getId().toString()
    expect(firstInBodyId).toEqual(firstInStorageId)
    const lastInBodyId = res.body.data.categories[res.body.data.categories.length - 1].id
    const lastInStorageId = categories[lastInStoragePosition].getId().toString()
    expect(lastInBodyId).toEqual(lastInStorageId)
  })

  test.each([
    { size: 1 },
    { size: 2 },
    { size: 3 },
    { size: 4 },
  ])('Cursor (id, id:desc, size: $size)', async ({ size }) => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const query = { cursor: 'id', size, order: 'desc' }
    const res = await request(app)
      .post(`/graphql`)
      .send({
        query: `query Categories($prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String, $price: String, $search: String) {
          categories(prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order, price: $price, search: $search) {
            id
          }
        }`,
        variables: query,
      })

    expect(res.status).toEqual(200)

    if (categories.length < 1) {
      expect(res.body.data.categories).toHaveLength(0)
      return
    }

    const firstInStoragePosition = Math.max(0, categories.length - size)
    const lastInStoragePosition = Math.max(0, categories.length - 1)
    expect(res.body.data.categories).toHaveLength(lastInStoragePosition - firstInStoragePosition + 1)

    const firstInBodyId = res.body.data.categories[0].id
    const lastInStorageId = categories[lastInStoragePosition].getId().toString()
    expect(firstInBodyId).toEqual(lastInStorageId)
    const firstInStorageId = categories[firstInStoragePosition].getId().toString()
    const lastInBodyId = res.body.data.categories[res.body.data.categories.length - 1].id
    expect(lastInBodyId).toEqual(firstInStorageId)
  })

  test.each([
    { prev: 0, size: 1 },
    { prev: 0, size: 2 },
    { prev: 1, size: 1 },
    { prev: 1, size: 2 },
    { prev: 1, size: 3 },
    { prev: 1, size: 4 },
    { prev: 2, size: 1 },
    { prev: 2, size: 2 },
    { prev: 2, size: 3 },
  ])('Cursor (id, id:asc, prev: $prev, size: $size)', async ({ prev, size }) => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const prevCursor = categories[prev].getId().toString()
    const query = { cursor: 'id', size, order: 'asc' }
    const res = await request(app)
      .post(`/graphql`)
      .send({
        query: `query Categories($prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String, $price: String, $search: String) {
          categories(prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order, price: $price, search: $search) {
            id
          }
        }`,
        variables: { ...query, ...{ prevCursor } },
      })

    expect(res.status).toEqual(200)

    if (prev < 1) {
      expect(res.body.data.categories).toHaveLength(0)
      return
    }

    const firstInStoragePosition = Math.max(0, prev - size)
    const lastInStoragePosition = Math.max(0, prev - 1)
    expect(res.body.data.categories).toHaveLength(lastInStoragePosition - firstInStoragePosition + 1)

    const firstInBodyId = res.body.data.categories[0].id
    const firstInStorageId = categories[firstInStoragePosition].getId().toString()
    expect(firstInBodyId).toEqual(firstInStorageId)
    const lastInBodyId = res.body.data.categories[res.body.data.categories.length - 1].id
    const lastInStorageId = categories[lastInStoragePosition].getId().toString()
    expect(lastInBodyId).toEqual(lastInStorageId)
  })

  test.each([
    { next: 0, size: 1 },
    { next: 0, size: 2 },
    { next: 0, size: 3 },
    { next: 1, size: 1 },
    { next: 1, size: 2 },
    { next: 1, size: 3 },
    { next: 2, size: 1 },
    { next: 2, size: 2 },
    { next: 2, size: 3 },
  ])('Cursor (id, id:asc, next: $next, size: $size)', async ({ next, size }) => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const nextCursor = categories[next].getId().toString()
    const query = { cursor: 'id', size, order: 'asc' }
    const res = await request(app)
      .post(`/graphql`)
      .send({
        query: `query Categories($prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String, $price: String, $search: String) {
          categories(prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order, price: $price, search: $search) {
            id
          }
        }`,
        variables: { ...query, ...{ nextCursor } },
      })

    expect(res.status).toEqual(200)

    if (next + 1 > categories.length - 1) {
      expect(res.body.data.categories).toHaveLength(0)
      return
    }

    const firstInStoragePosition = Math.min(next + 1, categories.length - 1)
    const lastInStoragePosition = Math.min(next + size, categories.length - 1)
    expect(res.body.data.categories).toHaveLength(lastInStoragePosition - firstInStoragePosition + 1)

    const firstInBodyId = res.body.data.categories[0].id
    const firstInStorageId = categories[firstInStoragePosition].getId().toString()
    expect(firstInBodyId).toEqual(firstInStorageId)
    const lastInBodyId = res.body.data.categories[res.body.data.categories.length - 1].id
    const lastInStorageId = categories[lastInStoragePosition].getId().toString()
    expect(lastInBodyId).toEqual(lastInStorageId)
  })

  test.each([
    { prev: 0, size: 1 },
    { prev: 0, size: 2 },
    { prev: 0, size: 3 },
    { prev: 0, size: 4 },
    { prev: 1, size: 1 },
    { prev: 1, size: 2 },
    { prev: 1, size: 3 },
    { prev: 1, size: 4 },
    { prev: 2, size: 1 },
    { prev: 2, size: 2 },
    { prev: 2, size: 3 },
    { prev: 2, size: 4 },
  ])('Cursor (id, id:desc, prev: $prev, size: $size)', async ({ prev, size }) => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const prevCursor = categories[prev].getId().toString()
    const query = { cursor: 'id', size, order: 'desc' }
    const res = await request(app)
      .post(`/graphql`)
      .send({
        query: `query Categories($prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String, $price: String, $search: String) {
          categories(prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order, price: $price, search: $search) {
            id
          }
        }`,
        variables: { ...query, ...{ prevCursor } },
      })

    expect(res.status).toEqual(200)

    if (prev + 2 > categories.length) {
      expect(res.body.data.categories).toHaveLength(0)
      return
    }

    const firstInStoragePosition = Math.min(prev + 1, categories.length - 1)
    const lastInStoragePosition = Math.min(prev + size, categories.length - 1)
    expect(res.body.data.categories).toHaveLength(lastInStoragePosition - firstInStoragePosition + 1)

    const firstInBodyId = res.body.data.categories[0].id
    const lastInStorageId = categories[lastInStoragePosition].getId().toString()
    expect(firstInBodyId).toEqual(lastInStorageId)
    const lastInBodyId = res.body.data.categories[res.body.data.categories.length - 1].id
    const firstInStorageId = categories[firstInStoragePosition].getId().toString()
    expect(lastInBodyId).toEqual(firstInStorageId)
  })

  test.each([
    { next: 0, size: 1 },
    { next: 0, size: 2 },
    { next: 0, size: 3 },
    { next: 1, size: 1 },
    { next: 1, size: 2 },
    { next: 1, size: 3 },
    { next: 2, size: 1 },
    { next: 2, size: 2 },
    { next: 2, size: 3 },
  ])('Cursor (id, id:desc, next: $next, size: $size)', async ({ next, size }) => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const nextCursor = categories[next].getId().toString()
    const query = { cursor: 'id', size, order: 'desc' }
    const res = await request(app)
      .post(`/graphql`)
      .send({
        query: `query Categories($prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String, $price: String, $search: String) {
          categories(prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order, price: $price, search: $search) {
            id
          }
        }`,
        variables: { ...query, ...{ nextCursor } },
      })

    expect(res.status).toEqual(200)

    if (next < 1) {
      expect(res.body.data.categories).toHaveLength(0)
      return
    }

    const firstInStoragePosition = Math.max(0, next - 1)
    const lastInStoragePosition = Math.max(0, next - size)
    expect(res.body.data.categories).toHaveLength(firstInStoragePosition - lastInStoragePosition + 1)

    const firstInBodyId = res.body.data.categories[0].id
    const firstInStorageId = categories[firstInStoragePosition].getId().toString()
    expect(firstInBodyId).toEqual(firstInStorageId)
    const lastInBodyId = res.body.data.categories[res.body.data.categories.length - 1].id
    const lastInStorageId = categories[lastInStoragePosition].getId().toString()
    expect(lastInBodyId).toEqual(lastInStorageId)
  })

  test('Not empty', async () => {
    const categories = await Promise.all([ fixture<Category>(Category), fixture<Category>(Category) ])

    const res = await request(app)
      .post(`/graphql`)
      .send({
        query: `query Categories($prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String, $price: String, $search: String) {
          categories(prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order, price: $price, search: $search) {
            id
            name
          }
        }`,
        variables: { size: 50 },
      })

    expect(res.status).toEqual(200)
    expect(res.body.data.categories).toHaveLength(categories.length)
    const body = res.body.data.categories.sort((a, b) => a.name.localeCompare(b.name))
    categories.sort((a, b) => a.getName().localeCompare(b.getName())).forEach((category, index) => {
      expect(body[index]).toMatchObject({ name: category.getName() })
    })
  })
})