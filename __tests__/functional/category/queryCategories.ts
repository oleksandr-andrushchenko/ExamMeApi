import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { api, fixture } from '../../index'
import Category from '../../../src/entity/Category'
import * as querystring from 'querystring'

describe('GET /categories', () => {
  const app = api()

  test('Empty', async () => {
    const res = await request(app).get('/categories')

    expect(res.status).toEqual(200)
    expect(res.body.data).toEqual([])
  })

  test('Cursor (id, id:asc)', async () => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const query = { cursor: 'id', size: 1, order: 'asc' }
    const res = await request(app).get('/categories').query(query)

    expect(res.status).toEqual(200)
    expect(res.body.data).toHaveLength(query.size)
    const lastInBodyId = res.body.data[query.size - 1].id
    const lastInStorageId = categories[query.size - 1].getId().toString()
    expect(lastInBodyId).toEqual(lastInStorageId)
    expect(res.body.meta).toMatchObject(query)
    expect(res.body.meta).toMatchObject({ nextCursor: lastInStorageId })
    expect(res.body.meta).toMatchObject({ nextUrl: '?' + querystring.stringify({ ...query, ...{ nextCursor: lastInStorageId } }) })
  })

  test('Cursor (id, id:desc)', async () => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const size = 2
    const query = { cursor: 'id', size, order: 'desc' }
    const res = await request(app).get('/categories').query(query)

    expect(res.status).toEqual(200)
    expect(res.body.data).toHaveLength(query.size)
    const firstInBodyId = res.body.data[0].id
    const lastInStorageId = categories[categories.length - 1].getId().toString()
    expect(firstInBodyId).toEqual(lastInStorageId)
    const firstInStorage = categories[categories.length - size].getId().toString()
    const lastInBodyId = res.body.data[size - 1].id
    expect(lastInBodyId).toEqual(firstInStorage)
    expect(res.body.meta).toMatchObject(query)
    expect(res.body.meta).toMatchObject({ nextCursor: firstInStorage })
    expect(res.body.meta).toMatchObject({ nextUrl: '?' + querystring.stringify({ ...query, ...{ nextCursor: firstInStorage } }) })
  })

  test('Cursor (id, id:asc, prev)', async () => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const firstInStorageId = categories[0].getId().toString()
    const secondInStorageId = categories[1].getId().toString()
    const query = { cursor: 'id', size: 1, order: 'asc' }
    const res = await request(app).get('/categories').query({ ...query, ...{ prevCursor: secondInStorageId } })

    expect(res.status).toEqual(200)
    expect(res.body.data).toHaveLength(query.size)
    const firstInBodyId = res.body.data[0].id
    expect(firstInBodyId).toEqual(firstInStorageId)
    expect(res.body.meta).toMatchObject({ ...query, ...{ nextCursor: firstInStorageId } })
  })

  test('Cursor (id, id:asc, next)', async () => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const firstInStorageId = categories[0].getId().toString()
    const secondInStorageId = categories[1].getId().toString()
    const query = { cursor: 'id', size: 1, order: 'asc' }
    const res = await request(app).get('/categories').query({ ...query, ...{ nextCursor: firstInStorageId } })

    expect(res.status).toEqual(200)
    expect(res.body.data).toHaveLength(query.size)
    const firstInBodyId = res.body.data[0].id
    expect(firstInBodyId).toEqual(secondInStorageId)
    expect(res.body.meta).toMatchObject({
      ...query, ...{
        prevCursor: secondInStorageId,
        nextCursor: secondInStorageId,
      },
    })
  })

  test('Cursor (id, id:desc, prev)', async () => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const secondInStorageId = categories[1].getId().toString()
    const lastInStorageId = categories[categories.length - 1].getId().toString()
    const query = { cursor: 'id', size: 1, order: 'desc' }
    const res = await request(app).get('/categories').query({ ...query, ...{ prevCursor: secondInStorageId } })

    expect(res.status).toEqual(200)
    expect(res.body.data).toHaveLength(query.size)
    const firstInBodyId = res.body.data[0].id
    expect(firstInBodyId).toEqual(lastInStorageId)
    expect(res.body.meta).toMatchObject({ ...query, ...{ nextCursor: firstInBodyId } })
  })

  test('Cursor (id, id:desc, next)', async () => {
    const categories = (await Promise.all([ fixture<Category>(Category), fixture<Category>(Category), fixture<Category>(Category) ]))
      .sort((a: Category, b: Category) => a.getId().toString().localeCompare(b.getId().toString()))

    const secondInStorageId = categories[1].getId().toString()
    const lastInStorageId = categories[categories.length - 1].getId().toString()
    const query = { cursor: 'id', size: 1, order: 'desc' }
    const res = await request(app).get('/categories').query({ ...query, ...{ nextCursor: lastInStorageId } })

    expect(res.status).toEqual(200)
    expect(res.body.data).toHaveLength(query.size)
    const firstInBodyId = res.body.data[0].id
    expect(firstInBodyId).toEqual(secondInStorageId)
    expect(res.body.meta).toMatchObject({
      ...query, ...{
        prevCursor: secondInStorageId,
        nextCursor: secondInStorageId,
      },
    })
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