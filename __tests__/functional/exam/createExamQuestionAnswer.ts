import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, load, server as app } from '../../index'
import Exam from '../../../src/entities/Exam'
import Question, { QuestionType } from '../../../src/entities/Question'
import User from '../../../src/entities/User'

describe('POST /exams/:examId/questions/:question/answer', () => {
  test('Unauthorized', async () => {
    const exam = await fixture<Exam>(Exam)
    const id = exam.id
    const questionNumber = 0
    const question = await load<Question>(Question, exam.questions[questionNumber].question)
    const body = {}

    if (question.type === QuestionType.CHOICE) {
      body['choice'] = 0
    } else if (question.type === QuestionType.TYPE) {
      body['answer'] = 'any'
    }

    const res = await request(app).post(`/exams/${ id.toString() }/questions/${ questionNumber }/answer`).send(body)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Not found (exam)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = await fakeId()
    const questionNumber = 0
    const res = await request(app).post(`/exams/${ id.toString() }/questions/${ questionNumber }/answer`).send({ choice: 0 }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Not found (question)', async () => {
    const exam = await fixture<Exam>(Exam)
    const user = await load<User>(User, exam.owner)
    const token = (await auth(user)).token
    const questionNumber = 999
    const res = await request(app).post(`/exams/${ exam.id.toString() }/questions/${ questionNumber }/answer`).send({ choice: 0 }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const exam = await fixture<Exam>(Exam)
    const id = exam.id
    const questionNumber = 0
    const res = await request(app).post(`/exams/${ id.toString() }/questions/${ questionNumber }/answer`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const exam = await fixture<Exam>(Exam)
    const id = exam.id
    const questionNumber = 0
    const question = await load<Question>(Question, exam.questions[questionNumber].question)
    const body = {}

    if (question.type === QuestionType.CHOICE) {
      body['choice'] = 0
    } else if (question.type === QuestionType.TYPE) {
      body['answer'] = 'any'
    }

    const res = await request(app).post(`/exams/${ id.toString() }/questions/${ questionNumber }/answer`).send(body).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Created', async () => {
    const exam = await fixture<Exam>(Exam)
    const id = exam.id
    const user = await load<User>(User, exam.owner)
    const token = (await auth(user)).token
    const questionNumber = 0
    const question = await load<Question>(Question, exam.questions[questionNumber].question)
    const body = {}

    if (question.type === QuestionType.CHOICE) {
      body['choice'] = 0
    } else if (question.type === QuestionType.TYPE) {
      body['answer'] = 'any'
    }

    const res = await request(app).post(`/exams/${ id.toString() }/questions/${ questionNumber }/answer`).send(body).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(201)
    expect(res.body).toHaveProperty('type')
    expect(res.body).toHaveProperty('difficulty')
  })
})