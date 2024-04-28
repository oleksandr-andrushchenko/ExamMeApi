import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fixture, server as app } from '../../index'
import User from '../../../src/entity/User'

describe('GET /me', () => {
  test('Unauthorized', async () => {
    const res = await request(app).get(`/me`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Found', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).get(`/me`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ id: user.getId().toString(), name: user.getName() })
  })
})