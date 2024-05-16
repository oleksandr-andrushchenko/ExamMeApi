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
    const res = await request(framework.app).post('/')
      .send(removeExamMutation({ examId: exam.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(removeExamMutation({ examId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(removeExamMutation({ examId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const exam = await framework.fixture<Exam>(Exam)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(removeExamMutation({ examId: exam.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Deleted (has ownership)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.ownerId)
    const token = (await framework.auth(user)).token
    const now = Date.now()
    const res = await request(framework.app).post('/')
      .send(removeExamMutation({ examId: exam.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { removeExam: true } })
    const latestExam = await framework.load<Exam>(Exam, exam.id)
    expect(latestExam).not.toBeNull()
    expect(latestExam.deletedAt.getTime()).toBeGreaterThanOrEqual(now)
  })
  test('Deleted (has permission)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const now = Date.now()
    const res = await request(framework.app).post('/')
      .send(removeExamMutation({ examId: exam.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { removeExam: true } })
    const latestExam = await framework.load<Exam>(Exam, exam.id)
    expect(latestExam).not.toBeNull()
    expect(latestExam.deletedAt.getTime()).toBeGreaterThanOrEqual(now)
  })
})