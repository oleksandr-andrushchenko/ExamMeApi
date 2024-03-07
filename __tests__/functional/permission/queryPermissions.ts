import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { api, auth, error, fixture } from '../../index'
import User from '../../../src/entity/User'
import Permission from '../../../src/enum/auth/Permission'

describe('GET /permissions', () => {
  const app = api()

  test('Unauthorized', async () => {
    const res = await request(app).get('/permissions')

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })

  test('OK', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.REGULAR ] })
    const token = (await auth(user)).token
    const res = await request(app).get('/permissions').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toEqual(Object.values(Permission))
  })
})