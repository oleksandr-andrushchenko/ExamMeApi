import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/Category'
import Question, { QuestionAnswer, QuestionChoice, QuestionType } from '../../../../src/entities/Question'
// @ts-ignore
import { questionQuery } from '../../graphql/question/questionQuery'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Get question', () => {
  test('Not found (question)', async () => {
    const questionId = await framework.fakeId()
    const res = await request(framework.app).get(`/questions/${ questionId.toString() }`)

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(framework.error('NotFoundError'))
  })
  test('Bad request (invalid id)', async () => {
    const res = await request(framework.app).get('/questions/invalid')

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Found', async () => {
    const category = await framework.fixture<Category>(Category)
    const question = await framework.fixture<Question>(Question, { categoryId: category.id })
    const res = await request(framework.app).get(`/questions/${ question.id.toString() }`)

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      id: question.id.toString(),
      categoryId: category.id.toString(),
      type: question.type,
      difficulty: question.difficulty,
      title: question.title,
      voters: question.voters,
      rating: question.rating,
      ownerId: question.ownerId.toString(),
      createdAt: question.createdAt.getTime(),
    })

    if (question.updatedAt) {
      expect(res.body).toMatchObject({
        updatedAt: question.updatedAt.getTime(),
      })
    }

    if (question.type === QuestionType.TYPE) {
      expect(res.body).toHaveProperty('answers')
      question.answers.forEach((answer: QuestionAnswer, index: number) => {
        expect(res.body.answers[index]).toMatchObject(Object.assign({}, answer) as Record<string, any>)
      })
    } else if (question.type === QuestionType.CHOICE) {
      expect(res.body).toHaveProperty('choices')
      question.choices.forEach((choice: QuestionChoice, index: number) => {
        expect(res.body.choices[index]).toMatchObject(Object.assign({}, choice) as Record<string, any>)
      })
    }

    expect(res.body).not.toHaveProperty([ 'creatorId', 'deletedAt' ])
  })
  test('Not found (question) (GraphQL)', async () => {
    const questionId = await framework.fakeId()
    const res = await request(framework.app).post('/graphql').send(questionQuery({ questionId: questionId.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Bad request (invalid id) (GraphQL)', async () => {
    const res = await request(framework.app).post('/graphql').send(questionQuery({ questionId: 'invalid' }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Found (GraphQL)', async () => {
    const category = await framework.fixture<Category>(Category)
    const question = await framework.fixture<Question>(Question, { categoryId: category.id })
    const fields = [
      'id',
      'categoryId',
      'type',
      'difficulty',
      'title',
      'choices {title correct explanation}',
      'answers {variants correct explanation}',
      'voters',
      'rating',
      'ownerId',
      'createdAt',
      'updatedAt',
    ]
    const res = await request(framework.app).post('/graphql').send(questionQuery({ questionId: question.id.toString() }, fields))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      data: {
        question: {
          id: question.id.toString(),
          categoryId: question.categoryId.toString(),
          type: question.type,
          difficulty: question.difficulty,
          title: question.title,
          voters: question.voters,
          rating: question.rating,
          ownerId: question.ownerId.toString(),
          createdAt: question.createdAt.getTime(),
          updatedAt: question.updatedAt?.getTime() ?? null,
        },
      },
    })

    if (question.type === QuestionType.TYPE) {
      expect(res.body.data.question).toHaveProperty('answers')
      question.answers.forEach((answer: QuestionAnswer, index: number) => {
        expect(res.body.data.question.answers[index]).toMatchObject(Object.assign({}, answer) as Record<string, any>)
      })
    } else if (question.type === QuestionType.CHOICE) {
      expect(res.body.data.question).toHaveProperty('choices')
      question.choices.forEach((choice: QuestionChoice, index: number) => {
        expect(res.body.data.question.choices[index]).toMatchObject(Object.assign({}, choice) as Record<string, any>)
      })
    }

    expect(res.body.data.question).not.toHaveProperty([ 'creatorId', 'deletedAt' ])
  })
})