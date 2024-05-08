import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/User'
import Exam from '../../../../src/entities/Exam'
import ExamPermission from '../../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { removeExamMutation } from '../../graphql/exam/removeExamMutation'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Delete exam', () => {
  test('Unauthorized', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).delete(`/exams/${ exam.id.toString() }`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(framework.error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).delete('/exams/invalid').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).delete(`/exams/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(framework.error('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const exam = await framework.fixture<Exam>(Exam)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).delete(`/exams/${ exam.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(framework.error('ForbiddenError'))
  })
  test('Deleted (has ownership)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.creator)
    const token = (await framework.auth(user)).token
    const now = Date.now()
    const res = await request(framework.app).delete(`/exams/${ exam.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    const latestExam = await framework.load<Exam>(Exam, exam.id)
    expect(latestExam).not.toBeNull()
    expect(latestExam.deleted.getTime()).toBeGreaterThanOrEqual(now)
  })
  test('Deleted (has permission)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const now = Date.now()
    const res = await request(framework.app).delete(`/exams/${ exam.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    const latestExam = await framework.load<Exam>(Exam, exam.id)
    expect(latestExam).not.toBeNull()
    expect(latestExam.deleted.getTime()).toBeGreaterThanOrEqual(now)
  })
  test('Unauthorized (GraphQL)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).post('/graphql')
      .send(removeExamMutation({ examId: exam.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(removeExamMutation({ examId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/graphql')
      .send(removeExamMutation({ examId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const exam = await framework.fixture<Exam>(Exam)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(removeExamMutation({ examId: exam.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Deleted (has ownership) (GraphQL)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.owner)
    const token = (await framework.auth(user)).token
    const now = Date.now()
    const res = await request(framework.app).post('/graphql')
      .send(removeExamMutation({ examId: exam.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { removeExam: true } })
    const latestExam = await framework.load<Exam>(Exam, exam.id)
    expect(latestExam).not.toBeNull()
    expect(latestExam.deleted.getTime()).toBeGreaterThanOrEqual(now)
  })
  test('Deleted (has permission) (GraphQL)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const now = Date.now()
    const res = await request(framework.app).post('/graphql')
      .send(removeExamMutation({ examId: exam.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { removeExam: true } })
    const latestExam = await framework.load<Exam>(Exam, exam.id)
    expect(latestExam).not.toBeNull()
    expect(latestExam.deleted.getTime()).toBeGreaterThanOrEqual(now)
  })
})