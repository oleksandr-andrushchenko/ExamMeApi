import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fixture, server as app } from '../../index'
import User from '../../../src/entity/User'
import Permission from '../../../src/enum/Permission'

describe('GET /permissions', () => {
  test('Unauthorized', async () => {
    const res = await request(app).get('/permissions')

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })

  test('OK', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).get('/permissions').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toEqual(Object.values(Permission))
  })
})