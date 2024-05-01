import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, load, server as app } from '../../index'
import Exam from '../../../src/entities/Exam'
import User from '../../../src/entities/User'
import ExamPermission from '../../../src/enums/exam/ExamPermission'

describe('GET /exams/:examId', () => {
  test('Unauthorized', async () => {
    const exam = await fixture<Exam>(Exam)
    const id = exam.id
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
    const id = exam.id
    const token = (await auth(user)).token
    const res = await request(app).get(`/exams/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Found (ownership)', async () => {
    const exam = await fixture<Exam>(Exam)
    const id = exam.id
    const user = await load<User>(User, exam.owner)
    const token = (await auth(user)).token
    const res = await request(app).get(`/exams/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ id: id.toString() })
  })
  test('Found (permission)', async () => {
    const exam = await fixture<Exam>(Exam)
    const id = exam.id
    const permissions = [
      ExamPermission.GET,
    ]
    const user = await fixture<User>(User, { permissions })
    const token = (await auth(user)).token
    const res = await request(app).get(`/exams/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ id: id.toString() })
  })
})