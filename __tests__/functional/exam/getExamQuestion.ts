import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, load, server as app } from '../../index'
import Exam from '../../../src/entity/Exam'
import User from '../../../src/entity/User'
import Question, { QuestionChoice, QuestionType } from '../../../src/entity/Question'
import ExamPermission from '../../../src/enum/exam/ExamPermission'

describe('GET /exams/:examId/questions/:question', () => {
  test('Unauthorized', async () => {
    const exam = await fixture<Exam>(Exam)
    const id = exam.id
    const res = await request(app).get(`/exams/${ id.toString() }/questions/0`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid exam id)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = 'invalid'
    const res = await request(app).get(`/exams/${ id.toString() }/questions/0`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test.each([
    { case: 'invalid question number type', questionNumber: 'any' },
    { case: 'negative question number', questionNumber: -1 },
  ])('Bad request ($case)', async ({ questionNumber }) => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const exam = await fixture<Exam>(Exam)
    const id = exam.id
    const res = await request(app).get(`/exams/${ id.toString() }/questions/${ questionNumber }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Not found (exam)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).get(`/exams/${ id.toString() }/questions/0`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Not found (question number)', async () => {
    const exam = await fixture<Exam>(Exam)
    const id = exam.id
    const user = await load<User>(User, exam.creator)
    const token = (await auth(user)).token
    const res = await request(app).get(`/exams/${ id.toString() }/questions/999`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await fixture<User>(User)
    const exam = await fixture<Exam>(Exam)
    const id = exam.id
    const token = (await auth(user)).token
    const res = await request(app).get(`/exams/${ id.toString() }/questions/0`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Found (ownership)', async () => {
    const exam = await fixture<Exam>(Exam)
    const user = await load<User>(User, exam.owner)
    const token = (await auth(user)).token
    const questionNumber = exam.getQuestionsCount() - 1
    const res = await request(app).get(`/exams/${ exam.id.toString() }/questions/${ questionNumber }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    const examQuestion = exam.questions[questionNumber]
    const question = await load<Question>(Question, examQuestion.question)

    expect(res.body).toMatchObject({
      question: question.title,
      type: question.type,
      difficulty: question.difficulty,
    })

    if (question.type === QuestionType.CHOICE) {
      expect(res.body).toMatchObject({ choices: question.choices.map((choice: QuestionChoice) => choice.title) })

      if (examQuestion.choice) {
        expect(res.body).toHaveProperty('choice')
      }
    } else if (question.type === QuestionType.TYPE) {
      if (examQuestion.answer) {
        expect(res.body).toHaveProperty('answer')
      }
    }

    expect((await load<Exam>(Exam, exam.id)).questionNumber).toEqual(questionNumber)
  })
  test('Found (permission)', async () => {
    const exam = await fixture<Exam>(Exam)
    const id = exam.id
    const permissions = [
      ExamPermission.GET,
      ExamPermission.GET_QUESTION,
    ]
    const user = await fixture<User>(User, { permissions })
    const token = (await auth(user)).token
    const questionNumber = 0
    const res = await request(app).get(`/exams/${ id.toString() }/questions/${ questionNumber }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    const examQuestion = exam.questions[questionNumber]
    const question = await load<Question>(Question, examQuestion.question)

    expect(res.body).toMatchObject({
      question: question.title,
      type: question.type,
      difficulty: question.difficulty,
    })

    if (question.type === QuestionType.CHOICE) {
      expect(res.body).toMatchObject({ choices: question.choices.map((choice: QuestionChoice) => choice.title) })

      if (examQuestion.choice) {
        expect(res.body).toHaveProperty('choice')
      }
    } else if (question.type === QuestionType.TYPE) {
      if (examQuestion.answer) {
        expect(res.body).toHaveProperty('answer')
      }
    }

    expect((await load<Exam>(Exam, exam.id)).questionNumber).toEqual(exam.questionNumber)
  })
})