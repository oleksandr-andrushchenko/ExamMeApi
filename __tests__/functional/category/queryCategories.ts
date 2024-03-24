import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { api, error, fixture } from '../../index'
import Category from '../../../src/entity/Category'
import * as querystring from 'querystring'

describe('GET /categories', () => {
  const app = api()

  test('Empty', async () => {
    const res = await request(app).get('/categories')

    expect(res.status).toEqual(200)
    expect(res.body.data).toEqual([])
  })

  test.each([
    { case: 'invalid cursor type', query: { cursor: 1 } },
    { case: 'not allowed cursor', query: { cursor: 'name' } },
    { case: 'invalid size type', query: { size: 'any' } },
    { case: 'negative size', query: { size: -1 } },
    { case: 'zero size', query: { size: 0 } },
    { case: 'size greater them max', query: { size: 1000 } },
    { case: 'invalid order type', query: { order: 1 } },
    { case: 'not allowed order', query: { order: 'any' } },
  ])('Bad request ($case)', async ({ query }) => {
    const res = await request(app).get('/categories').query(query)

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })

  test.each([
    { size: 1 },
    { size: 2 },
    { size: 3 },
    { size: 4 },
  ])('Cursor (id, id:asc, size:$size)', async ({ size }) => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const query = { cursor: 'id', size, order: 'asc' }
    const res = await request(app).get('/categories').query(query)

    expect(res.status).toEqual(200)
    const firstInStoragePosition = 0
    const lastInStoragePosition = Math.min(categories.length, size) - 1
    expect(res.body.data).toHaveLength(lastInStoragePosition - firstInStoragePosition + 1)
    const firstInBodyId = res.body.data[0].id
    const firstInStorageId = categories[firstInStoragePosition].getId().toString()
    expect(firstInBodyId).toEqual(firstInStorageId)
    const lastInBodyId = res.body.data[res.body.data.length - 1].id
    const lastInStorageId = categories[lastInStoragePosition].getId().toString()
    expect(lastInBodyId).toEqual(lastInStorageId)
    expect(res.body.meta).toMatchObject(query)

    if (lastInStoragePosition + 1 < categories.length) {
      const nextInStorageId = categories[lastInStoragePosition].getId().toString()
      expect(res.body.meta).toMatchObject({ nextCursor: nextInStorageId })
      expect(res.body.meta).toMatchObject({ nextUrl: '?' + querystring.stringify({ ...query, ...{ nextCursor: nextInStorageId } }) })
    }
  })

  test.each([
    { size: 1 },
    { size: 2 },
    { size: 3 },
    { size: 4 },
  ])('Cursor (id, id:desc, size:$size)', async ({ size }) => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const query = { cursor: 'id', size, order: 'desc' }
    const res = await request(app).get('/categories').query(query)

    expect(res.status).toEqual(200)
    const firstInStoragePosition = Math.max(0, categories.length - size)
    const lastInStoragePosition = categories.length - 1
    expect(res.body.data).toHaveLength(Math.min(size, lastInStoragePosition - firstInStoragePosition + 1))

    const firstInBodyId = res.body.data[0].id
    const lastInStorageId = categories[lastInStoragePosition].getId().toString()
    expect(firstInBodyId).toEqual(lastInStorageId)
    const firstInStorage = categories[firstInStoragePosition].getId().toString()
    const lastInBodyId = res.body.data[res.body.data.length - 1].id
    expect(lastInBodyId).toEqual(firstInStorage)
    expect(res.body.meta).toMatchObject(query)

    if (firstInStoragePosition > 0) {
      expect(res.body.meta).toMatchObject({ nextCursor: firstInStorage })
      expect(res.body.meta).toMatchObject({ nextUrl: '?' + querystring.stringify({ ...query, ...{ nextCursor: firstInStorage } }) })
    }
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
  ])('Cursor (id, id:asc, prev:$prev, size:$size)', async ({ prev, size }) => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const prevCursor = categories[prev].getId().toString()
    const query = { cursor: 'id', size, order: 'asc' }
    const res = await request(app).get('/categories').query({ ...query, ...{ prevCursor } })

    expect(res.status).toEqual(200)

    if (prev < 1) {
      expect(res.body.data).toHaveLength(0)
      return
    }

    const firstInStoragePosition = Math.max(0, prev - size)
    const lastInStoragePosition = Math.max(0, prev - 1)
    expect(res.body.data).toHaveLength(lastInStoragePosition - firstInStoragePosition + 1)
    const firstInBodyId = res.body.data[0].id
    const firstInStorageId = categories[firstInStoragePosition].getId().toString()
    expect(firstInBodyId).toEqual(firstInStorageId)
    const lastInBodyId = res.body.data[res.body.data.length - 1].id
    const lastInStorageId = categories[lastInStoragePosition].getId().toString()
    expect(lastInBodyId).toEqual(lastInStorageId)
    const nextCursor = categories[prev - 1].getId().toString()
    expect(res.body.meta).toMatchObject({ ...query, ...{ nextCursor } })

    if (firstInStoragePosition > 1) {
      const prevInStorageId = categories[firstInStoragePosition - 1].getId().toString()
      expect(res.body.meta).toMatchObject({ prevCursor: prevInStorageId })
      expect(res.body.meta).toMatchObject({ prevUrl: '?' + querystring.stringify({ ...query, ...{ prevUrl: prevInStorageId } }) })
    }

    const nextInStorageId = categories[lastInStoragePosition].getId().toString()
    expect(res.body.meta).toMatchObject({ nextCursor: nextInStorageId })
    expect(res.body.meta).toMatchObject({ nextUrl: '?' + querystring.stringify({ ...query, ...{ nextCursor: nextInStorageId } }) })
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
  ])('Cursor (id, id:asc, next:$next, size:$size)', async ({ next, size }) => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const nextCursor = categories[next].getId().toString()
    const query = { cursor: 'id', size, order: 'asc' }
    const res = await request(app).get('/categories').query({ ...query, ...{ nextCursor } })

    expect(res.status).toEqual(200)

    if (next + 1 > categories.length - 1) {
      expect(res.body.data).toHaveLength(0)
      return
    }

    const firstInStoragePosition = next + 1
    const lastInStoragePosition = Math.min(next + size, categories.length - 1)
    expect(res.body.data).toHaveLength(lastInStoragePosition - firstInStoragePosition + 1)
    const firstInBodyId = res.body.data[0].id
    const firstInStorageId = categories[firstInStoragePosition].getId().toString()
    expect(firstInBodyId).toEqual(firstInStorageId)
    const lastInBodyId = res.body.data[res.body.data.length - 1].id
    const lastInStorageId = categories[lastInStoragePosition].getId().toString()
    expect(lastInBodyId).toEqual(lastInStorageId)
    expect(res.body.meta).toMatchObject({ ...query })

    expect(res.body.meta).toMatchObject({ prevCursor: firstInStorageId })
    expect(res.body.meta).toMatchObject({ prevUrl: '?' + querystring.stringify({ ...query, ...{ prevCursor: firstInStorageId } }) })

    if (lastInStoragePosition + 1 < categories.length) {
      expect(res.body.meta).toMatchObject({ nextCursor: lastInStorageId })
      expect(res.body.meta).toMatchObject({ nextUrl: '?' + querystring.stringify({ ...query, ...{ nextCursor: lastInStorageId } }) })
    }
  })

  test.each([
    { prev: 1, size: 1 },
  ])('Cursor (id, id:desc, prev:$prev, size:$size)', async ({ prev, size }) => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const prevCursor = categories[prev].getId().toString()
    const query = { cursor: 'id', size, order: 'desc' }
    const res = await request(app).get('/categories').query({ ...query, ...{ prevCursor } })

    expect(res.status).toEqual(200)

    // todo:
    // const firstInStoragePosition = next + 1
    // const lastInStoragePosition = Math.min(next + size, categories.length - 1)

    const lastInStorageId = categories[categories.length - 1].getId().toString()

    expect(res.body.data).toHaveLength(size)
    const firstInBodyId = res.body.data[0].id
    expect(firstInBodyId).toEqual(lastInStorageId)
    expect(res.body.meta).toMatchObject({ ...query, ...{ nextCursor: firstInBodyId } })
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
  ])('Cursor (id, id:desc, next:$next, size:$size)', async ({ next, size }) => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const nextCursor = categories[categories.length - 1 - next].getId().toString()
    const query = { cursor: 'id', size, order: 'desc' }
    const res = await request(app).get('/categories').query({ ...query, ...{ nextCursor } })

    expect(res.status).toEqual(200)

    const firstInStoragePosition = Math.max(0, categories.length - 1 - next - size)
    const lastInStoragePosition = categories.length - 1 - next - 1

    if (lastInStoragePosition < 0) {
      expect(res.body.data).toHaveLength(0)
      return
    }

    expect(res.body.data).toHaveLength(lastInStoragePosition - firstInStoragePosition + 1)
    const firstInBodyId = res.body.data[0].id
    const lastInStorageId = categories[lastInStoragePosition].getId().toString()
    expect(firstInBodyId).toEqual(lastInStorageId)
    const lastInBodyId = res.body.data[res.body.data.length - 1].id
    const firstInStorageId = categories[firstInStoragePosition].getId().toString()
    expect(lastInBodyId).toEqual(firstInStorageId)
    expect(res.body.meta).toMatchObject({ ...query })

    expect(res.body.meta).toMatchObject({ prevCursor: lastInStorageId })
    expect(res.body.meta).toMatchObject({ prevUrl: '?' + querystring.stringify({ ...query, ...{ prevCursor: lastInStorageId } }) })

    if (firstInStoragePosition > 1) {
      const lastInStorageId = categories[firstInStoragePosition - 1].getId().toString()
      expect(res.body.meta).toMatchObject({ nextCursor: lastInStorageId })
      expect(res.body.meta).toMatchObject({ nextUrl: '?' + querystring.stringify({ ...query, ...{ nextCursor: lastInStorageId } }) })
    }
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