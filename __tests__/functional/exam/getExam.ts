import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { api, auth, error, fakeId, fixture, load } from '../../index'
import Exam from '../../../src/entity/Exam'
import User from '../../../src/entity/User'
import Permission from '../../../src/enum/auth/Permission'

describe('GET /exams/:examId', () => {
  const app = api()

  test('Unauthorized', async () => {
    const exam = await fixture<Exam>(Exam)
    const id = exam.getId()
    const res = await request(app).get(`/exams/${ id.toString() }`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })

  test('Bad request (invalid id)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = 'invalid'
    const res = await request(app).get(`/exams/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })

  test('Not found', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).get(`/exams/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })

  test('Forbidden', async () => {
    const user = await fixture<User>(User)
    const exam = await fixture<Exam>(Exam)
    const id = exam.getId()
    const token = (await auth(user)).token
    const res = await request(app).get(`/exams/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })

  test('Found (ownership)', async () => {
    const exam = await fixture<Exam>(Exam)
    const id = exam.getId()
    const user = await load<User>(User, exam.getOwner())
    const token = (await auth(user)).token
    const res = await request(app).get(`/exams/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ id: id.toString() })
  })

  test('Found (permission)', async () => {
    const exam = await fixture<Exam>(Exam)
    const id = exam.getId()
    const permissions = [
      Permission.GET_EXAM,
    ]
    const user = await fixture<User>(User, { permissions })
    const token = (await auth(user)).token
    const res = await request(app).get(`/exams/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ id: id.toString() })
  })
})