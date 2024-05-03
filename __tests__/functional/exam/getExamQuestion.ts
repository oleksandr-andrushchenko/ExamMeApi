import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, graphqlError, load, server as app } from '../../index'
import Exam from '../../../src/entities/Exam'
import User from '../../../src/entities/User'
import Question, { QuestionChoice, QuestionType } from '../../../src/entities/Question'
import ExamPermission from '../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { examQuestionQuery } from '../../graphql/exam/examQuestionQuery'

describe('Get exam question', () => {
  test('Unauthorized', async () => {
    const exam = await fixture<Exam>(Exam)
    const res = await request(app).get(`/exams/${ exam.id.toString() }/questions/0`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid exam id)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).get('/exams/invalid/questions/0').auth(token, { type: 'bearer' })

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
    const res = await request(app).get(`/exams/${ exam.id.toString() }/questions/${ questionNumber }`).auth(token, { type: 'bearer' })

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
    const user = await load<User>(User, exam.creator)
    const token = (await auth(user)).token
    const res = await request(app).get(`/exams/${ exam.id.toString() }/questions/999`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await fixture<User>(User)
    const exam = await fixture<Exam>(Exam)
    const token = (await auth(user)).token
    const res = await request(app).get(`/exams/${ exam.id.toString() }/questions/0`).auth(token, { type: 'bearer' })

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
    const permissions = [
      ExamPermission.GET,
      ExamPermission.GET_QUESTION,
    ]
    const user = await fixture<User>(User, { permissions })
    const token = (await auth(user)).token
    const res = await request(app).get(`/exams/${ exam.id.toString() }/questions/0`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    const examQuestion = exam.questions[0]
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
  test('Unauthorized (GraphQL)', async () => {
    const exam = await fixture<Exam>(Exam)
    const res = await request(app).post('/graphql')
      .send(examQuestionQuery({ examId: exam.id.toString(), question: 0 }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid exam id) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(examQuestionQuery({ examId: 'invalid', question: 0 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test.each([
    { case: 'invalid question number type', question: 'any' },
    { case: 'negative question number', question: -1 },
  ])('Bad request ($case) (GraphQL)', async ({ question }) => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const exam = await fixture<Exam>(Exam)
    const res = await request(app).post('/graphql')
      .send(examQuestionQuery({ examId: exam.id.toString(), question: question as number }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Not found (exam) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).post('/graphql')
      .send(examQuestionQuery({ examId: id.toString(), question: 0 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('NotFoundError'))
  })
  test('Not found (question number) (GraphQL)', async () => {
    const exam = await fixture<Exam>(Exam)
    const user = await load<User>(User, exam.creator)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(examQuestionQuery({ examId: exam.id.toString(), question: 999 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('NotFoundError'))
  })
  test('Forbidden (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const exam = await fixture<Exam>(Exam)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(examQuestionQuery({ examId: exam.id.toString(), question: 0 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Found (ownership) (GraphQL)', async () => {
    const exam = await fixture<Exam>(Exam)
    const user = await load<User>(User, exam.owner)
    const token = (await auth(user)).token
    const questionNumber = exam.getQuestionsCount() - 1
    const res = await request(app).post('/graphql')
      .send(examQuestionQuery(
        { examId: exam.id.toString(), question: questionNumber },
        [ 'difficulty', 'question', 'difficulty', 'type', 'choices', 'choice', 'answer' ],
      ))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    const examQuestion = exam.questions[questionNumber]
    const question = await load<Question>(Question, examQuestion.question)

    expect(res.body).toMatchObject({
      data: {
        examQuestion: {
          question: question.title,
          type: question.type,
          difficulty: question.difficulty,
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

    expect((await load<Exam>(Exam, exam.id)).questionNumber).toEqual(questionNumber)
  })
  test('Found (permission) (GraphQL)', async () => {
    const exam = await fixture<Exam>(Exam)
    const permissions = [
      ExamPermission.GET,
      ExamPermission.GET_QUESTION,
    ]
    const user = await fixture<User>(User, { permissions })
    const token = (await auth(user)).token
    const questionNumber = 0
    const res = await request(app).post('/graphql')
      .send(examQuestionQuery(
        { examId: exam.id.toString(), question: questionNumber },
        [ 'difficulty', 'question', 'difficulty', 'type', 'choices', 'choice', 'answer' ],
      ))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    const examQuestion = exam.questions[questionNumber]
    const question = await load<Question>(Question, examQuestion.question)

    expect(res.body).toMatchObject({
      data: {
        examQuestion: {
          question: question.title,
          type: question.type,
          difficulty: question.difficulty,
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

    expect((await load<Exam>(Exam, exam.id)).questionNumber).toEqual(exam.questionNumber)
  })
})