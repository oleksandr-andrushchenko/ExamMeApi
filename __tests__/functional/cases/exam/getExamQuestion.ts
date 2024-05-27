import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../src/entities/Exam'
import User from '../../../../src/entities/User'
import Question, { QuestionType } from '../../../../src/entities/Question'
import ExamPermission from '../../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { examQuestionQuery } from '../../graphql/exam/examQuestionQuery'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Get exam question', () => {
  test('Unauthorized', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).post('/')
      .send(examQuestionQuery({ examId: exam.id.toString(), question: 0 }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid exam id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.GET_QUESTION ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(examQuestionQuery({ examId: 'invalid', question: 0 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test.each([
    { case: 'invalid question number type', question: 'any' },
    { case: 'negative question number', question: -1 },
  ])('Bad request ($case)', async ({ question }) => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.GET_QUESTION ] })
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).post('/')
      .send(examQuestionQuery({ examId: exam.id.toString(), question: question as number }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found (exam)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.GET_QUESTION ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(examQuestionQuery({ examId: id.toString(), question: 0 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Not found (question number)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.ownerId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(examQuestionQuery({ examId: exam.id.toString(), question: 999 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const exam = await framework.fixture<Exam>(Exam)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(examQuestionQuery({ examId: exam.id.toString(), question: 0 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Found (ownership)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.ownerId)
    const token = (await framework.auth(user)).token
    const questionNumber = exam.questionCount() - 1
    const res = await request(framework.app).post('/')
      .send(examQuestionQuery(
        { examId: exam.id.toString(), question: questionNumber },
        [ 'exam {id}', 'question {id title type difficulty}', 'number', 'choice', 'answer' ],
      ))
      .auth(token, { type: 'bearer' })

    const examQuestion = exam.questions[questionNumber]
    const question = await framework.load<Question>(Question, examQuestion.questionId)

    expect(res.body).toMatchObject({
      data: {
        examQuestion: {
          exam: {
            id: exam.id.toString(),
          },
          question: {
            title: question.title,
            type: question.type,
            difficulty: question.difficulty,
          },
          number: questionNumber,
        },
      },
    })

    if (question.type === QuestionType.CHOICE) {
      if ('choice' in examQuestion) {
        expect(res.body.data.examQuestion).toHaveProperty('choice')
      }
    } else if (question.type === QuestionType.TYPE) {
      if ('answer' in examQuestion) {
        expect(res.body.data.examQuestion).toHaveProperty('answer')
      }
    }

    expect((await framework.load<Exam>(Exam, exam.id)).questionNumber).toEqual(questionNumber)
  })
  test('Found (permission)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.GET_QUESTION ] })
    const token = (await framework.auth(user)).token
    const questionNumber = 0
    const res = await request(framework.app).post('/')
      .send(examQuestionQuery(
        { examId: exam.id.toString(), question: questionNumber },
        [ 'exam {id}', 'question {id title type difficulty}', 'number', 'choice', 'answer' ],
      ))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    const examQuestion = exam.questions[questionNumber]
    const question = await framework.load<Question>(Question, examQuestion.questionId)

    expect(res.body).toMatchObject({
      data: {
        examQuestion: {
          exam: {
            id: exam.id.toString(),
          },
          question: {
            title: question.title,
            type: question.type,
            difficulty: question.difficulty,
          },
          number: questionNumber,
        },
      },
    })

    if (question.type === QuestionType.CHOICE) {
      if ('choice' in examQuestion) {
        expect(res.body.data.examQuestion).toHaveProperty('choice')
      }
    } else if (question.type === QuestionType.TYPE) {
      if ('answer' in examQuestion) {
        expect(res.body.data.examQuestion).toHaveProperty('answer')
      }
    }

    expect((await framework.load<Exam>(Exam, exam.id)).questionNumber).toEqual(exam.questionNumber)
  })
})