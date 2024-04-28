import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { error, fixture, server as app } from '../../index'
import User from '../../../src/entity/User'

describe('POST /auth', () => {
  test.each([
    { case: 'empty body', body: {} },
    { case: 'no email', body: { password: 'any' } },
    { case: 'email is null', body: { email: null, password: 'any' } },
    { case: 'email is undefined', body: { email: undefined, password: 'any' } },
    { case: 'email is integer', body: { email: 111, password: 'any' } },
    { case: 'email is invalid', body: { email: 'invalid', password: 'any' } },
    { case: 'password is null', body: { email: 'any@any.com', password: null } },
    { case: 'password is integer', body: { email: 'any@any.com', password: 111 } },
    { case: 'password is too short', body: { email: 'any@any.com', password: 'a' } },
    { case: 'password is too long', body: { email: 'any@any.com', password: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' } },
  ])('Bad request ($case)', async ({ body }) => {
    const res = await request(app).post('/auth').send(body)

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Not Found', async () => {
    const credentials = { email: 'any@any.com', password: 'password' }
    const res = await request(app).post('/auth').send(credentials)

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await fixture<User>(User)
    const credentials = { email: user.getEmail(), password: 'password' }
    const res = await request(app).post('/auth').send(credentials)

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Created', async () => {
    const user = await fixture<User>(User, { password: 'password' })
    const credentials = { email: user.getEmail(), password: 'password' }
    const res = await request(app).post('/auth').send(credentials)

    expect(res.status).toEqual(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('expires')
  })
})