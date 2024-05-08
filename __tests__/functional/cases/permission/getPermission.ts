import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/User'
import config from '../../../../src/config'
// @ts-ignore
import { permissionQuery } from '../../graphql/permission/permissionQuery'
import Permission from '../../../../src/enums/Permission'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Get permission', () => {
  test('Unauthorized (GraphQL)', async () => {
    const res = await request(framework.app).post('/graphql')
      .send(permissionQuery([ 'items', 'hierarchy {regular root}' ]))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('OK (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(permissionQuery([ 'items', 'hierarchy {regular root}' ]))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({
      data: {
        permission: {
          items: Object.values(Permission),
          hierarchy: config.auth.permissions,
        },
      },
    })
  })
})