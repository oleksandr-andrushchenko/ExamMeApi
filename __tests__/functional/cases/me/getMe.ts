import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/User'
// @ts-ignore
import { meQuery } from '../../graphql/me/meQuery'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Get me', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).post('/')
      .send(meQuery())

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Found', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(meQuery([ 'id', 'name', 'email', 'permissions', 'createdAt', 'updatedAt' ]))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      data: {
        me: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          permissions: user.permissions,
          createdAt: user.createdAt.getTime(),
          updatedAt: user.updatedAt?.getTime() ?? null,
        },
      },
    })
    expect(res.body.data.me).not.toHaveProperty([ 'password', 'creatorId', 'deletedAt' ])
  })
})