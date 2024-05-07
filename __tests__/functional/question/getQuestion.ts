import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { error, fakeId, fixture, graphqlError, server as app } from '../../index'
import Category from '../../../src/entities/Category'
import Question, { QuestionAnswer, QuestionChoice, QuestionType } from '../../../src/entities/Question'
// @ts-ignore
import { questionQuery } from '../../graphql/question/questionQuery'

describe('Get question', () => {
  test('Not found (question)', async () => {
    const questionId = await fakeId()
    const res = await request(app).get(`/questions/${ questionId.toString() }`)

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Bad request (invalid id)', async () => {
    const res = await request(app).get('/questions/invalid')

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Found', async () => {
    const category = await fixture<Category>(Category)
    const question = await fixture<Question>(Question, { category: category.id })
    const res = await request(app).get(`/questions/${ question.id.toString() }`)

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      id: question.id.toString(),
      category: category.id.toString(),
      type: question.type,
      difficulty: question.difficulty,
      title: question.title,
      voters: question.voters,
      rating: question.rating,
      owner: question.owner.toString(),
      created: question.created.getTime(),
    })

    if (question.updated) {
      expect(res.body).toMatchObject({
        updated: question.updated.getTime(),
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

    expect(res.body).not.toHaveProperty([ 'creator', 'deleted' ])
  })
  test('Not found (question) (GraphQL)', async () => {
    const questionId = await fakeId()
    const res = await request(app).post('/graphql').send(questionQuery({ questionId: questionId.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('NotFoundError'))
  })
  test('Bad request (invalid id) (GraphQL)', async () => {
    const res = await request(app).post('/graphql').send(questionQuery({ questionId: 'invalid' }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Found (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const question = await fixture<Question>(Question, { category: category.id })
    const fields = [
      'id',
      'category',
      'type',
      'difficulty',
      'title',
      'choices {title correct explanation}',
      'answers {variants correct explanation}',
      'voters',
      'rating',
      'owner',
      'created',
      'updated',
    ]
    const res = await request(app).post('/graphql').send(questionQuery({ questionId: question.id.toString() }, fields))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      data: {
        question: {
          id: question.id.toString(),
          category: question.category.toString(),
          type: question.type,
          difficulty: question.difficulty,
          title: question.title,
          voters: question.voters,
          rating: question.rating,
          owner: question.owner.toString(),
          created: question.created.getTime(),
          updated: question.updated?.getTime() ?? null,
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

    expect(res.body.data.question).not.toHaveProperty([ 'creator', 'deleted' ])
  })
})