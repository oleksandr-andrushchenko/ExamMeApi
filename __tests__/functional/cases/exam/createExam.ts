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
    const res = await request(framework.app).post('/exams').send({ category: category.id.toString() })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(framework.error('AuthorizationRequiredError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/exams').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).post('/exams').send({ category: category.id.toString() }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(framework.error('ForbiddenError'))
  })
  test('Conflict (exam taken)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam, { completed: false, creator: user.id })
    const res = await request(framework.app).post('/exams').send({ category: exam.category.toString() }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(framework.error('ConflictError'))
  })
  test('Created', async () => {
    await framework.clear(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const category = await framework.fixture<Category>(Category)
    const exam = { category: category.id.toString() }
    const now = Date.now()
    const res = await request(framework.app).post('/exams').send(exam).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(201)
    expect(res.body).toMatchObject(exam)
    expect(res.body).toHaveProperty('id')
    const id = new ObjectId(res.body.id)
    const latestExam = await framework.load<Exam>(Exam, id)
    expect({ ...latestExam, ...{ category: latestExam.category.toString() } }).toMatchObject(exam)
    expect(res.body).toEqual({
      id: latestExam.id.toString(),
      category: latestExam.category.toString(),
      questionNumber: latestExam.questionNumber,
      owner: latestExam.owner.toString(),
      questionsCount: latestExam.getQuestionsCount(),
      answeredCount: latestExam.getQuestionsAnsweredCount(),
      created: latestExam.created.getTime(),
    })
    expect(latestExam.created.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body).not.toHaveProperty([ 'completed', 'creator', 'updated', 'deleted' ])
  })
  test('Unauthorized (GraphQL)', async () => {
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).post('/graphql')
      .send(addExamMutation({ exam: { category: category.id.toString() } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (empty body) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(addExamMutation({ exam: {} as CreateExamSchema }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Forbidden (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).post('/graphql')
      .send(addExamMutation({ exam: { category: category.id.toString() } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict (exam taken) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam, { completed: false, creator: user.id })
    const res = await request(framework.app).post('/graphql')
      .send(addExamMutation({ exam: { category: exam.category.toString() } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Created (GraphQL)', async () => {
    await framework.clear(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const category = await framework.fixture<Category>(Category)
    const exam = { category: category.id.toString() }
    const fields = [
      'id',
      'category',
      'questionNumber',
      'completed',
      'owner',
      'questionsCount',
      'answeredCount',
      'created',
      'updated',
    ]
    const now = Date.now()
    const res = await request(framework.app).post('/graphql')
      .send(addExamMutation({ exam }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { addExam: exam } })
    expect(res.body.data.addExam).toHaveProperty('id')
    const id = new ObjectId(res.body.data.addExam.id)
    const latestExam = await framework.load<Exam>(Exam, id)
    expect({ ...latestExam, ...{ category: latestExam.category.toString() } }).toMatchObject(exam)
    expect(res.body.data.addExam).toEqual({
      id: latestExam.id.toString(),
      category: latestExam.category.toString(),
      questionNumber: latestExam.questionNumber,
      completed: null,
      owner: latestExam.owner.toString(),
      questionsCount: latestExam.getQuestionsCount(),
      answeredCount: latestExam.getQuestionsAnsweredCount(),
      created: latestExam.created.getTime(),
      updated: null,
    })
    expect(latestExam.created.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body.data.addExam).not.toHaveProperty([ 'creator', 'deleted' ])
  })
})