import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, graphqlError, load, server as app } from '../../index'
import Exam from '../../../src/entities/Exam'
import Question, { QuestionChoice, QuestionType } from '../../../src/entities/Question'
import User from '../../../src/entities/User'
// @ts-ignore
import { addExamQuestionAnswerMutation } from '../../graphql/exam/addExamQuestionAnswerMutation'
import CreateExamQuestionAnswerSchema from '../../../src/schema/exam/CreateExamQuestionAnswerSchema'

describe('Create exam question answer', () => {
  test('Unauthorized', async () => {
    const exam = await fixture<Exam>(Exam)
    const questionNumber = 0
    const question = await load<Question>(Question, exam.questions[questionNumber].question)
    const body = {}

    if (question.type === QuestionType.CHOICE) {
      body['choice'] = 0
    } else if (question.type === QuestionType.TYPE) {
      body['answer'] = 'any'
    }

    const res = await request(app).post(`/exams/${ exam.id.toString() }/questions/${ questionNumber }/answer`).send(body)

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
    const res = await request(app).post(`/exams/${ exam.id.toString() }/questions/0/answer`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const exam = await fixture<Exam>(Exam)
    const question = await load<Question>(Question, exam.questions[0].question)
    const body = {}

    if (question.type === QuestionType.CHOICE) {
      body['choice'] = 0
    } else if (question.type === QuestionType.TYPE) {
      body['answer'] = 'any'
    }

    const res = await request(app).post(`/exams/${ exam.id.toString() }/questions/0/answer`).send(body).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Created', async () => {
    const exam = await fixture<Exam>(Exam)
    const user = await load<User>(User, exam.owner)
    const token = (await auth(user)).token
    const question = await load<Question>(Question, exam.questions[0].question)
    const body = {}

    if (question.type === QuestionType.CHOICE) {
      body['choice'] = 0
    } else if (question.type === QuestionType.TYPE) {
      body['answer'] = 'any'
    }

    const res = await request(app).post(`/exams/${ exam.id.toString() }/questions/0/answer`).send(body).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(201)
    expect(res.body).toHaveProperty('type')
    expect(res.body).toHaveProperty('difficulty')
  })
  test('Unauthorized (GraphQL)', async () => {
    const exam = await fixture<Exam>(Exam)
    const questionNumber = 0
    const question = await load<Question>(Question, exam.questions[questionNumber].question)
    const examQuestionAnswer = {}

    if (question.type === QuestionType.CHOICE) {
      examQuestionAnswer['choice'] = 0
    } else if (question.type === QuestionType.TYPE) {
      examQuestionAnswer['answer'] = 'any'
    }

    const res = await request(app).post('/graphql')
      .send(addExamQuestionAnswerMutation({ examId: exam.id.toString(), question: questionNumber, examQuestionAnswer }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('AuthorizationRequiredError'))
  })
  test('Not found (exam) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = await fakeId()
    const questionNumber = 0
    const res = await request(app).post('/graphql')
      .send(addExamQuestionAnswerMutation({
        examId: id.toString(),
        question: questionNumber,
        examQuestionAnswer: { choice: 0 },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('NotFoundError'))
  })
  test('Not found (question) (GraphQL)', async () => {
    const exam = await fixture<Exam>(Exam)
    const user = await load<User>(User, exam.owner)
    const token = (await auth(user)).token
    const questionNumber = 999
    const res = await request(app).post('/graphql')
      .send(addExamQuestionAnswerMutation({
        examId: exam.id.toString(),
        question: questionNumber,
        examQuestionAnswer: { choice: 0 },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('NotFoundError'))
  })
  test('Bad request (empty body) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const exam = await fixture<Exam>(Exam)
    const examQuestionAnswer = undefined as CreateExamQuestionAnswerSchema
    const res = await request(app).post('/graphql')
      .send(addExamQuestionAnswerMutation({
        examId: exam.id.toString(),
        question: 0,
        examQuestionAnswer,
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Forbidden (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const exam = await fixture<Exam>(Exam)
    const question = await load<Question>(Question, exam.questions[0].question)
    const examQuestionAnswer = {}

    if (question.type === QuestionType.CHOICE) {
      examQuestionAnswer['choice'] = 0
    } else if (question.type === QuestionType.TYPE) {
      examQuestionAnswer['answer'] = 'any'
    }

    const res = await request(app).post('/graphql')
      .send(addExamQuestionAnswerMutation({
        examId: exam.id.toString(),
        question: 0,
        examQuestionAnswer,
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Created (GraphQL)', async () => {
    const exam = await fixture<Exam>(Exam)
    const user = await load<User>(User, exam.owner)
    const token = (await auth(user)).token
    const question = await load<Question>(Question, exam.questions[0].question)
    const questionNumber = 0
    const examQuestionAnswer = {}
    const expectedAddExamQuestionAnswer = {}

    if (question.type === QuestionType.CHOICE) {
      examQuestionAnswer['choice'] = 0
      expectedAddExamQuestionAnswer['choices'] = question.choices.map((choice: QuestionChoice) => choice.title)
      expectedAddExamQuestionAnswer['choice'] = examQuestionAnswer['choice']
    } else if (question.type === QuestionType.TYPE) {
      examQuestionAnswer['answer'] = 'any'
      expectedAddExamQuestionAnswer['answer'] = examQuestionAnswer['answer']
    }

    const res = await request(app).post('/graphql')
      .send(addExamQuestionAnswerMutation(
        {
          examId: exam.id.toString(),
          question: questionNumber,
          examQuestionAnswer,
        },
        [ 'number', 'question', 'difficulty', 'type', 'choices', 'choice', 'answer' ],
      ))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body.data.addExamQuestionAnswer).toMatchObject({
      ...examQuestionAnswer,
      ...expectedAddExamQuestionAnswer,
      ...{
        number: questionNumber,
        question: question.title,
        difficulty: question.difficulty,
        type: question.type,
      },
    })
  })
})