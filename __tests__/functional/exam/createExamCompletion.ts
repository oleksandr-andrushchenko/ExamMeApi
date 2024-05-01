import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, load, server as app } from '../../index'
import Exam from '../../../src/entity/Exam'
import User from '../../../src/entity/User'
import ExamPermission from '../../../src/enum/exam/ExamPermission'

describe('POST /exams/:examId/completion', () => {
  test('Unauthorized', async () => {
    const exam = await fixture<Exam>(Exam)
    const res = await request(app).post(`/exams/${ exam.id.toString() }/completion`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid exam id)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).post(`/exams/invalid/completion`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).post(`/exams/${ id.toString() }/completion`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const exam = await fixture<Exam>(Exam)
    const res = await request(app).post(`/exams/${ exam.id.toString() }/completion`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Created (has ownership)', async () => {
    const exam = await fixture<Exam>(Exam)
    const id = exam.id
    const user = await load<User>(User, exam.owner)
    const token = (await auth(user)).token
    const res = await request(app).post(`/exams/${ id.toString() }/completion`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(201)
    expect(res.body).toMatchObject({ id: exam.id.toString() })
    expect(res.body).toHaveProperty('completed')
    expect(res.body.completed).toBeGreaterThan(0)
    expect((await load<Exam>(Exam, exam.id)).completed.getTime()).toEqual(res.body.completed)
  })
  test('Created (has permission)', async () => {
    const exam = await fixture<Exam>(Exam)
    const id = exam.id
    const permissions = [
      ExamPermission.GET,
      ExamPermission.CREATE_COMPLETION,
    ]
    const user = await fixture<User>(User, { permissions })
    const token = (await auth(user)).token
    const res = await request(app).post(`/exams/${ id.toString() }/completion`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(201)
    expect(res.body).toMatchObject({ id: exam.id.toString() })
    expect(res.body).toHaveProperty('completed')
    expect(res.body.completed).toBeGreaterThan(0)
    expect((await load<Exam>(Exam, exam.id)).completed.getTime()).toEqual(res.body.completed)
  })
})