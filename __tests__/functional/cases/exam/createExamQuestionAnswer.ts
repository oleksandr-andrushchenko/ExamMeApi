import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../src/entities/Exam'
import Question, { QuestionChoice, QuestionType } from '../../../../src/entities/Question'
import User from '../../../../src/entities/User'
// @ts-ignore
import { addExamQuestionAnswerMutation } from '../../graphql/exam/addExamQuestionAnswerMutation'
import CreateExamQuestionAnswerSchema from '../../../../src/schema/exam/CreateExamQuestionAnswerSchema'
import ExamPermission from '../../../../src/enums/exam/ExamPermission'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Create exam question answer', () => {
  test('Unauthorized', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const questionNumber = 0
    const question = await framework.load<Question>(Question, exam.questions[questionNumber].questionId)
    const examQuestionAnswer = {}

    if (question.type === QuestionType.CHOICE) {
      examQuestionAnswer['choice'] = 0
    } else if (question.type === QuestionType.TYPE) {
      examQuestionAnswer['answer'] = 'any'
    }

    const res = await request(framework.app).post('/')
      .send(addExamQuestionAnswerMutation({ examId: exam.id.toString(), question: questionNumber, examQuestionAnswer }))

    console.log(res.body)
    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Not found (exam)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.CREATE_QUESTION_ANSWER ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const questionNumber = 0
    const res = await request(framework.app).post('/')
      .send(addExamQuestionAnswerMutation({
        examId: id.toString(),
        question: questionNumber,
        examQuestionAnswer: { choice: 0 },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Not found (question)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.ownerId)
    const token = (await framework.auth(user)).token
    const questionNumber = 999
    const res = await request(framework.app).post('/')
      .send(addExamQuestionAnswerMutation({
        examId: exam.id.toString(),
        question: questionNumber,
        examQuestionAnswer: { choice: 0 },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.CREATE_QUESTION_ANSWER ] })
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam)
    const examQuestionAnswer = undefined as CreateExamQuestionAnswerSchema
    const res = await request(framework.app).post('/')
      .send(addExamQuestionAnswerMutation({
        examId: exam.id.toString(),
        question: 0,
        examQuestionAnswer,
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam)
    const question = await framework.load<Question>(Question, exam.questions[0].questionId)
    const examQuestionAnswer = {}

    if (question.type === QuestionType.CHOICE) {
      examQuestionAnswer['choice'] = 0
    } else if (question.type === QuestionType.TYPE) {
      examQuestionAnswer['answer'] = 'any'
    }

    const res = await request(framework.app).post('/')
      .send(addExamQuestionAnswerMutation({
        examId: exam.id.toString(),
        question: 0,
        examQuestionAnswer,
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Created', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.ownerId)
    const token = (await framework.auth(user)).token
    const question = await framework.load<Question>(Question, exam.questions[0].questionId)
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

    const res = await request(framework.app).post('/')
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