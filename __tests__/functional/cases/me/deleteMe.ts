import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/User'
// @ts-ignore
import { removeMeMutation } from '../../graphql/me/removeMeMutation'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Delete me', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).delete('/me')

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(framework.error('AuthorizationRequiredError'))
  })
  test('Deleted', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const now = Date.now()
    const res = await request(framework.app).delete('/me').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    const latestUser = await framework.load<User>(User, user.id)
    expect(latestUser).not.toBeNull()
    expect(latestUser.deleted.getTime()).toBeGreaterThanOrEqual(now)
  })
  test('Unauthorized (GraphQL)', async () => {
    const res = await request(framework.app).post('/graphql')
      .send(removeMeMutation())

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Deleted (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const now = Date.now()
    const res = await request(framework.app).post('/graphql')
      .send(removeMeMutation())
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { removeMe: true } })
    const latestUser = await framework.load<User>(User, user.id)
    expect(latestUser).not.toBeNull()
    expect(latestUser.deleted.getTime()).toBeGreaterThanOrEqual(now)
  })
})