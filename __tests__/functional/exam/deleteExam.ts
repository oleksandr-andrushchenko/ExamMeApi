import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, load, server as app } from '../../index'
import User from '../../../src/entities/User'
import Exam from '../../../src/entities/Exam'
import ExamPermission from '../../../src/enums/exam/ExamPermission'

describe('DELETE /exams/:examId', () => {
  test('Unauthorized', async () => {
    const exam = await fixture<Exam>(Exam)
    const res = await request(app).delete(`/exams/${ exam.id.toString() }`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).delete('/exams/invalid').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).delete(`/exams/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await fixture<User>(User)
    const exam = await fixture<Exam>(Exam)
    const token = (await auth(user)).token
    const res = await request(app).delete(`/exams/${ exam.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Deleted (has ownership)', async () => {
    const exam = await fixture<Exam>(Exam)
    const user = await load<User>(User, exam.creator)
    const token = (await auth(user)).token
    const res = await request(app).delete(`/exams/${ exam.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    expect(await load<Exam>(Exam, exam.id)).toBeNull()
  })
  test('Deleted (has permission)', async () => {
    const exam = await fixture<Exam>(Exam)
    const permissions = [
      ExamPermission.GET,
      ExamPermission.DELETE,
    ]
    const user = await fixture<User>(User, { permissions })
    const token = (await auth(user)).token
    const res = await request(app).delete(`/exams/${ exam.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    expect(await load<Exam>(Exam, exam.id)).toBeNull()
  })
})