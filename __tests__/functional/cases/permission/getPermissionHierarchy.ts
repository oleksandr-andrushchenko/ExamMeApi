import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/User'
import config from '../../../../src/config'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Get permission hierarchy', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).get('/permissions/hierarchy')

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(framework.error('AuthorizationRequiredError'))
  })
  test('OK', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).get('/permissions/hierarchy').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toEqual(config.auth.permissions)
  })
})