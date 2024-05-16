import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/User'
import Exam from '../../../../src/entities/Exam'
import Category from '../../../../src/entities/Category'
import { ObjectId } from 'mongodb'
import ExamPermission from '../../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { addExamMutation } from '../../graphql/exam/addExamMutation'
import CreateExamSchema from '../../../../src/schema/exam/CreateExamSchema'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Create exam', () => {
  test('Unauthorized', async () => {
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).post('/')
      .send(addExamMutation({ exam: { categoryId: category.id.toString() } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(addExamMutation({ exam: {} as CreateExamSchema }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).post('/')
      .send(addExamMutation({ exam: { categoryId: category.id.toString() } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict (exam taken)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam, { completedAt: false, creatorId: user.id })
    const res = await request(framework.app).post('/')
      .send(addExamMutation({ exam: { categoryId: exam.categoryId.toString() } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Created', async () => {
    await framework.clear(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const category = await framework.fixture<Category>(Category)
    const exam = { categoryId: category.id.toString() }
    const fields = [
      'id',
      'categoryId',
      'questionNumber',
      'completedAt',
      'ownerId',
      'questionsCount',
      'answeredCount',
      'createdAt',
      'updatedAt',
    ]
    const now = Date.now()
    const res = await request(framework.app).post('/')
      .send(addExamMutation({ exam }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { addExam: exam } })
    expect(res.body.data.addExam).toHaveProperty('id')
    const id = new ObjectId(res.body.data.addExam.id)
    const latestExam = await framework.load<Exam>(Exam, id)
    expect({ ...latestExam, ...{ categoryId: latestExam.categoryId.toString() } }).toMatchObject(exam)
    expect(res.body.data.addExam).toEqual({
      id: latestExam.id.toString(),
      categoryId: latestExam.categoryId.toString(),
      questionNumber: latestExam.questionNumber,
      completedAt: null,
      ownerId: latestExam.ownerId.toString(),
      questionsCount: latestExam.getQuestionsCount(),
      answeredCount: latestExam.getQuestionsAnsweredCount(),
      createdAt: latestExam.createdAt.getTime(),
      updatedAt: null,
    })
    expect(latestExam.createdAt.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body.data.addExam).not.toHaveProperty([ 'creatorId', 'deletedAt' ])
  })
})