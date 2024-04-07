import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { api, auth, error, fixture } from '../../index'
import User from '../../../src/entity/User'
import config from '../../../src/config'

describe('GET /permissions/hierarchy', () => {
  const app = api()

  test('Unauthorized', async () => {
    const res = await request(app).get('/permissions/hierarchy')

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })

  test('OK', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).get('/permissions/hierarchy').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toEqual(config.auth.permissions)
  })
})