import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/User'
// @ts-ignore
import { meQuery } from '../../graphql/me/meQuery'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Get me', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).get('/me')

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(framework.error('AuthorizationRequiredError'))
  })
  test('Found', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).get('/me').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      permissions: user.permissions,
      created: user.created.getTime(),
    })

    if (user.updated) {
      expect(res.body).toMatchObject({
        updated: user.updated.getTime(),
      })
    }

    expect(res.body).not.toHaveProperty([ 'password', 'creator', 'deleted' ])
  })
  test('Unauthorized (GraphQL)', async () => {
    const res = await request(framework.app).post('/graphql')
      .send(meQuery())

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Found (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(meQuery([ 'id', 'name', 'email', 'permissions', 'created', 'updated' ]))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      data: {
        me: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          permissions: user.permissions,
          created: user.created.getTime(),
          updated: user.updated?.getTime() ?? null,
        },
      },
    })
    expect(res.body.data.me).not.toHaveProperty([ 'password', 'creator', 'deleted' ])
  })
})