import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../src/entities/Exam'
import User from '../../../../src/entities/User'
import Question, { QuestionChoice, QuestionType } from '../../../../src/entities/Question'
import ExamPermission from '../../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { examQuestionQuery } from '../../graphql/exam/examQuestionQuery'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Get exam question', () => {
  test('Unauthorized', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).get(`/exams/${ exam.id.toString() }/questions/0`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(framework.error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid exam id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.GET_QUESTION ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).get('/exams/invalid/questions/0').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test.each([
    { case: 'invalid question number type', questionNumber: 'any' },
    { case: 'negative question number', questionNumber: -1 },
  ])('Bad request ($case)', async ({ questionNumber }) => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.GET_QUESTION ] })
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).get(`/exams/${ exam.id.toString() }/questions/${ questionNumber }`)
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Not found (exam)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.GET_QUESTION ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).get(`/exams/${ id.toString() }/questions/0`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(framework.error('NotFoundError'))
  })
  test('Not found (question number)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.ownerId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).get(`/exams/${ exam.id.toString() }/questions/999`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(framework.error('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const exam = await framework.fixture<Exam>(Exam)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).get(`/exams/${ exam.id.toString() }/questions/0`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(framework.error('ForbiddenError'))
  })
  test('Found (ownership)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.ownerId)
    const token = (await framework.auth(user)).token
    const questionNumber = exam.getQuestionsCount() - 1
    const res = await request(framework.app).get(`/exams/${ exam.id.toString() }/questions/${ questionNumber }`)
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    const examQuestion = exam.questions[questionNumber]
    const question = await framework.load<Question>(Question, examQuestion.questionId)

    expect(res.body).toMatchObject({
      number: questionNumber,
      question: question.title,
      difficulty: question.difficulty,
      type: question.type,
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

    expect((await framework.load<Exam>(Exam, exam.id)).questionNumber).toEqual(questionNumber)
  })
  test('Found (permission)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.GET_QUESTION ] })
    const token = (await framework.auth(user)).token
    const questionNumber = 0
    const res = await request(framework.app).get(`/exams/${ exam.id.toString() }/questions/${ questionNumber }`)
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    const examQuestion = exam.questions[0]
    const question = await framework.load<Question>(Question, examQuestion.questionId)

    expect(res.body).toMatchObject({
      number: questionNumber,
      question: question.title,
      difficulty: question.difficulty,
      type: question.type,
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

    expect((await framework.load<Exam>(Exam, exam.id)).questionNumber).toEqual(exam.questionNumber)
  })
  test('Unauthorized (GraphQL)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).post('/graphql')
      .send(examQuestionQuery({ examId: exam.id.toString(), question: 0 }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid exam id) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.GET_QUESTION ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(examQuestionQuery({ examId: 'invalid', question: 0 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test.each([
    { case: 'invalid question number type', question: 'any' },
    { case: 'negative question number', question: -1 },
  ])('Bad request ($case) (GraphQL)', async ({ question }) => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.GET_QUESTION ] })
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).post('/graphql')
      .send(examQuestionQuery({ examId: exam.id.toString(), question: question as number }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found (exam) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.GET_QUESTION ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/graphql')
      .send(examQuestionQuery({ examId: id.toString(), question: 0 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Not found (question number) (GraphQL)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.ownerId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(examQuestionQuery({ examId: exam.id.toString(), question: 999 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const exam = await framework.fixture<Exam>(Exam)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(examQuestionQuery({ examId: exam.id.toString(), question: 0 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Found (ownership) (GraphQL)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.ownerId)
    const token = (await framework.auth(user)).token
    const questionNumber = exam.getQuestionsCount() - 1
    const res = await request(framework.app).post('/graphql')
      .send(examQuestionQuery(
        { examId: exam.id.toString(), question: questionNumber },
        [ 'number', 'question', 'difficulty', 'type', 'choices', 'choice', 'answer' ],
      ))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    const examQuestion = exam.questions[questionNumber]
    const question = await framework.load<Question>(Question, examQuestion.questionId)

    expect(res.body).toMatchObject({
      data: {
        examQuestion: {
          number: questionNumber,
          question: question.title,
          difficulty: question.difficulty,
          type: question.type,
        },
      },
    })

    if (question.type === QuestionType.CHOICE) {
      expect(res.body.data.examQuestion.choices).toEqual(question.choices.map((choice: QuestionChoice) => choice.title))

      if (examQuestion.choice) {
        expect(res.body.data.examQuestion).toHaveProperty('choice')
      }
    } else if (question.type === QuestionType.TYPE) {
      if (examQuestion.answer) {
        expect(res.body.data.examQuestion).toHaveProperty('answer')
      }
    }

    expect((await framework.load<Exam>(Exam, exam.id)).questionNumber).toEqual(questionNumber)
  })
  test('Found (permission) (GraphQL)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.GET_QUESTION ] })
    const token = (await framework.auth(user)).token
    const questionNumber = 0
    const res = await request(framework.app).post('/graphql')
      .send(examQuestionQuery(
        { examId: exam.id.toString(), question: questionNumber },
        [ 'number', 'question', 'difficulty', 'type', 'choices', 'choice', 'answer' ],
      ))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    const examQuestion = exam.questions[questionNumber]
    const question = await framework.load<Question>(Question, examQuestion.questionId)

    expect(res.body).toMatchObject({
      data: {
        examQuestion: {
          number: questionNumber,
          question: question.title,
          difficulty: question.difficulty,
          type: question.type,
        },
      },
    })

    if (question.type === QuestionType.CHOICE) {
      expect(res.body.data.examQuestion.choices).toEqual(question.choices.map((choice: QuestionChoice) => choice.title))

      if (examQuestion.choice) {
        expect(res.body.data.examQuestion).toHaveProperty('choice')
      }
    } else if (question.type === QuestionType.TYPE) {
      if (examQuestion.answer) {
        expect(res.body.data.examQuestion).toHaveProperty('answer')
      }
    }

    expect((await framework.load<Exam>(Exam, exam.id)).questionNumber).toEqual(exam.questionNumber)
  })
})